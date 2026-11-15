import React from 'react';
import { recordAppError } from '../../systems/diagnostics';

const STORAGE_KEY = 'kanji_town_v7';
const BROKEN_COPY_KEY = 'kanji_town_v7_broken';
const ACTIVE_SESSION_KEY = 'kanji_town_active_session_v1';

const readSaved = () => {
  try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
};

/** 端末に残っている記録を、そのままファイルとして保存させる（中身は変えない） */
const downloadSaved = () => {
  const text = readSaved();
  if (!text) return false;
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kanji-town-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
};

/**
 * アプリ全体を包む最後の受け皿。
 *
 * 起動時の読み込みで例外が出ると、これまでは画面が真っ白のまま何も出ず、
 * 再読み込みしても同じだった（マニュアルの対処が効かない）。
 * ここでは、記録をファイルに残す道と、記録を退避してから作りなおす道を出す。
 * 記録を消すのではなく別のキーへ移すので、あとから取り戻せる。
 */
class StartupErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null, saved: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const report = recordAppError(error, { source: 'react', code: 'startup-error', detail: info?.componentStack });
    this.setState({ errorId: report?.id || null });
  }

  handleSave = () => {
    this.setState({ saved: downloadSaved() });
  };

  handleStartFresh = () => {
    const ok = window.confirm('いまの きろくを べつの ばしょに うつして、はじめから ひらきます。\n（先生へ：記録は消さずに kanji_town_v7_broken へ退避します）\nよろしいですか？');
    if (!ok) return;
    try {
      const text = readSaved();
      if (text) window.localStorage.setItem(BROKEN_COPY_KEY, text);
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    } catch {
      // 保存領域に触れないときも、再読み込みだけは試す
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const hasSaved = Boolean(readSaved());
    const button = 'min-h-[48px] px-5 py-3 rounded-2xl font-black border-[3px] border-[#292f36] shadow-[0_4px_0_#292f36] active:translate-y-1 active:shadow-none';
    return (
      <main role="alert" aria-live="assertive" className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 text-center bg-[#fdfbf7] text-[#292f36]">
        <div className="text-5xl" aria-hidden="true">🏚️</div>
        <h1 className="text-xl font-black">うまく ひらけませんでした</h1>
        <p className="text-sm font-bold max-w-sm leading-relaxed">
          まず「もういちど ひらく」を おしてね。なおらないときは、先生に この画面を 見せてね。
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button type="button" onClick={() => window.location.reload()} className={`${button} bg-[#dc2626] text-white`}>
            もういちど ひらく
          </button>
          {hasSaved && (
            <button type="button" onClick={this.handleSave} className={`${button} bg-white`}>
              {this.state.saved ? 'ファイルに のこしました' : 'きろくを ファイルに のこす'}
            </button>
          )}
          {hasSaved && (
            <button type="button" onClick={this.handleStartFresh} className={`${button} bg-white text-sm`}>
              （先生向け）きろくを うつして はじめから
            </button>
          )}
        </div>
        {this.state.errorId && (
          <p className="text-xs font-bold opacity-70 select-all">エラーコード: {this.state.errorId}</p>
        )}
      </main>
    );
  }
}

export default StartupErrorBoundary;
