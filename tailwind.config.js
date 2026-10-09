/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dock: {
          bg: '#12151b',
          card: '#1b2029',
          cardHover: '#242b37',
          cardActive: '#171c24',
          border: '#2c3545',
          borderHighlight: '#3b82f6',
          text: '#f3f4f6',
          textMuted: '#9ca3af',
        }
      }
    },
  },
  plugins: [],
}
