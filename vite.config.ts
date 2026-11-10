import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative base path so assets load properly on GitHub Pages (e.g. /cauchy-comet/) as well as local/custom domains
  base: './',
  build: {
    target: 'esnext'
  }
})
