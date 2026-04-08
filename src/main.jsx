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
// タイムスタンプで10秒以内の連続リロードを防止（無限ループ対策）
window.addEventListener('vite:preloadError', (event) => {
  const lastReload = sessionStorage.getItem('kanji_town_chunk_reload');
  const now = Date.now();
  if (lastReload && now - Number(lastReload) < 10000) {
    return; // 10秒以内の再リロードを防止
  }
  sessionStorage.setItem('kanji_town_chunk_reload', String(now));
  event.preventDefault();
  window.location.reload();
});

// ── Service Worker 登録（PWA対応 + 自動更新） ──
if ('serviceWorker' in navigator) {
  // 初回インストール時にはリロードしない（更新時のみリロード）
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // 初回インストール時（controllerが無かった場合）はリロード不要
    if (refreshing || !hadController) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/KANJI_Town/sw.js');

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
