/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chug: {
          dark: '#0f1117',
          panel: '#181b24',
          border: '#2a2f3d',
          accent: '#ef4444', // Rock/Metal energy red
          gold: '#eab308',
          cyan: '#06b6d4',
          purple: '#a855f7'
        }
      }
    },
  },
  plugins: [],
}

