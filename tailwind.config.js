/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    'dark',
    'dark:bg-black',
    'dark:text-white',
    'dark:bg-gray-900',
    'dark:text-gray-100',
    'dark:bg-apple-dark-bg',
    'dark:text-apple-gray'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        apple: {
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          dark: '#1d1d1f',
          gray: '#f5f5f7',
          'gray-text': '#86868b',
          'dark-bg': '#000000',
          'dark-surface': '#1c1c1e',
          'dark-row-hover': '#1e1e20',
        }
      }
    },
  },
  plugins: [],
}