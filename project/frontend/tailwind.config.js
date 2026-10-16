/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: "#060d17",
          panel: "#0b1726",
          panelHover: "#0f2136",
          border: "rgba(56, 189, 248, 0.16)",
          borderGlow: "rgba(56, 189, 248, 0.4)",
          cyan: "#38bdf8",
          blue: "#3b82f6",
          red: "#f43f5e",
          orange: "#fb923c",
          amber: "#fbbf24",
          green: "#10b981",
          emerald: "#34d399",
          muted: "#94a3b8",
          text: "#f8fafc",
          card: "rgba(11, 23, 38, 0.85)"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        cyanGlow: '0 0 25px rgba(56, 189, 248, 0.25)',
        redGlow: '0 0 25px rgba(244, 63, 94, 0.3)',
        amberGlow: '0 0 25px rgba(251, 191, 36, 0.25)',
        panel: '0 12px 30px rgba(0, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
}
