import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["\"Space Grotesk\"", "\"Noto Sans KR\"", "sans-serif"],
        body: ["\"Noto Sans KR\"", "sans-serif"]
      },
      colors: {
        ink: "#0E0F13",
        stone: "#F6F1EA",
        accent: "#1E4CEB",
        accentSoft: "#DDE5FF",
        sand: "#FDFBF7",
        muted: "#6B7280",
        line: "#E4DED6",
        night: "#111827"
      }
    }
  },
  plugins: []
};

export default config;
