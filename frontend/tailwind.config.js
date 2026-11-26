/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        btc: { DEFAULT: "#F7931A", dark: "#c97515" },
        mezo: { DEFAULT: "#6B4EFF", dark: "#4f35e0" },
        "vault-green": { DEFAULT: "#00D68F", dark: "#00a870" },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
}
