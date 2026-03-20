import React from 'react';

/**
 * 永続的に表示されるフッターコンポーネント
 * レイアウトの一部として、ヘッダー・フッター以外の領域にマップが収まるように配置
 */
export default function Footer() {
  return (
    <footer className="flex-shrink-0 h-8 flex justify-center items-center bg-[var(--bg)] border-t border-[var(--text)]/10 z-[100] transition-colors select-none">
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
    </footer>
  );
}
