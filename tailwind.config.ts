import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0d1117",
          800: "#161b22",
          700: "#21262d",
          600: "#30363d",
          500: "#484f58",
        },
        primary: {
          500: "#10b981",
          400: "#34d399",
          600: "#059669",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
