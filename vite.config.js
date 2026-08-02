import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Node 24 can deadlock while Vite copies many public files concurrently.
  // The build script copies them after Rollup; dev keeps Vite's normal public handling.
  publicDir: command === 'build' ? false : 'public',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}))
