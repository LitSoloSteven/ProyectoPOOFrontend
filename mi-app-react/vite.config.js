import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy: redirige las peticiones API al backend OpenXava (Tomcat)
    // Así el frontend (5173) y el backend (8080) se ven como un solo origen
    proxy: {
      '/ProyectoBackend': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
})
