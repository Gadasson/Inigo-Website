import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sections/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        'inigo-green': '#4F7942',
        'earth-brown': '#6E5849',
        'soft-sand': '#fdf9f2',
        'warm-clay': '#c08552',
        'deep-earth': '#2e2b28',
      }
    },
  },
  plugins: [],
} satisfies Config;
