import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/KANJI_Town/',
  build: {
    // ソースマップ（本番デバッグ用、hidden = ユーザーには見えない）
    sourcemap: 'hidden',
    // チャンク分割の最適化
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replaceAll('\\', '/');

          if (moduleId.includes('/src/data/kanji-data.js')) return 'kanji-data';
          if (moduleId.includes('/src/data/recipes.js')) return 'recipes';
          if (
            moduleId.includes('/node_modules/react/')
            || moduleId.includes('/node_modules/react-dom/')
            || moduleId.includes('/node_modules/scheduler/')
          ) return 'vendor-react';
          if (moduleId.includes('/node_modules/framer-motion/')) return 'vendor-motion';

          // peerjs / qrcode / jsQR は CDN からロードするため依存に含めない
          return undefined;
        },
      },
    },
    // チャンクサイズ警告の閾値（データファイルが大きいため）
    chunkSizeWarningLimit: 600,
  },
});
