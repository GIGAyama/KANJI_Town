import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker登録（PWA対応 + 自動更新）
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
            // 新SWが有効化されたらリロードして最新版を反映
            window.location.reload();
          }
        });
      });
    } catch {
      // SW登録失敗は無視
    }
  });
}
