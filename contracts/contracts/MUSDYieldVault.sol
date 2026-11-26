// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MUSDYieldVault
 * @notice ERC20 shares vault that deposits MUSD into Mezo StabilityPool
 *         to earn BTC collateral gains from liquidations.
 *         - Users deposit MUSD → receive vault shares
 *         - BTC gains from liquidations are harvested & distributed proportionally
 *         - 1% performance fee on BTC gains (sent to treasury)
 *         - Emergency pause and withdrawal support
 *
 * @dev Mezo Hackathon - Supernormal dApps / MUSD Track
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IMUSD.sol";
import "./interfaces/IStabilityPool.sol";

contract MUSDYieldVault is ERC20, ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IMUSD;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_PERFORMANCE_FEE = 1000; // 10% max
    uint256 public constant PERFORMANCE_FEE_DENOMINATOR = 10_000;

    // ─── Immutables ───────────────────────────────────────────────────────────
    IMUSD public immutable musd;
    IStabilityPool public immutable stabilityPool;

    // ─── State ────────────────────────────────────────────────────────────────
    address public treasury;
    uint256 public performanceFee = 100; // 1% default

    /// @notice Accumulated BTC (native) earned per vault share (scaled by PRECISION)
    uint256 public btcPerShareAccumulated;

    /// @notice Snapshot of btcPerShareAccumulated at time of last deposit/claim per user
    mapping(address => uint256) public btcPerShareSnapshot;

    /// @notice Pending BTC rewards owed to each user (not yet claimed)
    mapping(address => uint256) public pendingBTC;

    /// @notice Total MUSD currently deployed to StabilityPool
    uint256 public totalDeployed;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 musdAmount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 musdAmount);
    event BTCHarvested(uint256 btcAmount, uint256 feeAmount);
    event BTCClaimed(address indexed user, uint256 amount);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event EmergencyWithdraw(address indexed user, uint256 musdAmount);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error ZeroAmount();
    error InsufficientShares();
    error ZeroAddress();
    error FeeTooHigh();

    // ─────────────────────────────────────────────────────────────────────────
    constructor(
        address _musd,
        address _stabilityPool,
        address _treasury
    ) ERC20("Mezo MUSD Yield Vault", "mYVAULT") Ownable(msg.sender) {
        if (_musd == address(0) || _stabilityPool == address(0) || _treasury == address(0))
            revert ZeroAddress();
        musd = IMUSD(_musd);
        stabilityPool = IStabilityPool(_stabilityPool);
        treasury = _treasury;
    }

    // ─── Receive native BTC ───────────────────────────────────────────────────
    receive() external payable {}

    // ─── External: deposit ────────────────────────────────────────────────────

    /**
     * @notice Deposit MUSD and receive vault shares.
     * @param amount MUSD amount to deposit (18 decimals).
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();

        // Update rewards for this user before minting new shares
        _updateReward(msg.sender);

        // Calculate shares: if first deposit, 1:1 ratio
        uint256 shares;
        uint256 supply = totalSupply();
        if (supply == 0) {
            shares = amount;
        } else {
            // shares ∝ deposit / totalMUSD
            shares = (amount * supply) / _totalMUSDAvailable();
        }

        // Pull MUSD from user
        musd.safeTransferFrom(msg.sender, address(this), amount);

        // Deploy to stability pool
        musd.approve(address(stabilityPool), amount);
        stabilityPool.provideToSP(amount);
        totalDeployed += amount;

        // Mint vault shares
        _mint(msg.sender, shares);

        emit Deposited(msg.sender, amount, shares);
    }

    // ─── External: withdraw ───────────────────────────────────────────────────

    /**
     * @notice Redeem vault shares for MUSD (+ any accrued BTC rewards).
     * @param shares Number of vault shares to redeem.
     */
    function withdraw(uint256 shares) external nonReentrant whenNotPaused {
        if (shares == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < shares) revert InsufficientShares();

        // Claim pending BTC first
        _updateReward(msg.sender);
        _claimBTC(msg.sender);

        // Proportional MUSD to return
        uint256 musdOut = (shares * _totalMUSDAvailable()) / totalSupply();

        // Burn shares
        _burn(msg.sender, shares);

        // Withdraw from stability pool
        uint256 spBalance = stabilityPool.getCompoundedMUSDDeposit(address(this));
        if (spBalance > 0) {
            uint256 withdrawAmount = musdOut > spBalance ? spBalance : musdOut;
            stabilityPool.withdrawFromSP(withdrawAmount);
            totalDeployed -= withdrawAmount < totalDeployed ? withdrawAmount : totalDeployed;
        }

        // Transfer MUSD to user
        uint256 balance = musd.balanceOf(address(this));
        uint256 toSend = musdOut > balance ? balance : musdOut;
        musd.safeTransfer(msg.sender, toSend);

        emit Withdrawn(msg.sender, shares, toSend);
    }

    // ─── External: harvest BTC gains ──────────────────────────────────────────

    /**
     * @notice Harvest BTC collateral gains from the StabilityPool.
     *         Callable by anyone; distributes BTC proportionally to all shareholders.
     */
    function harvest() external nonReentrant whenNotPaused {
        uint256 btcBefore = address(this).balance;

        // Withdrawing 0 MUSD from SP triggers BTC gain distribution
        stabilityPool.withdrawFromSP(0);

        uint256 btcReceived = address(this).balance - btcBefore;
        if (btcReceived == 0) return;

        // Take performance fee
        uint256 fee = (btcReceived * performanceFee) / PERFORMANCE_FEE_DENOMINATOR;
        uint256 btcForUsers = btcReceived - fee;

        // Send fee to treasury
        if (fee > 0) {
            (bool ok, ) = treasury.call{value: fee}("");
            require(ok, "Fee transfer failed");
        }

        // Accumulate BTC per share
        uint256 supply = totalSupply();
        if (supply > 0 && btcForUsers > 0) {
            btcPerShareAccumulated += (btcForUsers * PRECISION) / supply;
        }

        // Re-deposit any MUSD that was freed during SP withdrawal
        uint256 musdBalance = musd.balanceOf(address(this));
        if (musdBalance > 0) {
            musd.approve(address(stabilityPool), musdBalance);
            stabilityPool.provideToSP(musdBalance);
            totalDeployed += musdBalance;
        }

        emit BTCHarvested(btcReceived, fee);
    }

    // ─── External: claim BTC rewards ─────────────────────────────────────────

    /**
     * @notice Claim accumulated BTC rewards.
     */
    function claimBTC() external nonReentrant {
        _updateReward(msg.sender);
        _claimBTC(msg.sender);
    }

    // ─── View: pending BTC for a user ────────────────────────────────────────

    /**
     * @notice Returns total claimable BTC for `user`.
     */
    function pendingBTCReward(address user) external view returns (uint256) {
        uint256 shares = balanceOf(user);
        uint256 newBtcPerShare = btcPerShareAccumulated - btcPerShareSnapshot[user];
        return pendingBTC[user] + (shares * newBtcPerShare) / PRECISION;
    }

    /**
     * @notice Returns current MUSD value of `shares`.
     */
    function sharesToMUSD(uint256 shares) external view returns (uint256) {
        uint256 supply = totalSupply();
        if (supply == 0) return shares;
        return (shares * _totalMUSDAvailable()) / supply;
    }

    /**
     * @notice Returns vault APY-related stats (off-chain computed).
     */
    function vaultStats()
        external
        view
        returns (
            uint256 totalMUSDDeployed,
            uint256 totalShares,
            uint256 spMUSDBalance,
            uint256 pendingBTCGain
        )
    {
        totalMUSDDeployed = totalDeployed;
        totalShares = totalSupply();
        spMUSDBalance = stabilityPool.getCompoundedMUSDDeposit(address(this));
        pendingBTCGain = stabilityPool.getDepositorCollateralGain(address(this));
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setPerformanceFee(uint256 _fee) external onlyOwner {
        if (_fee > MAX_PERFORMANCE_FEE) revert FeeTooHigh();
        emit PerformanceFeeUpdated(performanceFee, _fee);
        performanceFee = _fee;
    }

    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Emergency withdrawal - bypasses normal flow. Admin only.
     *         Withdraws all MUSD from SP and pauses the vault.
     */
    function emergencyWithdrawAll() external onlyOwner {
        _pause();
        uint256 spBalance = stabilityPool.getCompoundedMUSDDeposit(address(this));
        if (spBalance > 0) {
            stabilityPool.withdrawFromSP(spBalance);
        }
        totalDeployed = 0;
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _totalMUSDAvailable() internal view returns (uint256) {
        return stabilityPool.getCompoundedMUSDDeposit(address(this)) +
               musd.balanceOf(address(this));
    }

    function _updateReward(address user) internal {
        uint256 shares = balanceOf(user);
        if (shares > 0) {
            uint256 newBtcPerShare = btcPerShareAccumulated - btcPerShareSnapshot[user];
            pendingBTC[user] += (shares * newBtcPerShare) / PRECISION;
        }
        btcPerShareSnapshot[user] = btcPerShareAccumulated;
    }

    function _claimBTC(address user) internal {
        uint256 reward = pendingBTC[user];
        if (reward == 0) return;
        pendingBTC[user] = 0;

        (bool ok, ) = user.call{value: reward}("");
        require(ok, "BTC transfer failed");

        emit BTCClaimed(user, reward);
    }

    // Override transfer hooks to update rewards on share movement
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0)) _updateReward(from);
        if (to != address(0) && to != from) _updateReward(to);
        super._update(from, to, value);
    }
}
