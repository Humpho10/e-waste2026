import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// (touched to force Vite to restart and pick up tailwind.config.js darkMode change)
export default defineConfig({
  plugins: [react()],
})
