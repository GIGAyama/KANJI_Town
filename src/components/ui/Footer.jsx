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
export default function Footer({ compact = false }) {
  // 学習中は、リンクの無い 1 行にする。学習画面の操作ボタンのすぐ下にリンクがあると、
  // 押しそこねたときに学習の途中で別のタブ（校内フィルタの下ではブロック画面）へ飛んでいた。
  // KanjiVG の表示（ライセンスの条件）は、リンクが無くても表記として残す。
  // 正本の部品の置き場所（data-giga-links）は消さずに隠す。消すと部品が画面の
  // いちばん下へ出しなおしてしまう（public/giga-app-links.js の見張り）。
  const linkClass = 'font-normal text-inherit underline underline-offset-2 py-1';
  return (
    <footer className="flex-shrink-0 h-8 flex flex-nowrap justify-center items-center gap-2 bg-[var(--bg)] border-t border-[var(--text)]/10 z-[40] transition-colors select-none">
      {!compact && (
        <div className="min-w-0 truncate text-[11px] text-[var(--text-muted)]">
          ©2026 マイ漢字タウン{' '}
          <a
            href="https://giga-school.com"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={(e) => e.stopPropagation()}
          >
            GIGA山
          </a>
        </div>
      )}
      {/* ⚠️ 行き先のリンクを手で書かないこと。中身は正本の部品が出す。
          ⚠️ <div> にしないこと。そこで改行が入って h-8 に収まらなくなる。
          data-links で「つかいかた」を外していたのは、docs/manual/ が無く、
          既定のまま出すと行き止まりのリンクになったため。マニュアルを
          docs/manual/manual.md に置いたので、属性ごと外して既定に戻した。 */}
      <span data-giga-links hidden={compact} />
      {/* KanjiVG の表示はライセンス（CC BY-SA 3.0）の条件。消さない・切らない。 */}
      <div className="whitespace-nowrap text-[11px] text-[var(--text-muted)]">
        書き順データ:{' '}
        {compact ? 'KanjiVG' : (
          <a
            href="https://kanjivg.tagaini.net/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={(e) => e.stopPropagation()}
          >
            KanjiVG
          </a>
        )}{' '}
        (
        {compact ? 'CC BY-SA 3.0' : (
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={(e) => e.stopPropagation()}
          >
            CC BY-SA 3.0
          </a>
        )}
        ) © Ulrich Apel
      </div>
    </footer>
  );
}
