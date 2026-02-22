import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E0F13",
        stone: "#F4F2EE",
        accent: "#2F6BFF",
        muted: "#6B7280"
      }
    }
  },
  plugins: []
};

export default config;
