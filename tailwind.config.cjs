/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'main-dark': '#1e2b37',
        'main-light': '#2c3e50',
      },
    },
    fontSize: {
      xs: '0.6rem',
      md: '0.9rem',
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

