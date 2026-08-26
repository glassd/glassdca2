import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "sd-display": [
          "Bricolage Grotesque Variable",
          "system-ui",
          "sans-serif",
        ],
        "sd-sans": ["Geist Variable", "system-ui", "sans-serif"],
        "sd-mono": ["JetBrains Mono Variable", "ui-monospace", "monospace"],
      },
      colors: {
        sd: {
          bg: "var(--sd-bg)",
          panel: "var(--sd-panel)",
          fg: "var(--sd-fg)",
          dim: "var(--sd-dim)",
          faint: "var(--sd-faint)",
          rule: "var(--sd-rule)",
          rule2: "var(--sd-rule2)",
          acid: "var(--sd-acid)",
        },
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sd-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.8)", opacity: "0.5" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out both",
        "sd-pulse": "sd-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
