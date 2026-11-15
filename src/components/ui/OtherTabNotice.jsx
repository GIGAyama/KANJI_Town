import { F } from './FormatKun';

/**
 * ほかのタブ（ウィンドウ）で開かれたときに、このタブの上にかぶせる案内。
 * このタブは記録を書かない。「このタブで つづける」で読みなおして、こちらを使うタブにする。
 */
const OtherTabNotice = ({ onResume }) => (
  <div
    className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="other-tab-title"
  >
    <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] shadow-[6px_6px_0_var(--text)] p-6 max-w-xs w-full text-center">
      <div className="text-5xl mb-3" aria-hidden="true">🪟</div>
      <h2 id="other-tab-title" className="text-lg font-black text-[var(--text)] mb-2">べつの タブで ひらいています</h2>
      <p className="text-sm font-bold text-[var(--text)] mb-5 leading-relaxed">
        {F("記録","きろく")}が まざらないように、こちらは おやすみ しています。
      </p>
      <button
        type="button"
        onClick={onResume}
        autoFocus
        className="w-full min-h-[48px] py-3 rounded-2xl font-black text-base bg-[var(--panel)] text-[var(--text)] border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)] active:translate-y-1 active:shadow-none"
      >
        このタブで つづける
      </button>
    </div>
  </div>
);

export default OtherTabNotice;
