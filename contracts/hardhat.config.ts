import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import * as dotenv from "dotenv"

dotenv.config()

const MATSNET_PRIVATE_KEY = process.env.MATSNET_PRIVATE_KEY ?? ""

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "london",
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      chainId: 31611,
    },
    matsnet: {
      url: "https://rpc.test.mezo.org",
      chainId: 31611,
      accounts: MATSNET_PRIVATE_KEY ? [MATSNET_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      matsnet: "empty",
    },
    customChains: [
      {
        network: "matsnet",
        chainId: 31611,
        urls: {
          apiURL: "https://api.explorer.test.mezo.org/api",
          browserURL: "https://explorer.test.mezo.org",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
}

export default config
