import { useState, useEffect } from 'react';

export const usePeerJS = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.Peer) { setIsLoaded(true); return; }
    const script = document.createElement('script'); script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
    script.onload = () => setIsLoaded(true); document.body.appendChild(script);
  }, []);
  return isLoaded;
};
