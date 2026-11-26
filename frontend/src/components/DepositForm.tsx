import { useState } from "react"
import { formatEther } from "viem"
import { useVault } from "../hooks/useVault"

export function DepositForm() {
  const [amount, setAmount] = useState("")
  const {
    musdBalance,
    musdAllowance,
    needsApproval,
    approve,
    deposit,
    isApprovePending,
    isDepositPending,
    vaultPaused,
    isConnected,
  } = useVault()

  const musdBalanceFormatted = Number(formatEther(musdBalance)).toFixed(4)
  const requiresApproval = amount ? needsApproval(amount) : false

  const handleMax = () => {
    setAmount(formatEther(musdBalance))
  }

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) return
    if (requiresApproval) {
      approve(amount)
    } else {
      deposit(amount)
    }
  }

  const isLoading = isApprovePending || isDepositPending

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold text-white">Deposit MUSD</h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-[#8888aa]">Amount</label>
          <button
            onClick={handleMax}
            className="text-xs text-mezo hover:text-mezo-dark transition-colors"
          >
            Max: {musdBalanceFormatted} MUSD
          </button>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            className="input-field pr-16"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#8888aa] font-medium">
            MUSD
          </div>
        </div>
      </div>

      {/* Approval progress */}
      {requiresApproval && amount && (
        <div className="flex items-center gap-2 text-xs text-[#8888aa]">
          <div className="flex gap-1">
            <span className="w-5 h-5 rounded-full bg-[#2a2a3a] border-2 border-mezo flex items-center justify-center text-[10px]">
              1
            </span>
            <span className="w-5 h-5 rounded-full bg-[#2a2a3a] flex items-center justify-center text-[10px]">
              2
            </span>
          </div>
          <span>Step 1/2: Approve MUSD spending</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isConnected || !amount || parseFloat(amount) <= 0 || isLoading || vaultPaused}
        className="btn-primary w-full"
      >
        {!isConnected
          ? "Connect Wallet"
          : isLoading
          ? "Processing…"
          : requiresApproval
          ? "Approve MUSD"
          : "Deposit"}
      </button>

      <p className="text-xs text-[#8888aa] text-center">
        Deposits earn BTC rewards from Mezo liquidations · 1% performance fee on gains
      </p>
    </div>
  )
}
