# MezoYield — MUSD Auto-Yield Vault

> **Mezo Hackathon: Building Bitcoin's Future**  
> Track: **Supernormal dApps — MUSD Track**

## Overview

MezoYield is a yield-optimizing vault that automatically deploys MUSD into Mezo's Stability Pool to earn BTC from protocol liquidations. By pooling user deposits and auto-compounding, it makes yield generation effortless — and lets borrowers earn back their 1% borrowing cost.

```
User deposits MUSD
        ↓
   MUSDYieldVault (ERC20 shares)
        ↓
  Mezo StabilityPool
        ↓
  Earns BTC from liquidations
        ↓
  harvest() → distribute BTC pro-rata
        ↓
  Users claimBTC() or withdraw()
```

## Key Features

| Feature | Description |
|---------|-------------|
| 📈 **Auto-Yield** | Deploys all MUSD to the Stability Pool automatically |
| ₿ **BTC Rewards** | Earn native BTC (Mezo's native token) from liquidation gains |
| 🔄 **Auto-Compound** | Harvested MUSD re-deployed to maximize SP position |
| 🪙 **ERC20 Shares** | Vault shares are transferable (yield-bearing MUSD positions) |
| 🛡 **Battle-tested** | OpenZeppelin ReentrancyGuard, Pausable, Ownable |
| 💰 **1% Protocol Fee** | Small performance fee on harvested BTC, to treasury |

## Architecture

```
contracts/
  contracts/
    MUSDYieldVault.sol        ← Main vault (ERC20 + Stability Pool integration)
    interfaces/
      IMUSD.sol               ← MUSD token interface
      IStabilityPool.sol      ← Stability Pool interface
  scripts/deploy.ts
  test/MUSDYieldVault.test.ts
frontend/
  src/
    constants/addresses.ts   ← Matsnet addresses + ABIs
    config/wagmi.ts          ← @mezo-org/passport wallet config
    hooks/useVault.ts        ← All vault hooks (read + write)
    components/
      Header.tsx             ← Navigation + Connect button
      VaultDashboard.tsx     ← Protocol stats + harvest
      DepositForm.tsx        ← Deposit flow (approve → deposit)
      WithdrawForm.tsx       ← Withdraw + claim BTC
    App.tsx                  ← Main layout
```

## Matsnet Deployed Addresses

| Contract | Address |
|----------|---------|
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |
| StabilityPool | `0x1CCA7E410eE41739792eA0A24e00349Dd247680e` |
| MUSDYieldVault | *(deploy and update `addresses.ts`)* |

## Quick Start

### Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env: DEPLOYER_PRIVATE_KEY=0x...

# Compile
npm run compile

# Test
npm run test

# Deploy to Matsnet
npm run deploy:matsnet
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

Update `frontend/src/constants/addresses.ts` with the deployed `MUSDYieldVault` address.

## How It Works

1. **Deposit**: User approves MUSD → calls `deposit(amount)` → vault routes to Stability Pool → user gets shares
2. **Yield Accrual**: As the protocol liquidates undercollateralized troves, the Stability Pool absorbs MUSD and receives BTC collateral
3. **Harvest**: Anyone calls `harvest()` → vault collects accumulated BTC from SP → distributes per-share
4. **Claim**: User calls `claimBTC()` → receives their proportional BTC rewards
5. **Withdraw**: User calls `withdraw(shares)` → burns shares → receives MUSD back from SP

## Hackathon Scoring Alignment

| Criterion | Score | How We Deliver |
|-----------|-------|----------------|
| Mezo Integration | 30% | Deep MUSD + StabilityPool integration; reads PriceFeed |
| Technical | 20% | Secure vault pattern, ERC20 shares, ReentrancyGuard |
| Business Viability | 30% | Solves real need: auto-yield on MUSD without manual SP management |
| UX | 10% | 2-step deposit, live stats, slider withdraw, BTC claim |
| Presentation | 10% | Clean dark UI, Matsnet badge, real-time data |

## Network Info

- **Chain**: Mezo Matsnet Testnet
- **Chain ID**: 31611
- **RPC**: https://rpc.test.mezo.org
- **Explorer**: https://explorer.test.mezo.org
- **Native Token**: BTC (18 decimals)

## Security

- `ReentrancyGuard` on all state-changing functions
- `Pausable` for emergency stops
- `SafeERC20` for all token transfers
- 1% performance fee cap enforced on-chain
- No admin key with withdraw powers — owner can only pause/unpause and set fee

## License

MIT
