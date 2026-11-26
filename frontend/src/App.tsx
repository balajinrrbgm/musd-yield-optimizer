import { Header } from "./components/Header"
import { VaultDashboard } from "./components/VaultDashboard"
import { DepositForm } from "./components/DepositForm"
import { WithdrawForm } from "./components/WithdrawForm"
import { useVault } from "./hooks/useVault"

export default function App() {
  const { isConnected, btcBalance, musdBalance } = useVault()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 bg-mezo/10 border border-mezo/20 rounded-full px-4 py-1.5 text-sm text-mezo mb-4">
            <span>✨</span> Supernormal dApps · MUSD Track
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Make Your <span className="text-btc">MUSD</span> Work
          </h1>
          <p className="text-lg text-[#8888aa] mt-3 max-w-xl mx-auto">
            Auto-deposit MUSD into Mezo's Stability Pool. Earn{" "}
            <span className="text-btc font-semibold">BTC rewards</span> from liquidations
            and cover your 1% borrowing cost — passively.
          </p>
        </div>

        {/* Quick stats for connected users */}
        {isConnected && (
          <div className="grid grid-cols-2 gap-4">
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-btc/10 flex items-center justify-center text-lg">
                ₿
              </div>
              <div>
                <p className="text-xs text-[#8888aa]">Wallet BTC</p>
                <p className="text-sm font-bold text-white">
                  {btcBalance ? `${Number(btcBalance.formatted).toFixed(6)} BTC` : "—"}
                </p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-mezo/10 flex items-center justify-center text-lg">
                $
              </div>
              <div>
                <p className="text-xs text-[#8888aa]">Wallet MUSD</p>
                <p className="text-sm font-bold text-white">
                  {musdBalance !== undefined
                    ? `${Number(musdBalance) / 1e18 < 1e6
                        ? (Number(musdBalance) / 1e18).toFixed(2)
                        : ">1M"
                      } MUSD`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vault Overview */}
        <VaultDashboard />

        {/* Deposit / Withdraw */}
        <div className="grid md:grid-cols-2 gap-6">
          <DepositForm />
          <WithdrawForm />
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-[#555566] py-8">
          <p>MezoYield · Mezo Hackathon 2025 · Built on Mezo Matsnet Testnet</p>
          <p className="mt-1">
            Smart contracts:{" "}
            <a
              href="https://explorer.test.mezo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mezo hover:underline"
            >
              explorer.test.mezo.org
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
