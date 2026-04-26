import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@desktop': path.resolve(__dirname, '../frontend/src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'sql-wasm': ['sql.js']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
