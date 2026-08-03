import React, { useEffect, useState } from 'react';
import { Smartphone, Check, Share } from 'lucide-react';
import {
  isStandalone,
  isIosSafari,
  canPromptInstall,
  promptInstall,
  subscribeInstallState,
} from '../../systems/pwa';
import { F } from './FormatKun';

/**
 * ホーム画面へのインストール案内。
 *
 * iPhone / iPad の Safari には beforeinstallprompt が無くボタンを出せないため、
 * 「共有 → ホーム画面に追加」の手順を文章で案内する。
 * ホーム画面から起動しているときは、もう用が無いので「すみ」の表示だけにする。
 */
export default function InstallAppPanel() {
  const [state, setState] = useState(() => ({
    canInstall: canPromptInstall(),
    installed: isStandalone(),
  }));
  const [result, setResult] = useState(null);

  useEffect(() => subscribeInstallState(setState), []);

  if (state.installed) {
    return (
      <div className="flex items-center gap-2 bg-[var(--bg)] rounded-xl px-3 py-3">
        <Check size={18} strokeWidth={3} className="text-[var(--secondary)] shrink-0" />
        <span className="text-xs font-bold text-[var(--text)]">
          ホーム{F("画面","がめん")}から{F("起動","きどう")}しています
        </span>
      </div>
    );
  }

  if (state.canInstall) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-[var(--text)] opacity-60 leading-relaxed">
          ホーム{F("画面","がめん")}に{F("入","い")}れると、アプリのように すぐ ひらけて
          ネットが なくても つかえるよ。
        </p>
        <button
          type="button"
          onClick={async () => {
            const outcome = await promptInstall();
            if (outcome === 'dismissed') setResult('またあとで えらべるよ');
            if (outcome === 'unavailable') setResult('いまは いれられません');
          }}
          className="flex items-center justify-center gap-2 min-h-[44px] py-3 rounded-xl border-[3px] border-[var(--text)] bg-[var(--primary)] text-white font-black text-sm shadow-[2px_2px_0_var(--text)] hover:opacity-90 transition-opacity"
        >
          <Smartphone size={18} strokeWidth={3} /> ホームに{F("入","い")}れる
        </button>
        {result && (
          <p role="status" aria-live="polite" className="text-[11px] font-bold text-[var(--text)] opacity-50 text-center">
            {result}
          </p>
        )}
      </div>
    );
  }

  if (isIosSafari()) {
    return (
      <div className="flex flex-col gap-2 bg-[var(--bg)] rounded-xl px-3 py-3">
        <div className="flex items-center gap-2">
          <Share size={16} strokeWidth={3} className="text-[var(--text)] shrink-0" />
          <span className="text-xs font-black text-[var(--text)]">
            iPad・iPhone で ホームに{F("入","い")}れる{F("方法","ほうほう")}
          </span>
        </div>
        <ol className="text-[11px] font-bold text-[var(--text)] opacity-60 leading-relaxed list-decimal pl-5">
          <li>{F("画面","がめん")}の した（または{F("右上","みぎうえ")}）の きょうゆうボタン <Share size={11} className="inline" /> を おす</li>
          <li>メニューを 下に スクロールする</li>
          <li>「ホーム{F("画面","がめん")}に{F("追加","ついか")}」を おす</li>
        </ol>
      </div>
    );
  }

  return (
    <p className="text-xs font-bold text-[var(--text)] opacity-50 leading-relaxed">
      この ブラウザーでは ホーム{F("画面","がめん")}に{F("入","い")}れられません。
      Chrome か Safari で ひらいてね。
    </p>
  );
}
