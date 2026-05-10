import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8f6",
          100: "#d5eee9",
          500: "#218575",
          600: "#176b5e",
          900: "#123f39",
        },
      },
    },
  },
  plugins: [],
};

export default config;
