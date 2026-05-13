import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/oklch_color_explorer/',
  plugins: [react()],
})
