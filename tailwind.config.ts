import type { Config } from "tailwindcss";

const opacitySafelist = Array.from({ length: 21 }, (_, index) => `opacity-[${index * 5}%]`);
const zIndexSafelist = Array.from({ length: 101 }, (_, index) => `z-[${index}]`);
const colorFamilies = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const colorShades = "50|100|200|300|400|500|600|700|800|900|950";
const spacingScale = "0|px|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96";
const widthFractions = ["w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4"];

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    ...opacitySafelist,
    ...zIndexSafelist,
    ...widthFractions,
    {
      pattern: new RegExp(`^(bg|text|border|from|via|to|ring|shadow|decoration|outline)-(${colorFamilies})-(${colorShades})$`),
    },
    {
      pattern: /^(bg|text|border)-(white|black|transparent)(?:\/(?:[0-9]{1,3}|\[[^\]]+\]))?$/,
    },
    {
      pattern: /^bg-gradient-to-(?:t|tr|r|br|b|bl|l|tl)$/,
    },
    {
      pattern: new RegExp(`^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y)-(${spacingScale})$`),
    },
    {
      pattern: /^(m|mx|my|mt|mr|mb|ml)-auto$/,
    },
    {
      pattern: new RegExp(`^(w|h|min-h|max-h)-(${spacingScale}|auto|full|screen|fit|min|max|none)$`),
    },
    {
      pattern: /^(min-w)-(0|full|min|max|fit)$/,
    },
    {
      pattern: /^(max-w)-(0|none|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|screen|min|max|fit|prose)$/,
    },
  ],
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
