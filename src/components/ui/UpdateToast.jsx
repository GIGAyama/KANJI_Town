import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { subscribeUpdateAvailable, applyUpdate } from '../../systems/pwa';

/**
 * 新しい版が用意できたことを児童に知らせるトースト。
 *
 * 以前は新版を見つけると無言で画面を読み込み直していた。学習の途中でも
 * 予告なく画面が飛ぶため、「押したときだけ切り替わる」形に変えた。
 */
export default function UpdateToast() {
  const [available, setAvailable] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => subscribeUpdateAvailable(() => setAvailable(true)), []);

  if (!available) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-3 py-3 px-4 rounded-2xl border-[3px] border-[var(--text)] bg-[var(--panel)] shadow-[4px_4px_0_var(--text)] max-w-[calc(100vw-24px)]"
      style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
    >
      <span className="text-sm font-bold text-[var(--text)]">
        あたらしい バージョンが あります
      </span>
      <button
        type="button"
        onClick={() => { setApplying(true); applyUpdate(); }}
        disabled={applying}
        className="shrink-0 min-h-[44px] min-w-[44px] px-4 rounded-xl border-[3px] border-[var(--text)] bg-[var(--primary)] text-white font-black text-sm shadow-[2px_2px_0_var(--text)] disabled:opacity-60 flex items-center gap-1.5"
      >
        <RefreshCw size={16} strokeWidth={3} className={applying ? 'animate-spin' : ''} />
        {applying ? 'よみこみちゅう' : 'さいしんに する'}
      </button>
    </div>
  );
}
