import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    // Force all `ethers` imports inside @mezo-org/orangekit-contracts to
    // resolve to the root ethers v6, avoiding the nested ethers v5 mismatch.
    {
      name: "fix-orangekit-ethers",
      resolveId(id: string, importer?: string) {
        if (id === "ethers" && importer?.includes("orangekit-contracts")) {
          return path.resolve("node_modules/ethers/lib.esm/index.js")
        }
      },
    },
  ],
  resolve: {
    dedupe: ["ethers", "viem", "wagmi", "@rainbow-me/rainbowkit"],
    alias: { "@": "/src" },
  },
  optimizeDeps: {
    include: ["ethers"],
  },
})
