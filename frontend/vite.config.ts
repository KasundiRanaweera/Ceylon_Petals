import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    server: {
      // In development the browser talks to /api on this same address and Vite forwards it to the
      // backend, so the login cookie is first-party. Change DEV_API_TARGET if the backend uses another port.
      proxy: { '/api': { target: env.DEV_API_TARGET || 'http://localhost:5000', changeOrigin: false } },
    },
  }
})
