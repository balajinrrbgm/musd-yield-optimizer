// Mezo Matsnet Testnet (Chain ID: 31611)
// Source: https://github.com/mezo-org/musd/tree/main/solidity/artifacts/deployments/matsnet

export const MATSNET_CHAIN_ID = 31611

export const MATSNET_ADDRESSES = {
  MUSD: "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  BorrowerOperations: "0xCdF7028ceAB81fA0C6971208e83fa7872994beE5",
  TroveManager: "0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0",
  StabilityPool: "0x1CCA7E410eE41739792eA0A24e00349Dd247680e",
  HintHelpers: "0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6",
  PriceFeed: "0x86bCF0841622a5dAC14A313a15f96A95421b9366",
  // Update after deployment:
  MUSDYieldVault: "0x0000000000000000000000000000000000000000",
} as const

export const MUSD_YIELD_VAULT_ABI = [
  // Read
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalDeployed() view returns (uint256)",
  "function performanceFee() view returns (uint256)",
  "function btcPerShareAccumulated() view returns (uint256)",
  "function pendingBTCReward(address user) view returns (uint256)",
  "function sharesToMUSD(uint256 shares) view returns (uint256)",
  "function vaultStats() view returns (uint256 totalMUSDDeployed, uint256 totalShares, uint256 spMUSDBalance, uint256 pendingBTCGain)",
  "function paused() view returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  // Write
  "function deposit(uint256 amount)",
  "function withdraw(uint256 shares)",
  "function harvest()",
  "function claimBTC()",
  // Events
  "event Deposited(address indexed user, uint256 musdAmount, uint256 shares)",
  "event Withdrawn(address indexed user, uint256 shares, uint256 musdAmount)",
  "event BTCHarvested(uint256 btcAmount, uint256 feeAmount)",
  "event BTCClaimed(address indexed user, uint256 amount)",
] as const

export const MUSD_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
] as const

export const STABILITY_POOL_ABI = [
  "function getTotalMUSDDeposits() view returns (uint256)",
  "function getDepositorCollateralGain(address depositor) view returns (uint256)",
  "function getCompoundedMUSDDeposit(address depositor) view returns (uint256)",
] as const

export const PRICE_FEED_ABI = [
  "function fetchPrice() view returns (uint256)",
] as const
