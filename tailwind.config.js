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
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

