import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './ssl/server-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './ssl/server-cert.pem')),
    },
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://dataplatform.tomodachis.org:2221',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './ssl/server-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './ssl/server-cert.pem')),
    },
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
