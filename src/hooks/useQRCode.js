import { useState, useEffect } from 'react';

// QRコード生成ライブラリをCDNから動的ロード
export const useQRCode = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.QRCode) { setIsLoaded(true); return; }
    const script = document.createElement('script');
    script.src = "https://unpkg.com/qrcode@1.5.4/build/qrcode.min.js";
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('QRCode library failed to load');
    document.body.appendChild(script);
  }, []);
  return isLoaded;
};

// QRコードスキャナーライブラリをCDNから動的ロード (jsQR)
export const useJsQR = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.jsQR) { setIsLoaded(true); return; }
    const script = document.createElement('script');
    script.src = "https://unpkg.com/jsqr@1.4.0/dist/jsQR.js";
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('jsQR library failed to load');
    document.body.appendChild(script);
  }, []);
  return isLoaded;
};
