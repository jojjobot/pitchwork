import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind v4 is added as a Vite plugin — no separate tailwind.config.js needed.
// Our theme (colours + fonts) lives in src/index.css instead.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
