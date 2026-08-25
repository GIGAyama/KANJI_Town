import { useState, useEffect } from 'react';

// CDNロードのヘルパー（フォールバック付き）
const loadScript = (urls, onLoad, onError) => {
  let idx = 0;
  const tryLoad = () => {
    if (idx >= urls.length) { onError(); return; }
    const script = document.createElement('script');
    script.src = urls[idx];
    script.onload = onLoad;
    script.onerror = () => { idx++; script.remove(); tryLoad(); };
    document.body.appendChild(script);
  };
  tryLoad();
};

// QRコード生成ライブラリをCDNから動的ロード
//
// 版を 1.4.4 に固定している。qrcode は 1.5.0 で build/ を公開物から外したため、
// 1.5.x の build/qrcode.min.js は CDN に存在せず 404 になる。
// 気づきにくいのは、その場合でも予備の unpkg（1.4.4）が読み込まれて画面は動くこと。
// 見た目が正常なまま、校内フィルタリングで許可すべきアドレスだけが増える。
export const useQRCode = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.QRCode) { setIsLoaded(true); return; }
    loadScript(
      [
        "https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js",
        "https://unpkg.com/qrcode@1.4.4/build/qrcode.min.js",
      ],
      () => setIsLoaded(true),
      () => console.error('QRCode library failed to load')
    );
  }, []);
  return isLoaded;
};

// QRコードスキャナーライブラリをCDNから動的ロード (jsQR)
export const useJsQR = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.jsQR) { setIsLoaded(true); return; }
    loadScript(
      [
        "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
        "https://unpkg.com/jsqr@1.4.0/dist/jsQR.js",
      ],
      () => setIsLoaded(true),
      () => console.error('jsQR library failed to load')
    );
  }, []);
  return isLoaded;
};
