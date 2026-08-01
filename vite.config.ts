import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The subpath only applies to the built site (GitHub Pages project hosting at
// dbluemin.github.io/kontinuum). Dev serves from the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kontinuum/' : '/',
  plugins: [react(), tailwindcss()],
}))
