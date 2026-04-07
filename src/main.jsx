import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ── URLクリーンアップ: 不正なサブパス（/KANJI_Town/undefined等）をルートに戻す ──
const BASE_PATH = '/KANJI_Town/';
if (window.location.pathname !== BASE_PATH && window.location.pathname.startsWith(BASE_PATH)) {
  // サブパスが存在する場合、クエリパラメータを維持しつつルートにリダイレクト
  window.history.replaceState({}, '', BASE_PATH + window.location.search);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ── Viteチャンク読み込みエラー対策 ──
// 新デプロイ後に古いチャンクが消えた場合、1回だけリロードして最新を取得
window.addEventListener('vite:preloadError', (event) => {
  const reloaded = sessionStorage.getItem('kanji_town_chunk_reload');
  if (!reloaded) {
    sessionStorage.setItem('kanji_town_chunk_reload', '1');
    event.preventDefault();
    window.location.reload();
  }
  // 2回目以降はリロードしない（無限ループ防止）
});
// リロード後にフラグをクリア（正常読み込み成功時）
sessionStorage.removeItem('kanji_town_chunk_reload');

// ── Service Worker 登録（PWA対応 + 自動更新） ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/KANJI_Town/sw.js');

      // 新バージョン検出時に自動更新
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;

        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
            // リロードループ防止: 短時間に複数回リロードしない
            const lastReload = sessionStorage.getItem('kanji_town_sw_reload');
            const now = Date.now();
            if (lastReload && now - Number(lastReload) < 10000) {
              return; // 10秒以内の再リロードを防止
            }
            sessionStorage.setItem('kanji_town_sw_reload', String(now));

            // 新SWが有効化 → デバウンス中のデータを即時保存してからリロード
            import('./systems/storage').then(({ StorageAPI }) => {
              try { StorageAPI.saveStatsImmediate(StorageAPI.getStats()); } catch { /* ignore */ }
            }).finally(() => {
              window.location.reload();
            });
          }
        });
      });

      // 定期的に更新チェック（6時間ごと）
      setInterval(() => {
        reg.update().catch(() => {});
      }, 6 * 60 * 60 * 1000);

    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[SW] 登録失敗:', e);
      }
    }
  });
}
