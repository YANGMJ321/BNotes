import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  root: path.resolve(__dirname),
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@desktop', replacement: path.resolve(__dirname, '../frontend/src') },
      // 关键修复：桌面视图 import '../stores/books' 是 HTTP API store，移动端无后端，
      // 必须替换为本地 sql.js store。用核心 alias 机制（先于普通插件执行）才能生效。
      // 对移动端自身文件而言 '../stores/books'/'./stores/books' 本就指向移动端 store，替换无副作用。
      { find: '../stores/books', replacement: path.resolve(__dirname, 'src/stores/books.js') },
      { find: './stores/books', replacement: path.resolve(__dirname, 'src/stores/books.js') }
    ],
    // 桌面视图位于 mobile 之外，其裸导入（vue/pinia）会解析到仓库根 node_modules，
    // 造成双运行时/双 pinia（报 "reading '_s'"），必须强制去重为 mobile 自己的依赖
    dedupe: ['vue', 'vue-router', 'pinia']
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
