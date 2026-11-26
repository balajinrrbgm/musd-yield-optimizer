import { useState } from "react"
import { formatEther } from "viem"
import { useVault } from "../hooks/useVault"

export function WithdrawForm() {
  const [pct, setPct] = useState(100)
  const {
    userShares,
    userSharesMUSD,
    pendingBTCReward,
    withdraw,
    claimBTC,
    isWithdrawPending,
    isClaimPending,
    isConnected,
  } = useVault()

  const musdValue = Number(formatEther(userSharesMUSD)).toFixed(4)
  const btcReward = Number(formatEther(pendingBTCReward)).toFixed(8)
  const sharesToWithdraw = (userShares * BigInt(pct)) / 100n

  const musdOut = Number(formatEther(userSharesMUSD)) * (pct / 100)

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold text-white">Your Position</h3>

      {/* Position summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0a0a0f] rounded-xl p-3">
          <p className="text-xs text-[#8888aa]">MUSD Deposited</p>
          <p className="text-lg font-bold text-white mt-1">{musdValue}</p>
          <p className="text-xs text-[#8888aa]">MUSD</p>
        </div>
        <div className="bg-[#0a0a0f] rounded-xl p-3">
          <p className="text-xs text-[#8888aa]">BTC Rewards</p>
          <p className="text-lg font-bold text-btc mt-1">{btcReward}</p>
          <p className="text-xs text-[#8888aa]">BTC</p>
        </div>
      </div>

      {/* Withdraw slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-[#8888aa]">Withdraw Amount</label>
          <span className="text-sm text-white font-medium">{pct}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-full accent-mezo"
        />
        <div className="flex justify-between text-xs text-[#8888aa]">
          <span>~{(musdOut).toFixed(2)} MUSD</span>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => setPct(p)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  pct === p ? "bg-mezo text-white" : "bg-[#2a2a3a] hover:bg-[#3a3a4a]"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => withdraw(sharesToWithdraw)}
          disabled={!isConnected || userShares === 0n || isWithdrawPending}
          className="btn-primary flex-1"
        >
          {isWithdrawPending ? "Withdrawing…" : "Withdraw MUSD"}
        </button>
        <button
          onClick={() => claimBTC()}
          disabled={!isConnected || pendingBTCReward === 0n || isClaimPending}
          className="btn-secondary text-btc border-btc/30"
        >
          {isClaimPending ? "Claiming…" : "Claim BTC"}
        </button>
      </div>

      {!isConnected && (
        <p className="text-xs text-[#8888aa] text-center">Connect your wallet to see your position</p>
      )}
    </div>
  )
}
