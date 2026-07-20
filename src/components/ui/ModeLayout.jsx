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
 *   │  main      │ info    │
 *   │  Content   │ action  │
 *   └────────────┴─────────┘
 *
 * 注意: mainContent に canvas + ref を含む場合、同じ要素を2か所に
 * レンダリングすると ref が最後の DOM 要素を指してしまい描画が壊れる。
 * そのため JS でレイアウトを切り替え、canvas は常に1か所だけ描画する。
 */
const ModeLayout = ({ mainContent, tabsContent, infoContent, actionContent, isStacked }) => {
  if (isStacked) {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full h-full">
        {/* タブ — 常に表示 */}
        {tabsContent && <div className="shrink-0">{tabsContent}</div>}

        {/* メインコンテンツ + 情報パネル — スクロール可能 */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar gap-3 py-2">
          <div className="bg-[var(--bg)] rounded-[16px] border-[3px] border-[var(--text)] flex items-center justify-center overflow-hidden p-2 shadow-inner relative shrink-0 mx-auto w-full h-[min(50dvh,560px)] min-h-[220px] max-h-[560px]">
            {mainContent}
          </div>
          {infoContent && <div className="flex flex-col gap-3">{infoContent}</div>}
        </div>

        {/* アクションボタン — 常に表示 */}
        {actionContent && (
          <div className="shrink-0 pt-1 pb-1">{actionContent}</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-row flex-1 min-h-0 gap-3 lg:gap-5 xl:gap-6 w-full h-full">
      <div className="flex-1 bg-[var(--bg)] rounded-[20px] border-[4px] border-[var(--text)] flex items-center justify-center overflow-auto p-3 lg:p-5 xl:p-6 shadow-inner relative min-h-0">
        {mainContent}
      </div>
      <div className="w-[clamp(280px,28vw,360px)] flex flex-col shrink-0 h-full overflow-y-auto no-scrollbar">
        {tabsContent}
        {infoContent}
        {actionContent && <div className="mt-auto pt-4 pb-2">{actionContent}</div>}
      </div>
    </div>
  );
};

export default ModeLayout;
