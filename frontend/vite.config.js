import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// (touched to force Tailwind to recompile with the `class` dark-mode
// strategy set in tailwind.config.js — a running dev server won't
// otherwise pick that up)
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
})
