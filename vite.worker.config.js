import { defineConfig } from 'vite'
import { resolve } from 'path'

// Separate build config for MediaPipe worker
// Run with: vite build --config vite.worker.config.js
export default defineConfig({
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
