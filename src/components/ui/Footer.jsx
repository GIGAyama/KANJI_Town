import React from 'react';

/**
 * 永続的に表示されるフッターコンポーネント
 * レイアウトの一部として、ヘッダー・フッター以外の領域にマップが収まるように配置
 *
 * 書き順データは KanjiVG（CC BY-SA 3.0）を使っている。
 * CC BY-SA は著作者の表示を求めるライセンスなので、画面のどこかに必ず出す。
 * ここを消すとライセンス違反になるので、消さないこと。
 */
export default function Footer() {
  return (
    <footer className="flex-shrink-0 h-8 flex justify-center items-center gap-2 bg-[var(--bg)] border-t border-[var(--text)]/10 z-[100] transition-colors select-none">
      <div className="text-[11px] text-[var(--text)] opacity-40 hover:opacity-100 transition-opacity">
        ©2026 マイ漢字タウン{' '}
        <a
          href="https://note.com/cute_borage86"
          target="_blank"
          rel="noopener noreferrer"
          className="font-normal text-inherit cursor-default decoration-transparent no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          GIGA山
        </a>
      </div>
      <div className="text-[11px] text-[var(--text)] opacity-40 hover:opacity-100 transition-opacity">
        書き順データ:{' '}
        <a
          href="https://kanjivg.tagaini.net/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-normal text-inherit no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          KanjiVG
        </a>{' '}
        (
        <a
          href="https://creativecommons.org/licenses/by-sa/3.0/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-normal text-inherit no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          CC BY-SA 3.0
        </a>
        ) © Ulrich Apel
      </div>
    </footer>
  );
}
