/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        holiday: ['"Mountains of Christmas"', 'cursive'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        santa: {
          red: '#D42426',
          dark: '#1C2B36',
          green: '#2F5D62',
          gold: '#F0E2B6',
          snow: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}