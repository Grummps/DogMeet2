/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',   // Keep default md
      lg: '1024px',  // Keep default lg
      xl: '1280px',
      // Add custom breakpoints
      fhd: '1920px',   // Full HD (1080p)
      qhd: '2560px',   // Quad HD (1440p)
    },
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],  // Changed 'Inter var' to 'Inter'
      },
    },
  },
  plugins: [],
}
