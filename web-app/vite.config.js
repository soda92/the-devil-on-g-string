import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendPort = process.env.BACKEND_PORT || '8080'
const backendTarget = `http://localhost:${backendPort}`

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
        target: backendTarget,
        changeOrigin: true,
      },
      '/scenarios': {
        target: backendTarget,
        changeOrigin: true,
      },
      '^/(alter|bgimage|bgm|bland_call|evimage|evimage_h_scene|face|fgimage|font|image|others|rule|sound|voice|voice_h_scene)': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
