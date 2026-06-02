import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cortex: {
          ink: "#17211c",
          forest: "#176548",
          leaf: "#2f8f68",
          river: "#1f6f8b",
          gold: "#bc8b2c",
          cloud: "#f5f7f4",
          line: "#dfe7df"
        }
      },
      boxShadow: {
        soft: "0 16px 40px rgba(23, 33, 28, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
