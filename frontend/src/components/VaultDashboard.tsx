import { formatEther } from "viem"
import { useVault } from "../hooks/useVault"

function StatCard({ label, value, sub, color = "white" }: {
  label: string; value: string; sub?: string; color?: string
}) {
  return (
    <div className="card">
      <p className="stat-label">{label}</p>
      <p className={`stat-value mt-1 text-${color}`}>{value}</p>
      {sub && <p className="text-xs text-[#8888aa] mt-1">{sub}</p>}
    </div>
  )
}

export function VaultDashboard() {
  const {
    vaultStats,
    spTotalMUSD,
    btcPrice,
    harvest,
    isHarvestPending,
    vaultPaused,
  } = useVault()

  const [totalMUSDDeployed, , spMUSDBalance, pendingBTCGain] = vaultStats

  const formatMUSD = (val: bigint) =>
    Number(formatEther(val)).toLocaleString("en-US", { maximumFractionDigits: 2 })

  const formatBTC = (val: bigint) =>
    Number(formatEther(val)).toLocaleString("en-US", { maximumFractionDigits: 8 })

  // Estimated APY based on historical liquidation rate (placeholder - use actual data)
  const estimatedAPY = "3.2 – 8.5%"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Vault Overview</h2>
          <p className="text-sm text-[#8888aa] mt-1">
            Earn BTC from Bitcoin liquidations by providing MUSD stability
          </p>
        </div>
        <button
          onClick={() => harvest()}
          disabled={isHarvestPending || vaultPaused}
          className="btn-secondary text-sm"
        >
          {isHarvestPending ? "Harvesting…" : "⚡ Harvest"}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total MUSD Deployed"
          value={`${formatMUSD(totalMUSDDeployed ?? 0n)} MUSD`}
          color="vault-green"
        />
        <StatCard
          label="Stability Pool Share"
          value={`${formatMUSD(spMUSDBalance ?? 0n)} MUSD`}
          sub="Your vault's SP position"
        />
        <StatCard
          label="Pending BTC Gain"
          value={`${formatBTC(pendingBTCGain ?? 0n)} BTC`}
          color="btc"
          sub="From liquidations"
        />
        <StatCard
          label="Est. APY"
          value={estimatedAPY}
          sub="Variable — based on liquidations"
          color="vault-green"
        />
      </div>

      {/* Info banner */}
      <div className="card border-mezo/30 bg-mezo/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm font-semibold text-white">How MezoYield Works</p>
            <p className="text-sm text-[#8888aa] mt-1">
              Your MUSD is deployed to Mezo's Stability Pool where it earns BTC collateral from
              liquidated positions. When BTC prices drop and positions get liquidated, stabilizers
              earn discounted BTC. Your borrowing cost at 1% can be fully covered by these rewards.
            </p>
          </div>
        </div>
      </div>

      {vaultPaused && (
        <div className="card border-red-500/30 bg-red-500/5">
          <p className="text-red-400 text-sm font-medium">
            ⚠️ Vault is paused. Deposits are disabled. You can still withdraw.
          </p>
        </div>
      )}
    </div>
  )
}
