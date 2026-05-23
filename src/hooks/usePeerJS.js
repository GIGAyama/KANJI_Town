import { useState, useEffect } from 'react';

const PEER_CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js',
  'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js',
];

/**
 * PeerJS スクリプトを CDN からロードする。
 * フォールバック URL とエラーハンドリング、クリーンアップ対応。
 * @returns {{ isLoaded: boolean, loadError: boolean }}
 */
export const usePeerJSStatus = () => {
  const [status, setStatus] = useState({ isLoaded: !!window.Peer, loadError: false });

  useEffect(() => {
    if (window.Peer) { setStatus({ isLoaded: true, loadError: false }); return; }

    let cancelled = false;
    let currentScript = null;

    const tryLoad = (idx) => {
      if (cancelled) return;
      if (idx >= PEER_CDN_URLS.length) {
        setStatus({ isLoaded: false, loadError: true });
        return;
      }
      const script = document.createElement('script');
      script.src = PEER_CDN_URLS[idx];
      script.async = true;
      script.onload = () => {
        if (cancelled) return;
        setStatus({ isLoaded: true, loadError: false });
      };
      script.onerror = () => {
        if (cancelled) return;
        script.remove();
        tryLoad(idx + 1);
      };
      document.body.appendChild(script);
      currentScript = script;
    };

    tryLoad(0);

    return () => {
      cancelled = true;
      if (currentScript) {
        currentScript.onload = null;
        currentScript.onerror = null;
      }
    };
  }, []);

  return status;
};
