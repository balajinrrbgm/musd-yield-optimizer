import { http, defineChain } from "viem"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { QueryClient } from "@tanstack/react-query"

// Mezo Matsnet Testnet — Chain ID 31611
export const matsnetTestnet = defineChain({
  id: 31611,
  name: "Mezo Matsnet",
  nativeCurrency: {
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.test.mezo.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Mezo Explorer",
      url: "https://explorer.test.mezo.org",
    },
  },
  testnet: true,
})

export const wagmiConfig = getDefaultConfig({
  appName: "MezoYield - MUSD Yield Optimizer",
  // WalletConnect cloud: get a free project ID at https://cloud.walletconnect.com
  projectId: "mezoyield-hackathon-demo",
  chains: [matsnetTestnet],
  transports: {
    [matsnetTestnet.id]: http("https://rpc.test.mezo.org"),
  },
  ssr: false,
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchInterval: 15_000,
    },
  },
})
