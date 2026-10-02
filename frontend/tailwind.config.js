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
        background: {
          light: '#FAFAF9',
          dark: '#09090B',
        },
        card: {
          light: '#FFFFFF',
          dark: '#111113',
        },
        border: {
          light: '#E4E4E7',
          dark: '#27272A',
        },
        primaryText: {
          light: '#18181B',
          dark: '#FAFAFA',
        },
        secondaryText: {
          light: '#71717A',
          dark: '#A1A1AA',
        },
        accent: {
          light: '#6366F1',
          dark: '#818CF8',
          DEFAULT: '#6366F1',
        },
        success: '#10B981',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
