import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudOff,
  LoaderCircle,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import MotionButton from '../ui/MotionButton';

const STATUS_LABELS = {
  initializing: '接続を確認中',
  authenticating: '認証中',
  pending: '保存待ち',
  syncing: '同期中',
  synced: '同期済み',
  conflict: '確認が必要',
  error: '再試行します',
};

const formatSyncTime = (value) => {
  if (!value) return 'まだ同期していません';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '同期時刻を確認できません';
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const DataSummary = ({ label, value, tone }) => (
  <div className={`rounded-xl border-2 p-3 ${tone}`}>
    <div className="mb-2 text-center text-xs font-black text-[var(--text)]">{label}</div>
    <div className="grid grid-cols-2 gap-1 text-[10px] font-bold text-[var(--text)]">
      <span>学習漢字</span><strong className="text-right">{value?.learned || 0}字</strong>
      <span>EXP</span><strong className="text-right">{(value?.totalExp || 0).toLocaleString()}</strong>
      <span>連続</span><strong className="text-right">{value?.streak || 0}日</strong>
      <span>学習回数</span><strong className="text-right">{value?.sessions || 0}回</strong>
    </div>
  </div>
);

const AccountSyncPanel = ({ cloudSync }) => {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [confirmChoice, setConfirmChoice] = useState(null);

  const busy = cloudSync.status === 'authenticating' || cloudSync.status === 'syncing';
  const statusLabel = STATUS_LABELS[cloudSync.status] || '端末に保存中';
  const isSignedIn = Boolean(cloudSync.user);
  const isAccountSwitch = cloudSync.conflict?.reason === 'account_switch';
  const emailValid = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);

  const handleAuth = async (event) => {
    event.preventDefault();
    setValidationError(null);
    cloudSync.clearMessage();
    if (!emailValid) {
      setValidationError('メールアドレスを確認してください。');
      return;
    }
    if (password.length < 8) {
      setValidationError('パスワードは8文字以上で入力してください。');
      return;
    }
    if (mode === 'signup' && password !== passwordConfirm) {
      setValidationError('確認用パスワードが一致しません。');
      return;
    }
    try {
      if (mode === 'signup') await cloudSync.signUp({ email, password });
      else await cloudSync.signIn({ email, password });
    } catch {}
  };

  const handleReset = async () => {
    setValidationError(null);
    if (!emailValid) {
      setValidationError('再設定メールを送るメールアドレスを入力してください。');
      return;
    }
    try { await cloudSync.requestPasswordReset(email); } catch {}
  };

  const handleNewPassword = async (event) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      setValidationError('新しいパスワードは8文字以上で入力してください。');
      return;
    }
    try {
      await cloudSync.updatePassword(newPassword);
      setNewPassword('');
    } catch {}
  };

  const chooseConflict = (choice) => {
    if (confirmChoice !== choice) {
      setConfirmChoice(choice);
      return;
    }
    setConfirmChoice(null);
    cloudSync.resolveConflict(choice);
  };

  if (!cloudSync.isConfigured) {
    return (
      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-sm font-black text-slate-600"><CloudOff size={18} /> クラウド同期は準備中です</div>
        <p className="mt-1 text-[11px] font-bold leading-relaxed text-slate-500">学習データはこれまでどおり、この端末へ安全に保存されます。</p>
      </div>
    );
  }

  if (cloudSync.status === 'initializing') {
    return <div className="flex min-h-24 items-center justify-center gap-2 text-sm font-bold text-[var(--text)] opacity-60"><LoaderCircle className="animate-spin" size={20} /> アカウントを確認しています…</div>;
  }

  if (!isSignedIn) {
    return (
      <form onSubmit={handleAuth} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg)] p-1" role="tablist" aria-label="アカウント操作">
          <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')} className={`min-h-11 rounded-lg text-xs font-black ${mode === 'signin' ? 'bg-[var(--panel)] shadow-sm border-2 border-[var(--secondary)]' : 'opacity-55'}`}>ログイン</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')} className={`min-h-11 rounded-lg text-xs font-black ${mode === 'signup' ? 'bg-[var(--panel)] shadow-sm border-2 border-[var(--secondary)]' : 'opacity-55'}`}>新しく作る</button>
        </div>
        <label className="text-xs font-black text-[var(--text)]">
          メールアドレス
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" className="mt-1 min-h-11 w-full rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]" placeholder="name@example.com" />
        </label>
        <label className="text-xs font-black text-[var(--text)]">
          パスワード
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} className="mt-1 min-h-11 w-full rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]" placeholder="8文字以上" />
        </label>
        {mode === 'signup' && (
          <label className="text-xs font-black text-[var(--text)]">
            パスワード（確認）
            <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} autoComplete="new-password" minLength={8} className="mt-1 min-h-11 w-full rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--secondary)]" placeholder="もう一度入力" />
          </label>
        )}
        {(validationError || cloudSync.error) && <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{validationError || cloudSync.error}</div>}
        {cloudSync.notice && <div role="status" className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{cloudSync.notice}</div>}
        <MotionButton type="submit" variant="primary" disabled={busy} className="min-h-12 border-[3px] border-[var(--text)] text-sm shadow-sm">
          {busy ? <LoaderCircle className="animate-spin" size={18} /> : <LogIn size={18} />}
          {mode === 'signup' ? 'アカウントを作る' : 'ログインして同期'}
        </MotionButton>
        {mode === 'signin' && <button type="button" onClick={handleReset} className="min-h-11 text-xs font-bold text-sky-700 underline underline-offset-2">パスワードを忘れたとき</button>}
        <div className="flex items-start gap-2 rounded-xl border-2 border-sky-100 bg-sky-50 p-2.5 text-[10px] font-bold leading-relaxed text-sky-800">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          児童が使う場合は、保護者または学校が管理できるメールアドレスを使用してください。学習データは本人のアカウントだけがアクセスできます。
        </div>
      </form>
    );
  }

  if (cloudSync.needsPasswordReset) {
    return (
      <form onSubmit={handleNewPassword} className="flex flex-col gap-3">
        <div className="text-sm font-black text-[var(--text)]">新しいパスワードを設定</div>
        <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={8} className="min-h-11 w-full rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 text-sm" placeholder="8文字以上" />
        {(validationError || cloudSync.error) && <div role="alert" className="text-xs font-bold text-rose-700">{validationError || cloudSync.error}</div>}
        <MotionButton type="submit" variant="primary" className="min-h-12 border-[3px] border-[var(--text)]">パスワードを更新</MotionButton>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-emerald-800">{cloudSync.user.email}</div>
          <div className="mt-0.5 text-[10px] font-bold text-emerald-700">{formatSyncTime(cloudSync.lastSyncedAt)}</div>
        </div>
        <div className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${cloudSync.status === 'conflict' || cloudSync.status === 'error' ? 'bg-amber-100 text-amber-800' : 'bg-white text-emerald-700'}`}>
          {cloudSync.status === 'syncing' ? <LoaderCircle className="animate-spin" size={13} /> : cloudSync.status === 'synced' ? <CheckCircle2 size={13} /> : <Cloud size={13} />}
          {statusLabel}
        </div>
      </div>

      {cloudSync.conflict && (
        <div className="rounded-xl border-[3px] border-amber-400 bg-amber-50 p-3" role="alert">
          <div className="mb-1 flex items-center gap-2 text-sm font-black text-amber-900"><AlertTriangle size={18} /> {isAccountSwitch ? '別のアカウントの端末データです' : '2つの学習データがあります'}</div>
          <p className="mb-3 text-[10px] font-bold leading-relaxed text-amber-800">
            {isAccountSwitch
              ? '共有端末で以前使われたデータを自動送信しないため停止しました。今のアカウントで残したい方を選んでください。'
              : '両方の端末で変更されました。残したい方を選んでください。選ばなかった方の変更は置き換わります。'}
          </p>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <DataSummary label={isAccountSwitch ? '以前の端末データ' : 'この端末'} value={cloudSync.conflict.local} tone="border-sky-200 bg-sky-50" />
            <DataSummary label="クラウド" value={cloudSync.conflict.cloud} tone="border-violet-200 bg-violet-50" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={() => chooseConflict('local')} className="min-h-12 rounded-xl border-[3px] border-sky-500 bg-white px-2 text-xs font-black text-sky-800">{confirmChoice === 'local' ? 'もう一度押して確定' : isAccountSwitch ? '端末データを引き継ぐ' : 'この端末を残す'}</button>
            <button type="button" disabled={busy || !cloudSync.conflict.cloudExists} onClick={() => chooseConflict('cloud')} className="min-h-12 rounded-xl border-[3px] border-violet-500 bg-white px-2 text-xs font-black text-violet-800 disabled:cursor-not-allowed disabled:opacity-45">{!cloudSync.conflict.cloudExists ? 'クラウドデータなし' : confirmChoice === 'cloud' ? 'もう一度押して確定' : 'クラウドを使う'}</button>
          </div>
          {isAccountSwitch && !cloudSync.conflict.cloudExists && <p className="mt-2 text-[10px] font-bold leading-relaxed text-amber-800">新しく始める場合は、下の「データを全て消す」で端末を初期化してから「端末データを引き継ぐ」を選びます。</p>}
        </div>
      )}

      {cloudSync.error && <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{cloudSync.error}</div>}
      {cloudSync.notice && <div role="status" className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{cloudSync.notice}</div>}

      <div className="grid grid-cols-2 gap-2">
        <MotionButton variant="secondary" disabled={busy || cloudSync.status === 'conflict'} onClick={() => cloudSync.syncNow()} className="min-h-12 border-[3px] border-[var(--text)] text-xs shadow-sm"><RefreshCw size={16} className={busy ? 'animate-spin' : ''} /> 今すぐ同期</MotionButton>
        <MotionButton variant="secondary" disabled={busy} onClick={cloudSync.signOut} className="min-h-12 border-[3px] border-[var(--text)] text-xs shadow-sm"><LogOut size={16} /> ログアウト</MotionButton>
      </div>
      <p className="text-[10px] font-bold leading-relaxed text-[var(--text)] opacity-50">変更は端末へ先に保存され、通信できるときにクラウドへ同期されます。オフラインでも学習できます。</p>
    </div>
  );
};

export default AccountSyncPanel;
