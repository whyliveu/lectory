import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0A13",
        panel: "#141222",
        panelSoft: "#1A1730",
        accent: "#8B5CF6",
        text: "#EAE7FF",
        muted: "#A8A0C5"
      },
      backgroundImage: {
        glow: "radial-gradient(circle at top right, rgba(139, 92, 246, 0.25), transparent 35%)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
