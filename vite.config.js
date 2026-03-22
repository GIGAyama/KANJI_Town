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
        manualChunks: {
          'kanji-data': ['./src/data/kanji-data.js'],
          'recipes': ['./src/data/recipes.js'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          // peerjs は動的importされるため自動チャンクに任せる
        },
      },
    },
    // チャンクサイズ警告の閾値（データファイルが大きいため）
    chunkSizeWarningLimit: 600,
  },
});
