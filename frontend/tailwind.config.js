/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F7FA",
        surface: "#FFFFFF",
        raised: "#F8FAFC",
        border: "#E2E8F0",
        text: "#0F172A",
        muted: "#64748B",
        accent: "#F05A28",
        success: "#10B981",
        warn: "#F59E0B",
        danger: "#EF4444"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
