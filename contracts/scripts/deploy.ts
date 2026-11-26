import { ethers } from "hardhat"

// Mezo Matsnet Testnet Contract Addresses
const MUSD_ADDRESS = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503"
const STABILITY_POOL_ADDRESS = "0x1CCA7E410eE41739792eA0A24e00349Dd247680e"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying MUSDYieldVault with account:", deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log("Account balance (BTC):", ethers.formatEther(balance))

  const treasury = deployer.address // Set to your treasury address before mainnet

  console.log("\nDeploying MUSDYieldVault...")
  const MUSDYieldVault = await ethers.getContractFactory("MUSDYieldVault")
  const vault = await MUSDYieldVault.deploy(
    MUSD_ADDRESS,
    STABILITY_POOL_ADDRESS,
    treasury
  )
  await vault.waitForDeployment()

  const vaultAddress = await vault.getAddress()
  console.log("MUSDYieldVault deployed to:", vaultAddress)

  console.log("\n=== Deployment Summary ===")
  console.log("Network:          Mezo Matsnet Testnet (31611)")
  console.log("MUSD:             ", MUSD_ADDRESS)
  console.log("StabilityPool:    ", STABILITY_POOL_ADDRESS)
  console.log("MUSDYieldVault:   ", vaultAddress)
  console.log("Treasury:         ", treasury)
  console.log("\nVerify with:")
  console.log(`npx hardhat verify --network matsnet ${vaultAddress} ${MUSD_ADDRESS} ${STABILITY_POOL_ADDRESS} ${treasury}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
