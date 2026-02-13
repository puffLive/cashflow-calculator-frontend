/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'income-green': {
          DEFAULT: '#2E7D32',
          light: '#4CAF50',
          dark: '#1B5E20',
        },
        'expense-red': {
          DEFAULT: '#C62828',
          light: '#EF5350',
          dark: '#8E0000',
        },
        'neutral-blue': {
          DEFAULT: '#2D6A9F',
          light: '#5E92F3',
          dark: '#1565C0',
        },
        'pending-amber': '#F9A825',
        'background': {
          light: '#F5F5F5',
          medium: '#E0E0E0',
          dark: '#333333',
        },
      },
      fontFamily: {
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}