import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const buildCommit = process.env.GITHUB_SHA || 'local';
const builtAt = new Date().toISOString();

const releaseMetadata = {
  name: 'release-metadata',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'release.json',
      source: JSON.stringify({
        version: packageJson.version,
        commit: buildCommit,
        builtAt,
      }, null, 2),
    });
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), releaseMetadata],
  base: '/KANJI_Town/',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_COMMIT__: JSON.stringify(buildCommit),
  },
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
