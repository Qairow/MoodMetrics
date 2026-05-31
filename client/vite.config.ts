import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  // ── Dev server ───────────────────────────────────────────────
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ── Build оптимизации (ключевое для Render) ──────────────────
  build: {
    // Предупреждать только если чанк > 1000 kb
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Разбиваем бандл на отдельные чанки — браузер кеширует их
        manualChunks: {
          // React ядро — меняется редко, кешируется надолго
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Recharts (графики) — большая библиотека, отдельно
          'vendor-charts': ['recharts'],
        },
      },
    },

    // Минификация через esbuild (быстрее terser)
    minify: 'esbuild',

    // sourcemap только для dev
    sourcemap: false,

    // Целевой браузер — современные (уменьшает полифилы)
    target: 'es2020',
  },

  // ── Оптимизация зависимостей (ускоряет холодный старт dev) ──
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts'],
  },
})