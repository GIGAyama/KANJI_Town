/**
 * 同じ端末で複数のタブ（ウィンドウ）に開いたとき、記録を書くタブを1つに決める。
 *
 * 各タブは起動時に読んだ記録をメモリに持ち、保存のたびに全体を書く。
 * そのため、2つのタブで開いていると、古いタブがあとから1回保存しただけで、
 * 新しいタブで学んだ記録やドリルが丸ごと消えていた（Classroom のリンクは新しいタブで開く）。
 *
 * 決め方: いちばん最後に「このタブで使う」と名乗ったタブだけが書く。
 * - 起動したタブは名乗る（claim）
 * - 名乗りを受けたタブは、保存待ちの変更を書き出してから書くのをやめ（onDeactivate）、
 *   書き出したかどうかを返事する（released）
 * - 名乗ったタブは、返事に「書き出した」とあれば読み直す（onPeerFlushed）
 *
 * 通り道は BroadcastChannel。無い古いブラウザでは localStorage の storage イベントを使う。
 * React に依存させない（node --test から試せるように、通り道を差しかえられる）。
 */

export const TAB_CHANNEL_NAME = 'kanji-town-tabs';
export const TAB_FALLBACK_KEY = 'kanji_town_tab_signal_v1';

const createTabId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** BroadcastChannel か storage イベントで、ほかのタブへ送り、ほかのタブから受ける */
export function createDefaultTransport() {
  if (typeof window === 'undefined') return null;
  if (typeof window.BroadcastChannel === 'function') {
    const channel = new window.BroadcastChannel(TAB_CHANNEL_NAME);
    return {
      send: (message) => { try { channel.postMessage(message); } catch { /* 送れなくてもアプリは止めない */ } },
      listen: (handler) => {
        const onMessage = (event) => handler(event.data);
        channel.addEventListener('message', onMessage);
        return () => channel.removeEventListener('message', onMessage);
      },
      close: () => { try { channel.close(); } catch { /* 閉じられなくてもよい */ } },
    };
  }
  return {
    send: (message) => {
      try { window.localStorage.setItem(TAB_FALLBACK_KEY, JSON.stringify({ ...message, at: Date.now() })); } catch { /* 容量不足などは無視 */ }
    },
    listen: (handler) => {
      const onStorage = (event) => {
        if (event.key !== TAB_FALLBACK_KEY || !event.newValue) return;
        try { handler(JSON.parse(event.newValue)); } catch { /* 壊れた合図は無視 */ }
      };
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    },
    close: () => {},
  };
}

/**
 * @param {{
 *   transport?: { send: Function, listen: Function, close?: Function } | null,
 *   tabId?: string,
 *   onDeactivate: () => boolean,  // 保存待ちを書き出して書くのをやめる。書き出したら true
 *   onPeerFlushed?: () => void,   // 名乗ったあと、ほかのタブが書き出したと返事したとき
 * }} options
 */
export function createTabCoordinator({ transport = createDefaultTransport(), tabId = createTabId(), onDeactivate, onPeerFlushed }) {
  let active = true;
  if (!transport) {
    return { tabId, claim: () => {}, isActive: () => true, destroy: () => {} };
  }

  const stopListening = transport.listen((message) => {
    if (!message || typeof message !== 'object' || message.from === tabId) return;
    if (message.type === 'claim') {
      const wasActive = active;
      active = false;
      const flushed = wasActive ? Boolean(onDeactivate?.()) : false;
      transport.send({ type: 'released', from: tabId, to: message.from, flushed });
      return;
    }
    if (message.type === 'released' && message.to === tabId && message.flushed && active) {
      onPeerFlushed?.();
    }
  });

  return {
    tabId,
    /** このタブで使うと名乗る。ほかのタブは書くのをやめる */
    claim: () => {
      active = true;
      transport.send({ type: 'claim', from: tabId });
    },
    isActive: () => active,
    destroy: () => {
      stopListening?.();
      transport.close?.();
    },
  };
}
