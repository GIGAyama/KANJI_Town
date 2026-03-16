import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-black text-[var(--text)]">エラーが発生しました</h2>
          <p className="text-sm text-[var(--text)] opacity-60 max-w-xs">画面を再読み込みするか、ホームに戻ってください。</p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); this.props.onReset?.(); }} className="bg-[var(--primary)] text-[var(--panel)] px-6 py-3 rounded-2xl font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
            ホームに戻る
          </button>
          {process.env.NODE_ENV === 'development' && <pre className="text-xs text-rose-500 text-left bg-gray-100 p-2 rounded max-w-sm overflow-auto">{this.state.error?.message}</pre>}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
