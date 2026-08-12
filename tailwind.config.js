/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          950: '#0a0a0f',
          900: '#111116',
          850: '#16161d',
          800: '#1c1c25',
          700: '#26262f',
          600: '#34343f',
        },
        accent: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        blink: 'blink 1s step-start infinite',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
