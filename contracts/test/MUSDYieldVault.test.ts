import { expect } from "chai"
import { ethers } from "hardhat"
import { MUSDYieldVault } from "../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

describe("MUSDYieldVault", function () {
  let vault: MUSDYieldVault
  let owner: SignerWithAddress
  let user1: SignerWithAddress
  let user2: SignerWithAddress
  let treasury: SignerWithAddress

  // Mock contracts for local testing
  let mockMUSD: any
  let mockStabilityPool: any

  beforeEach(async () => {
    ;[owner, user1, user2, treasury] = await ethers.getSigners()

    // Deploy MockMUSD
    const MockERC20 = await ethers.getContractFactory("MockERC20")
    mockMUSD = await MockERC20.deploy("Mezo USD", "MUSD")

    // Deploy MockStabilityPool
    const MockSP = await ethers.getContractFactory("MockStabilityPool")
    mockStabilityPool = await MockSP.deploy(await mockMUSD.getAddress())

    // Deploy Vault
    const Vault = await ethers.getContractFactory("MUSDYieldVault")
    vault = await Vault.deploy(
      await mockMUSD.getAddress(),
      await mockStabilityPool.getAddress(),
      treasury.address
    )

    // Mint MUSD to users
    await mockMUSD.mint(user1.address, ethers.parseEther("1000"))
    await mockMUSD.mint(user2.address, ethers.parseEther("500"))
  })

  describe("Deployment", () => {
    it("sets correct addresses", async () => {
      expect(await vault.musd()).to.equal(await mockMUSD.getAddress())
      expect(await vault.stabilityPool()).to.equal(await mockStabilityPool.getAddress())
      expect(await vault.treasury()).to.equal(treasury.address)
    })

    it("has correct name and symbol", async () => {
      expect(await vault.name()).to.equal("Mezo MUSD Yield Vault")
      expect(await vault.symbol()).to.equal("mYVAULT")
    })

    it("starts with 1% performance fee", async () => {
      expect(await vault.performanceFee()).to.equal(100)
    })
  })

  describe("Deposit", () => {
    it("mints correct shares on first deposit", async () => {
      const amount = ethers.parseEther("100")
      await mockMUSD.connect(user1).approve(await vault.getAddress(), amount)
      await vault.connect(user1).deposit(amount)

      expect(await vault.balanceOf(user1.address)).to.equal(amount)
    })

    it("reverts on zero deposit", async () => {
      await expect(vault.connect(user1).deposit(0)).to.be.revertedWithCustomError(
        vault,
        "ZeroAmount"
      )
    })

    it("emits Deposited event", async () => {
      const amount = ethers.parseEther("100")
      await mockMUSD.connect(user1).approve(await vault.getAddress(), amount)
      await expect(vault.connect(user1).deposit(amount))
        .to.emit(vault, "Deposited")
        .withArgs(user1.address, amount, amount)
    })
  })

  describe("Withdraw", () => {
    it("returns MUSD proportionally", async () => {
      const amount = ethers.parseEther("100")
      await mockMUSD.connect(user1).approve(await vault.getAddress(), amount)
      await vault.connect(user1).deposit(amount)

      const shares = await vault.balanceOf(user1.address)
      const musdBefore = await mockMUSD.balanceOf(user1.address)
      await vault.connect(user1).withdraw(shares)
      const musdAfter = await mockMUSD.balanceOf(user1.address)

      expect(musdAfter - musdBefore).to.be.closeTo(amount, ethers.parseEther("0.001"))
    })

    it("reverts on insufficient shares", async () => {
      await expect(
        vault.connect(user1).withdraw(ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(vault, "InsufficientShares")
    })
  })

  describe("Admin", () => {
    it("owner can update performance fee", async () => {
      await vault.setPerformanceFee(200)
      expect(await vault.performanceFee()).to.equal(200)
    })

    it("reverts fee > MAX_PERFORMANCE_FEE", async () => {
      await expect(vault.setPerformanceFee(1001)).to.be.revertedWithCustomError(
        vault,
        "FeeTooHigh"
      )
    })

    it("owner can pause and unpause", async () => {
      await vault.pause()
      const amount = ethers.parseEther("10")
      await mockMUSD.connect(user1).approve(await vault.getAddress(), amount)
      await expect(vault.connect(user1).deposit(amount)).to.be.reverted

      await vault.unpause()
      await vault.connect(user1).deposit(amount) // should succeed
    })
  })
})
