import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

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
