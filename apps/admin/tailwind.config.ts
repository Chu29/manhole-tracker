import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1220", // page background
          900: "#0F172A", // panel background
          800: "#16213A", // card / surface
          700: "#1E2C4A", // borders, hairlines
        },
        caution: {
          DEFAULT: "#F5A623", // amber accent - manhole/utility caution color
          dim: "#8A5F1D",
        },
        survey: {
          DEFAULT: "#38BDF8", // cyan - blueprint / survey lines
          dim: "#1F6C8C",
        },
        mist: "#E8ECF1", // primary text
        haze: "#94A3B8", // secondary text
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        blueprint:
          "linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};

export default config;
