import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const buildCommit = process.env.GITHUB_SHA || 'local';
const builtAt = new Date().toISOString();

/** 通信できるときにしか使わない塊。先読みに入れない（manualChunks を参照） */
const NETWORK_ONLY_CHUNKS = new Set(['peerjs', 'jsqr']);

// 開発サーバー（npm run dev）でだけ index.html の CSP を外す。
// @vitejs/plugin-react は開発用のインライン script を差しこみ、HMR は ws://localhost へつなぐので、
// 配信物と同じ CSP のままでは開発画面が動かない。ビルドした配信物には必ず残る（npm run check が見る）。
const stripCspInDev = {
  name: 'strip-csp-in-dev',
  apply: 'serve',
  transformIndexHtml(html) {
    return html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  },
};

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
  plugins: [react(), tailwindcss(), releaseMetadata, stripCspInDev],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __BUILD_COMMIT__: JSON.stringify(buildCommit),
  },
  build: {
    // ソースマップ（本番デバッグ用、hidden = ユーザーには見えない）
    sourcemap: 'hidden',
    // チャンク分割の最適化
    rollupOptions: {
      // プライバシーポリシーと利用規約も配信対象に含める。
      // 入口に並べていないと dist に入らず、独自ドメインへ移したあと
      // /privacy.html /terms.html が 404 になる（互いにリンクし合っている）。
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        privacy: fileURLToPath(new URL('./privacy.html', import.meta.url)),
        terms: fileURLToPath(new URL('./terms.html', import.meta.url)),
      },
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

          // 端末どうしの通信（PeerJS）と QR の読み取り（jsQR）は npm の依存を同梱し、
          // 画面を開いたときに動的 import で読む（初回の JS には入らない）。
          // どちらも通信できるときにしか使わないので、下の chunkFileNames で net/ に出し、
          // Service Worker の先読み（sw-build.config.json の "assets/"）から外す。
          // 使ったときに sw.js の .js の cacheFirst で保存される。
          if (/\/node_modules\/(peerjs|peerjs-js-binarypack|@msgpack|eventemitter3|webrtc-adapter|sdp)\//.test(moduleId)) return 'peerjs';
          if (moduleId.includes('/node_modules/jsqr/')) return 'jsqr';
          // QR の生成（qrcode）はリンク配布の画面で圏外でも使えるので assets/ に残す
          if (/\/node_modules\/(qrcode|dijkstrajs)\//.test(moduleId)) return 'qrcode';
          return undefined;
        },
        chunkFileNames: (chunk) => (NETWORK_ONLY_CHUNKS.has(chunk.name)
          ? 'net/[name]-[hash].js'
          : 'assets/[name]-[hash].js'),
      },
    },
    // チャンクサイズ警告の閾値（データファイルが大きいため）
    chunkSizeWarningLimit: 600,
  },
});
