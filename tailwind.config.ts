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
        // Client - Background colors (Netflix dark)
        bg: {
          primary: "#141414",
          secondary: "#1f1f1f",
          elevated: "#2a2a2a",
          "dark-gold": "#221E10",
        },
        // Client - Accent colors
        accent: {
          primary: "#E50914",
          gold: "#FFD700",
          "gold-warm": "#F2B90D",
          "gold-classic": "#D4AF37",
          "plasma-red": "#FF3B5C",
          blue: "#1978E5",
          success: "#46d369",
          warning: "#ffa00a",
          error: "#e50914",
        },
        // Client - Text colors
        text: {
          primary: "#FFFFFF",
          secondary: "#B3B3B3",
          tertiary: "#808080",
        },
        // Client - Social button colors
        social: {
          default: "#24262D",
          hover: "#2A2D35",
        },
        // Client - Error colors
        error: {
          glow: "#DC2626",
        },
        // Admin - Theme colors (SaaS style)
        admin: {
          bg: "#101022",
          surface: "#1a1a2e",
          elevated: "#252540",
          border: "#2d2d4a",
          primary: "#6366f1",
          "primary-hover": "#818cf8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
        modern: ["Spline Sans", "system-ui", "sans-serif"],
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      height: {
        "screen-safe": "calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
      },
      boxShadow: {
        "gold-glow": "0 0 15px rgba(212, 175, 55, 0.3)",
        "error-glow": "0 0 15px rgba(220, 38, 38, 0.3)",
      },
      keyframes: {
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shine: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "fade-in-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(242, 185, 13, 0)" },
          "50%": { boxShadow: "0 0 15px rgba(242, 185, 13, 0.3)" },
        },
        "stroke-draw": {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        shine: "shine 3s linear infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "stroke-draw": "stroke-draw 0.6s ease-out forwards",
        shake: "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
