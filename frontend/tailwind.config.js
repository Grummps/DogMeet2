/** @type {import('tailwindcss').Config} */

const path = require('path');
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      backgroundImage: {
        'profile-bg': "url('" + path.resolve(__dirname, 'src/assets/images/dogBanner.jpg') + "')",
      },
      colors: {
        darkBlue: '#00246B',
        lightBlue: '#CADCFC',
      },
      screens: {
        // Adding custom breakpoints without removing defaults
        fhd: '1920px',   // Full HD (1080p)
        qhd: '2560px',   // Quad HD (1440p)
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],  // Changed 'Inter var' to 'Inter'
      },
    },
  },
  plugins: [],
}
