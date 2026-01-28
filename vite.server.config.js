import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rename-index',
      closeBundle() {
        // Rename index-server.html to index.html after build
        const oldPath = path.join(__dirname, 'dist-server', 'index-server.html');
        const newPath = path.join(__dirname, 'dist-server', 'index.html');
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }
    }
  ],
  server: {
    allowedHosts: true
  },
  build: {
    outDir: 'dist-server',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index-server.html')
      }
    }
  }
});
