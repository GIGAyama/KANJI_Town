import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/KANJI_Town/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'kanji-data': ['./src/data/kanji-data.js'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
});
