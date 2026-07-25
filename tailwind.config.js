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
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0056D2', // Institutional Blue
          600: '#0046b3',
          700: '#00378f',
          800: '#00296b',
          900: '#0F172A', // Dark Slate Blue
        },
        ivory: {
          green: '#00A651', // Vert Côte d'Ivoire
          orange: '#FF7A00', // Orange Côte d'Ivoire
          lightGreen: '#E6F6ED',
          lightOrange: '#FFF4EB',
        },
        slateDark: '#0F172A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 86, 210, 0.08)',
        'card-hover': '0 12px 28px -4px rgba(15, 23, 42, 0.12)',
      }
    },
  },
  plugins: [],
}
