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
          950: '#0B1B3A',
          900: '#10244C',
          800: '#163063',
          700: '#1F4080',
          600: '#2B54A3',
        },
        amber: {
          fire: '#FF7A00',
          glow: '#FFA000',
          solar: '#FFD54F',
          crimson: '#E65100',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
