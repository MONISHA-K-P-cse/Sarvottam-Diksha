/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6500', // Logo primary orange
          orangeDark: '#E05500',
          orangeLight: '#FFF4ED',
          green: '#4D7C0F', // Logo text green
          greenLight: '#F7FEE7',
          lime: '#84CC16', // Logo pencil green accent
          dark: '#0F172A',
          slate: '#475569',
          bg: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
