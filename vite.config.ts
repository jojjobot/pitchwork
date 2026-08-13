import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind v4 is added as a Vite plugin — no separate tailwind.config.js needed.
// Our theme (colours + fonts) lives in src/index.css instead.
export default defineConfig({
  // GitHub Pages serves this project from a subfolder, jojjobot.github.io/pitchwork/,
  // so every built asset URL has to carry that prefix. `npm run dev` ignores it.
  base: '/pitchwork/',
  plugins: [react(), tailwindcss()],
})
