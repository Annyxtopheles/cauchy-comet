/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060D1E',
          900: '#081226',
          800: '#0C172E',
          700: '#142344',
          600: '#1E325C',
        },
        earth: {
          amber: '#F59E0B',
          gold: '#FBBF24',
          ochre: '#B45309',
          espresso: '#3D2B24',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      gridTemplateColumns: {
        52: 'repeat(52, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
}
