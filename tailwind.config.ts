import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          primary: "#141414",
          secondary: "#1f1f1f",
          elevated: "#2a2a2a",
        },
        // Accent colors
        accent: {
          primary: "#E50914",
          gold: "#FFD700",
          success: "#46d369",
          warning: "#ffa00a",
          error: "#e50914",
        },
        // Text colors
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          tertiary: "#808080",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
