import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useBalance,
} from "wagmi"
import { parseEther, formatEther } from "viem"
import { useState, useCallback } from "react"
import {
  MATSNET_ADDRESSES,
  MUSD_YIELD_VAULT_ABI,
  MUSD_ABI,
  STABILITY_POOL_ABI,
  PRICE_FEED_ABI,
} from "../constants/addresses"

const vaultAddress = MATSNET_ADDRESSES.MUSDYieldVault as `0x${string}`
const musdAddress = MATSNET_ADDRESSES.MUSD as `0x${string}`
const stabilityPoolAddress = MATSNET_ADDRESSES.StabilityPool as `0x${string}`

export function useVault() {
  const { address, isConnected } = useAccount()

  // ── Read: Vault stats ────────────────────────────────────────────────────
  const { data: vaultStats, refetch: refetchStats } = useReadContract({
    address: vaultAddress,
    abi: MUSD_YIELD_VAULT_ABI,
    functionName: "vaultStats",
  })

  const { data: userShares } = useReadContract({
    address: vaultAddress,
    abi: MUSD_YIELD_VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: pendingBTCReward } = useReadContract({
    address: vaultAddress,
    abi: MUSD_YIELD_VAULT_ABI,
    functionName: "pendingBTCReward",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: userSharesMUSD } = useReadContract({
    address: vaultAddress,
    abi: MUSD_YIELD_VAULT_ABI,
    functionName: "sharesToMUSD",
    args: userShares ? [(userShares as bigint)] : undefined,
    query: { enabled: !!userShares && (userShares as bigint) > 0n },
  })

  const { data: musdBalance } = useReadContract({
    address: musdAddress,
    abi: MUSD_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const { data: musdAllowance } = useReadContract({
    address: musdAddress,
    abi: MUSD_ABI,
    functionName: "allowance",
    args: address ? [address, vaultAddress] : undefined,
    query: { enabled: !!address },
  })

  const { data: spTotalMUSD } = useReadContract({
    address: stabilityPoolAddress,
    abi: STABILITY_POOL_ABI,
    functionName: "getTotalMUSDDeposits",
  })

  const { data: vaultPaused } = useReadContract({
    address: vaultAddress,
    abi: MUSD_YIELD_VAULT_ABI,
    functionName: "paused",
  })

  const { data: btcPrice } = useReadContract({
    address: MATSNET_ADDRESSES.PriceFeed as `0x${string}`,
    abi: PRICE_FEED_ABI,
    functionName: "fetchPrice",
  })

  const { data: btcBalance } = useBalance({
    address: address,
    query: { enabled: !!address },
  })

  // ── Write: deposit ────────────────────────────────────────────────────────
  const { writeContract: writeApprove, data: approveTxHash } = useWriteContract()
  const { writeContract: writeDeposit, data: depositTxHash } = useWriteContract()
  const { writeContract: writeWithdraw, data: withdrawTxHash } = useWriteContract()
  const { writeContract: writeHarvest, data: harvestTxHash } = useWriteContract()
  const { writeContract: writeClaim, data: claimTxHash } = useWriteContract()

  const { isLoading: isApprovePending } = useWaitForTransactionReceipt({ hash: approveTxHash })
  const { isLoading: isDepositPending } = useWaitForTransactionReceipt({ hash: depositTxHash })
  const { isLoading: isWithdrawPending } = useWaitForTransactionReceipt({ hash: withdrawTxHash })
  const { isLoading: isHarvestPending } = useWaitForTransactionReceipt({ hash: harvestTxHash })
  const { isLoading: isClaimPending } = useWaitForTransactionReceipt({ hash: claimTxHash })

  const approve = useCallback(
    (amount: string) => {
      writeApprove({
        address: musdAddress,
        abi: MUSD_ABI,
        functionName: "approve",
        args: [vaultAddress, parseEther(amount)],
      })
    },
    [writeApprove]
  )

  const deposit = useCallback(
    (amount: string) => {
      writeDeposit({
        address: vaultAddress,
        abi: MUSD_YIELD_VAULT_ABI,
        functionName: "deposit",
        args: [parseEther(amount)],
      })
    },
    [writeDeposit]
  )

  const withdraw = useCallback(
    (shares: bigint) => {
      writeWithdraw({
        address: vaultAddress,
        abi: MUSD_YIELD_VAULT_ABI,
        functionName: "withdraw",
        args: [shares],
      })
    },
    [writeWithdraw]
  )

  const harvest = useCallback(() => {
    writeHarvest({
      address: vaultAddress,
      abi: MUSD_YIELD_VAULT_ABI,
      functionName: "harvest",
    })
  }, [writeHarvest])

  const claimBTC = useCallback(() => {
    writeClaim({
      address: vaultAddress,
      abi: MUSD_YIELD_VAULT_ABI,
      functionName: "claimBTC",
    })
  }, [writeClaim]
  )

  // Explicit casts — wagmi returns `unknown` when abi is a string array
  const userSharesN     = (userShares      as bigint | undefined) ?? 0n
  const pendingBTCN     = (pendingBTCReward as bigint | undefined) ?? 0n
  const userSharesMUSDN = (userSharesMUSD  as bigint | undefined) ?? 0n
  const musdBalN        = (musdBalance     as bigint | undefined) ?? 0n
  const musdAllowN      = (musdAllowance   as bigint | undefined) ?? 0n
  const spTotalN        = (spTotalMUSD     as bigint | undefined) ?? 0n
  const btcPriceN       = (btcPrice        as bigint | undefined) ?? 0n
  const vaultPausedB    = (vaultPaused     as boolean | undefined) ?? false
  const vaultStatsTuple = (vaultStats as [bigint, bigint, bigint, bigint] | undefined) ?? [0n, 0n, 0n, 0n] as [bigint, bigint, bigint, bigint]

  const needsApproval = useCallback(
    (amount: string) => {
      try {
        const amountWei = parseEther(amount)
        return musdAllowN < amountWei
      } catch {
        return true
      }
    },
    [musdAllowN]
  )

  return {
    isConnected,
    address,
    // Vault data
    vaultStats: vaultStatsTuple,
    userShares: userSharesN,
    userSharesMUSD: userSharesMUSDN,
    pendingBTCReward: pendingBTCN,
    musdBalance: musdBalN,
    musdAllowance: musdAllowN,
    spTotalMUSD: spTotalN,
    vaultPaused: vaultPausedB,
    btcPrice: btcPriceN,
    btcBalance,
    // Actions
    approve,
    deposit,
    withdraw,
    harvest,
    claimBTC,
    needsApproval,
    refetchStats,
    // Loading states
    isApprovePending,
    isDepositPending,
    isWithdrawPending,
    isHarvestPending,
    isClaimPending,
  }
}
