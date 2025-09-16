// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tokyo Night palette
        background: "#1a1b26",
        foreground: "#c0caf5",
        blue: "#7aa2f7",
        green: "#9ece6a",
        yellow: "#e0af68",
        red: "#f7768e",
        magenta: "#bb9af7",
        cyan: "#7dcfff",
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
}

export default config