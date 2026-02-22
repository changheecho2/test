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
        ink: "#191308",
        cocoa: "#322A26",
        stone: "#F2EEE9",
        sand: "#FBF8F3",
        muted: "#6B6460",
        line: "#E6DED4"
      }
    }
  },
  plugins: []
};

export default config;
