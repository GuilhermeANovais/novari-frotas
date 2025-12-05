/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Define Inter como padrão
      },
      colors: {
        primary: {
          DEFAULT: '#16a34a', // green-600
          hover: '#15803d',   // green-700
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          hover: '#b91c1c',   // red-700
        }
      }
    },
  },
  plugins: [],
}
