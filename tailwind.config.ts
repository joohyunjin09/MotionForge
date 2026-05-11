import type { Config } from "tailwindcss";

const opacitySafelist = Array.from({ length: 21 }, (_, index) => `opacity-[${index * 5}%]`);
const zIndexSafelist = Array.from({ length: 101 }, (_, index) => `z-[${index}]`);

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [...opacitySafelist, ...zIndexSafelist],
  theme: {
    extend: {
      boxShadow: {
        canvas: "0 24px 80px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
