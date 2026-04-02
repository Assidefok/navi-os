import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8900,
    host: true,
    allowedHosts: ['n100.casa', 'localhost', '127.0.0.1', '192.168.1.101'],
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  }
})
