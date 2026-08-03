import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { installGlobalDiagnostics, recordAppError, recordDiagnosticEvent } from './systems/diagnostics';
import { registerServiceWorker } from './systems/pwa';

// 画面外で発生した例外も、個人情報を除去した端末内診断へ記録する。
installGlobalDiagnostics();

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
    recordDiagnosticEvent({
      severity: 'error',
      source: 'release',
      code: 'chunk-reload-loop',
      message: 'Latest application chunk could not be loaded after retry.',
    });
    return; // 10秒以内の再リロードを防止
  }
  recordDiagnosticEvent({
    severity: 'warning',
    source: 'release',
    code: 'chunk-reload',
    message: 'Application update required a chunk reload.',
  });
  sessionStorage.setItem('kanji_town_chunk_reload', String(now));
  event.preventDefault();
  window.location.reload();
});

// ── Service Worker 登録（PWA対応 + 更新の案内） ──
// 更新は無言で適用せず、児童が「さいしんにする」を押したときだけ切り替える
// （学習の途中で予告なく画面が飛ばないようにするため）。詳細は systems/pwa.js。
registerServiceWorker({
  onError: (e) => {
    recordAppError(e, { source: 'service-worker', code: 'registration-failed' });
    if (import.meta.env.DEV) {
      console.warn('[SW] 登録失敗:', e);
    }
  },
});
