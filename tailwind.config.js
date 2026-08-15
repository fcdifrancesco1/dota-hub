/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dota: {
          bg: "#0D0F14",
          surface: "#151821",
          card: "#1B1F2B",
          border: "#282E3F",
          accent: "#E5A93C",
          cyan: "#00E5FF",
          text: "#E2E8F0",
          dim: "#8E99AD"
        }
      }
    },
  },
  plugins: [],
}