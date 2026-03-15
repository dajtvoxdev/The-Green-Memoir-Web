import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Green Memoir theme colors from logo
        green: {
          dark: "#2D5A27",
          main: "#4A8C3F",
          light: "#7BC96F",
          pale: "#E8F5E3",
        },
        brown: {
          dark: "#5C3D2E",
          light: "#C4A265",
        },
        cream: {
          DEFAULT: "#FFF8E7",
          dark: "#F5E6C8",
        },
        gold: "#DAA520",
        border: "#D4C5A9",
      },
      fontFamily: {
        display: ["var(--font-cherry-bomb)", "cursive"],
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-nunito)", "sans-serif"],
      },
      backgroundImage: {
        "pixel-pattern": "url('/images/pixel-pattern.png')",
      },
    },
  },
  plugins: [],
};

export default config;