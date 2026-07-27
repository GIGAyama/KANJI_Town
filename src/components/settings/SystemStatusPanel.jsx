import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  HardDrive,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wifi,
} from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import {
  APP_VERSION,
  BUILD_COMMIT,
  clearDiagnosticEvents,
  createSupportReport,
  fetchDeploymentMetadata,
  getDiagnosticEvents,
  getRuntimeSnapshot,
} from '../../systems/diagnostics';

const toneClasses = {
  good: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  neutral: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

const StatusCard = ({ icon: Icon, label, value, tone = 'good' }) => (
  <div className={`min-h-[76px] rounded-xl border-2 p-2.5 ${toneClasses[tone]}`}>
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black opacity-70"><Icon size={14} /> {label}</div>
    <div className="text-xs font-black leading-snug">{value}</div>
  </div>
);

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '保存できます';
  if (bytes < 1024) return `${bytes} B 使用中`;
  return `${(bytes / 1024).toFixed(1)} KB 使用中`;
};

export default function SystemStatusPanel() {
  const [runtime, setRuntime] = useState(() => getRuntimeSnapshot());
  const [deployment, setDeployment] = useState({ status: 'checking', release: null });
  const [events, setEvents] = useState(() => getDiagnosticEvents());
  const [notice, setNotice] = useState(null);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    setRuntime(getRuntimeSnapshot());
    setEvents(getDiagnosticEvents());
    setDeployment(await fetchDeploymentMetadata());
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deploymentStatus = deployment.status === 'current'
    ? { value: '最新版です', tone: 'good' }
    : deployment.status === 'update-available'
      ? { value: '更新を取得中です', tone: 'warning' }
      : deployment.status === 'checking'
        ? { value: '確認中', tone: 'neutral' }
        : { value: runtime.online ? '配信確認待ち' : 'オフライン', tone: 'neutral' };

  const downloadReport = () => {
    const report = createSupportReport({ runtime, deployment, diagnostics: events });
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kanji-town-support-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice('サポート用の診断ファイルを保存しました。');
  };

  const clearEvents = () => {
    clearDiagnosticEvents();
    setEvents([]);
    setNotice('端末内のエラー履歴を消去しました。');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatusCard
          icon={HardDrive}
          label="端末保存"
          value={runtime.storage.available ? formatBytes(runtime.storage.bytes) : '保存を確認できません'}
          tone={runtime.storage.available ? 'good' : 'warning'}
        />
        <StatusCard
          icon={Wifi}
          label="通信"
          value={runtime.online ? 'オンライン' : 'オフライン学習中'}
          tone={runtime.online ? 'good' : 'neutral'}
        />
        <StatusCard icon={CheckCircle2} label="アプリ配信" value={deploymentStatus.value} tone={deploymentStatus.tone} />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg)] px-3 py-2 text-[10px] font-bold text-[var(--text)]">
        <span>エラー履歴 {events.length}件</span>
        <span className="truncate opacity-55">v{APP_VERSION} · {BUILD_COMMIT.slice(0, 8)}</span>
      </div>

      {notice && <div role="status" className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800">{notice}</div>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <MotionButton variant="secondary" disabled={checking} onClick={refresh} className="min-h-11 border-[3px] border-[var(--text)] text-xs shadow-sm">
          {checking ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />} 状態を再確認
        </MotionButton>
        <MotionButton variant="secondary" onClick={downloadReport} className="min-h-11 border-[3px] border-[var(--text)] text-xs shadow-sm">
          <Download size={16} /> 診断ファイルを保存
        </MotionButton>
        <button type="button" disabled={events.length === 0} onClick={clearEvents} className="min-h-11 rounded-xl border-[3px] border-rose-200 px-3 text-xs font-black text-rose-700 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="flex items-center justify-center gap-1.5"><Trash2 size={15} /> 履歴を消す</span>
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border-2 border-emerald-100 bg-emerald-50 p-2.5 text-[10px] font-bold leading-relaxed text-emerald-900">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        診断ファイルには、漢字の学習内容・氏名・メールアドレス・パスワードを含めません。問題が続くときだけ、利用者がサポートへ送るための情報です。
      </div>
    </div>
  );
}
