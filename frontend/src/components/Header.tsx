import { ConnectButton } from "@rainbow-me/rainbowkit"

export function Header() {
  return (
    <header className="border-b border-[#2a2a3a] bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mezo to-btc flex items-center justify-center text-xs font-bold">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">MezoYield</h1>
            <p className="text-xs text-[#8888aa]">MUSD Yield Optimizer</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-[#8888aa]">
            <span className="w-2 h-2 rounded-full bg-vault-green animate-pulse"></span>
            Matsnet Testnet
          </div>
          <ConnectButton label="Connect Wallet" />
        </div>
      </div>
    </header>
  )
}
