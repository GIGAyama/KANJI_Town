import React from 'react';

/**
 * エラーバウンダリ（商用グレード）
 * - エラー情報の構造化ログ
 * - 自動リトライ機能（子コンポーネント再マウント）
 * - アクセシビリティ対応（ARIA role, スクリーンリーダー）
 * - エラーIDによるサポート参照
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorId: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    // エラーIDを生成（サポート問い合わせ用）
    const errorId = `E-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error, info) {
    // 構造化されたエラーログ
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      componentStack: info.componentStack?.split('\n').slice(0, 5).join('\n'),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    console.error('[ErrorBoundary]', errorReport);

    // エラーログをlocalStorageに保存（開発者によるデバッグ用、最大5件）
    try {
      const logs = JSON.parse(localStorage.getItem('kanji_town_errors') || '[]');
      logs.push(errorReport);
      if (logs.length > 5) logs.shift();
      localStorage.setItem('kanji_town_errors', JSON.stringify(logs));
    } catch {
      // ストレージ書き込み失敗は無視
    }
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorId: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const { errorId, retryCount } = this.state;
      const canRetry = retryCount < 2;

      return (
        <div
          className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-5xl" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-black text-[var(--text)]">
            エラーが発生しました
          </h2>
          <p className="text-sm text-[var(--text)] opacity-60 max-w-xs">
            {canRetry
              ? '「もう一度ためす」を押してください。くりかえし起こる場合はホームに戻ってください。'
              : '画面を再読み込みするか、ホームに戻ってください。'
            }
          </p>

          <div className="flex gap-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="bg-[var(--secondary)] text-white px-5 py-3 rounded-2xl font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)] active:translate-y-1 active:shadow-none transition-all min-w-[44px] min-h-[44px]"
                aria-label="もう一度ためす"
              >
                もう一度ためす
              </button>
            )}
            <button
              onClick={this.handleGoHome}
              className="bg-[var(--primary)] text-[var(--panel)] px-5 py-3 rounded-2xl font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)] active:translate-y-1 active:shadow-none transition-all min-w-[44px] min-h-[44px]"
              aria-label="ホームに戻る"
            >
              ホームに戻る
            </button>
          </div>

          {/* エラーID（サポート参照用） */}
          <p className="text-xs text-[var(--text)] opacity-30 select-all" aria-label={`エラーコード ${errorId}`}>
            エラーコード: {errorId}
          </p>

          {/* 開発環境のみ詳細表示 */}
          {import.meta.env.DEV && this.state.error && (
            <details className="text-xs text-left bg-gray-100 dark:bg-gray-800 p-3 rounded-lg max-w-sm w-full">
              <summary className="cursor-pointer font-bold text-rose-500">
                デバッグ情報
              </summary>
              <pre className="mt-2 overflow-auto text-rose-500 whitespace-pre-wrap break-words">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack?.split('\n').slice(0, 5).join('\n')}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
