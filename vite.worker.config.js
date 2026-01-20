import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Separate build config for MediaPipe worker
// Run with: vite build --config vite.worker.config.js
export default defineConfig({
  publicDir: false, // Don't copy public/ assets to outDir
  build: {
    lib: {
      entry: resolve(__dirname, 'src/workers/mediapipe.worker.js'),
      formats: ['iife'],
      name: 'MediaPipeWorker',
      fileName: () => 'mediapipe.worker.js',
    },
    outDir: 'public/workers',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      }
    }
  }
})
