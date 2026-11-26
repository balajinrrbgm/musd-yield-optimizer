// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice MockStabilityPool — simulates Mezo StabilityPool for local tests.
 *
 * Behaviour:
 *  - provideToSP: pulls MUSD from caller, tracks per-caller deposit
 *  - withdrawFromSP(0): simulates BTC gain distribution (sends test BTC if funded)
 *  - withdrawFromSP(n): returns MUSD to caller proportionally
 *  - getCompoundedMUSDDeposit: returns recorded deposit
 *  - getDepositorCollateralGain: returns 0 (no auto-accrual in mock)
 */
contract MockStabilityPool {
    IERC20 public musd;

    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;

    // Optional: can be funded with BTC (ether) to simulate gains
    mapping(address => uint256) public btcGains;

    constructor(address _musd) {
        musd = IERC20(_musd);
    }

    /// @notice Simulate: owner deposits BTC as if liquidation happened
    function simulateBTCGain(address depositor, uint256 amount) external payable {
        btcGains[depositor] += amount;
    }

    function provideToSP(uint256 amount) external {
        musd.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
        totalDeposits += amount;
    }

    function withdrawFromSP(uint256 amount) external {
        if (amount == 0) {
            // Harvest: send any pending BTC gain
            uint256 gain = btcGains[msg.sender];
            if (gain > 0) {
                btcGains[msg.sender] = 0;
                (bool ok, ) = msg.sender.call{value: gain}("");
                require(ok, "BTC transfer failed");
            }
            return;
        }

        uint256 available = deposits[msg.sender];
        uint256 toReturn = amount > available ? available : amount;
        deposits[msg.sender] -= toReturn;
        totalDeposits -= toReturn;
        musd.transfer(msg.sender, toReturn);
    }

    function getCompoundedMUSDDeposit(address depositor) external view returns (uint256) {
        return deposits[depositor];
    }

    function getDepositorCollateralGain(address depositor) external view returns (uint256) {
        return btcGains[depositor];
    }

    function getTotalMUSDDeposits() external view returns (uint256) {
        return totalDeposits;
    }

    receive() external payable {}
}
