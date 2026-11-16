/**
 * 学習モード共通レイアウト
 *
 * モバイル（< md）:
 *   ┌──────────────────────┐
 *   │  tabsContent (固定)   │  ← モード切替タブ
 *   ├──────────────────────┤
 *   │  mainContent          │
 *   │  infoContent          │  ← スクロール可能
 *   ├──────────────────────┤
 *   │  actionContent (固定)  │  ← 次へ進むボタン等
 *   └──────────────────────┘
 *
 * タブレット / PC（>= md）:
 *   ┌────────────┬─────────┐
 *   │            │ tabs    │
 *   │  main      │ info    │  ← ここだけスクロール
 *   │  Content   ├─────────┤
 *   │            │ action  │  ← いつも見える
 *   └────────────┴─────────┘
 *
 * 注意: mainContent に canvas + ref を含む場合、同じ要素を2か所に
 * レンダリングすると ref が最後の DOM 要素を指してしまい描画が壊れる。
 * そのため JS でレイアウトを切り替え、canvas は常に1か所だけ描画する。
 *
 * 注意2: 2つのレイアウトで mainContent の枠を「同じ位置・同じ要素」に置くこと。
 * 以前は isStacked ごとに別の木を返していたため、画面を回すと <canvas> が作り直され、
 * 最初の canvas にだけ付けた入力リスナーが外れて、なぞり・テストが指に反応しなくなっていた。
 * 横並びのときは、枠を包む div を display: contents にしてレイアウトに影響させない。
 */
const ModeLayout = ({ mainContent, tabsContent, infoContent, actionContent, isStacked }) => (
  <div className={isStacked ? 'flex flex-col flex-1 min-h-0 w-full h-full' : 'flex flex-row flex-1 min-h-0 gap-3 lg:gap-5 xl:gap-6 w-full h-full'}>
    {/* タブ — 縦並びのときは常に上に表示 */}
    {isStacked && tabsContent ? <div className="shrink-0">{tabsContent}</div> : null}

    {/* メインコンテンツ（縦並びのときは情報パネルといっしょにスクロール） */}
    <div className={isStacked ? 'flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar gap-3 py-2' : 'contents'}>
      <div
        className={isStacked
          // 枠の高さは、キャンバスの大きさの決め方（learning-viewport.js）と同じ式にする:
          // 「画面の半分」と「上のタブと下のボタンを引いた残り（100dvh - STACKED_RESERVE）」の小さいほう。
          // 片方だけを変えると、枠よりキャンバスが大きくなって正方形でなくなるか、
          // 枠だけが大きくなって、下のボタンにキャンバスが隠れる。
          // 下限の 242px は、キャンバスの下限 220px に枠のパディングと枠線（22px）を足したもの。
          ? 'bg-[var(--bg)] rounded-[16px] border-[3px] border-[var(--text)] flex items-center justify-center overflow-hidden p-2 shadow-inner relative shrink-0 mx-auto w-full h-[min(50dvh,640px,calc(100dvh_-_348px))] min-h-[242px] max-h-[640px]'
          : 'flex-1 bg-[var(--bg)] rounded-[20px] border-[4px] border-[var(--text)] flex items-center justify-center overflow-auto p-2 lg:p-3 shadow-inner relative min-h-0'}
      >
        {mainContent}
      </div>
      {isStacked && infoContent ? <div className="flex flex-col gap-3">{infoContent}</div> : null}
    </div>

    {isStacked ? (
      /* アクションボタン — 常に表示 */
      actionContent ? <div className="shrink-0 pt-1 pb-1">{actionContent}</div> : null
    ) : (
      /* 右の列は「タブと情報（スクロール）」と「アクション（いつも見える）」の2段。
         以前は列ごとスクロールしていたため、高さ 768px でなぞりを2回終えると
         「テストへ進む！」が画面の下で切れていた（スクロールバーも隠していた）。 */
      <div className="w-[clamp(280px,28vw,360px)] flex flex-col shrink-0 h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {tabsContent}
          {infoContent}
        </div>
        {actionContent && <div className="shrink-0 pt-3 pb-2">{actionContent}</div>}
      </div>
    )}
  </div>
);

export default ModeLayout;
