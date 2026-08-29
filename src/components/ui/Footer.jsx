import React from 'react';

/**
 * 永続的に表示されるフッターコンポーネント
 * レイアウトの一部として、ヘッダー・フッター以外の領域にマップが収まるように配置
 *
 * 書き順データは KanjiVG（CC BY-SA 3.0）を使っている。
 * CC BY-SA は著作者の表示を求めるライセンスなので、画面のどこかに必ず出す。
 * ここを消すとライセンス違反になるので、消さないこと。
 *
 * 利用規約とプライバシーへの行き先は、正本の共通部品
 * standards/web/giga-app-links.js（配布物 public/giga-app-links.js）が
 * <span data-giga-links> の中に出す。文言も並びも行き先も、あちらで決まって
 * いるので、ここに手で書かないこと。
 *
 * ⚠️ ここにあった「使い方を読む」（紹介記事へのリンク）は外した。紹介記事は
 *    「なぜ作ったか」を、まだ使っていない先生に向けて書いたもので、いま画面の
 *    前で困っている人が求めるものではない。艦隊のほかのアプリでも外れている。
 *
 * ⚠️ 1 行に収める（h-8）。ここが太ると、そのぶんマップが狭くなる。
 *    幅が足りないときは、クレジットだけを … で切る。KanjiVG の表示は
 *    ライセンスの条件なので切らない。
 */
export default function Footer() {
  return (
    <footer className="flex-shrink-0 h-8 flex flex-nowrap justify-center items-center gap-2 bg-[var(--bg)] border-t border-[var(--text)]/10 z-[100] transition-colors select-none">
      <div className="min-w-0 truncate text-[11px] text-[var(--text)] opacity-40 hover:opacity-100 transition-opacity">
        ©2026 マイ漢字タウン{' '}
        <a
          href="https://giga-school.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-normal text-inherit cursor-default decoration-transparent no-underline"
          onClick={(e) => e.stopPropagation()}
        >
          GIGA山
        </a>
      </div>
      {/* ⚠️ 行き先のリンクを手で書かないこと。中身は正本の部品が出す。
          ⚠️ <div> にしないこと。そこで改行が入って h-8 に収まらなくなる。
          ⚠️ data-links で「つかいかた」を外してある。このアプリにはまだ
             docs/manual/ が無く、既定のまま出すと行き止まりのリンクになる。
             マニュアルを書いたら、この属性ごと消すこと。 */}
      <span data-giga-links data-links="terms,privacy" />
      {/* KanjiVG の表示はライセンス（CC BY-SA 3.0）の条件。消さない・切らない。 */}
      <div className="whitespace-nowrap text-[11px] text-[var(--text)] opacity-40 hover:opacity-100 transition-opacity">
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
