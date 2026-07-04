import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 38942,
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/scenarios': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '^/(alter|bgimage|bgm|bland_call|evimage|evimage_h_scene|face|fgimage|font|image|others|rule|sound|voice|voice_h_scene)': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
