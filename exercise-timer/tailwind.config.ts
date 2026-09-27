import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1116",
        panel: "#151A21",
        chalk: "#F5F6F7",
        mist: "#8B93A1",
        exercise: {
          DEFAULT: "#FF4B3E",
          dim: "#3A1714",
          soft: "#FF7A70",
        },
        rest: {
          DEFAULT: "#3EC6E0",
          dim: "#122B32",
          soft: "#7FDCEC",
        },
        finish: {
          DEFAULT: "#F2C94C",
          dim: "#2E2712",
        },
      },
      fontFamily: {
        display: [
          "'Space Grotesk'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        body: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      fontFeatureSettings: {
        tnum: '"tnum"',
      },
    },
  },
  plugins: [],
};

export default config;
