import React, { useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  GraduationCap,
  HeartHandshake,
  Link2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { KANJI_DATA } from '../../data/kanji-data';
import { MASTERY_SKILL_DEFINITIONS, MASTERY_SKILLS } from '../../systems/mastery';
import { useLearningSharing } from '../../hooks/useLearningSharing';

const ROLE_LABEL = { guardian: '保護者', teacher: '先生' };
const SKILL_COLOR = {
  reading: 'bg-sky-400',
  meaning: 'bg-amber-400',
  writing: 'bg-rose-400',
  stroke: 'bg-violet-400',
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '同期待ち';
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
};

const getSupportMessage = (report) => {
  if (!report) return '児童が次に同期するとレポートが表示されます。';
  if ((report.support?.overdueReviews || 0) > 0) return `復習を待つ漢字が${report.support.overdueReviews}字あります。短い復習を応援してあげましょう。`;
  if ((report.habit?.goalDays || 0) >= 5) return '今週はよい学習リズムです。取り組めたことを具体的に認めてあげましょう。';
  if ((report.habit?.studiedDays || 0) === 0) return '今週はまだ学習記録がありません。無理のない短い学習から声をかけてみましょう。';
  return '学習を続けられています。結果だけでなく、取り組んだ過程もほめてあげましょう。';
};

const ReportCard = ({ item, onRemove, confirmRemove, setConfirmRemove, busy }) => {
  const report = item.report_payload?.version === 1 ? item.report_payload : null;
  const weakChars = (report?.support?.weakKanjiIds || [])
    .map((id) => KANJI_DATA.find((kanji) => kanji.id === id)?.char)
    .filter(Boolean);

  return (
    <div className="rounded-2xl border-[3px] border-violet-200 bg-violet-50 p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-base font-black text-violet-900">{item.learner_label}</div>
          <div className="text-[10px] font-bold text-violet-700">{ROLE_LABEL[item.viewer_role]}として見守り中 ・ 更新 {formatDateTime(item.updated_at)}</div>
        </div>
        <button type="button" disabled={busy} onClick={() => {
          if (confirmRemove === item.link_id) onRemove(item.link_id);
          else setConfirmRemove(item.link_id);
        }} className="min-h-11 shrink-0 rounded-xl border-2 border-rose-300 bg-white px-2 text-[10px] font-black text-rose-700 disabled:opacity-40" aria-label={`${item.learner_label}との共有を解除`}>
          <span className="flex items-center gap-1"><Trash2 size={14} /> {confirmRemove === item.link_id ? 'もう一度押す' : '解除'}</span>
        </button>
      </div>

      {report ? (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['学習漢字', `${report.progress?.learned || 0}字`],
              ['連続学習', `${report.habit?.streak || 0}日`],
              ['今週の目標', `${report.habit?.goalDays || 0}/7日`],
              ['正答率', report.habit?.accuracy === null ? '—' : `${report.habit?.accuracy || 0}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border-2 border-white bg-white/80 p-2 text-center">
                <div className="text-lg font-black text-[var(--text)]">{value}</div>
                <div className="text-[9px] font-bold text-[var(--text)] opacity-55">{label}</div>
              </div>
            ))}
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="4技能の習熟度">
            {MASTERY_SKILLS.map((skill) => {
              const score = Math.max(0, Math.min(100, Number(report.mastery?.[skill]) || 0));
              const definition = MASTERY_SKILL_DEFINITIONS[skill];
              return (
                <div key={skill} className="rounded-xl bg-white/75 p-2">
                  <div className="mb-1 flex justify-between text-[10px] font-black"><span>{definition.icon} {definition.label}</span><span>{score}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${SKILL_COLOR[skill]}`} style={{ width: `${score}%` }} /></div>
                </div>
              );
            })}
          </div>
          {weakChars.length > 0 && <div className="mb-2 rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">復習を支えたい漢字：<span className="ml-1 text-lg font-black tracking-widest">{weakChars.join(' ')}</span></div>}
        </>
      ) : null}

      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-emerald-900">{getSupportMessage(report)}</div>
    </div>
  );
};

const LearningSharePanel = ({ cloudSync }) => {
  const sharing = useLearningSharing({ cloudSync });
  const [mode, setMode] = useState('share');
  const [learnerLabel, setLearnerLabel] = useState('');
  const [viewerRole, setViewerRole] = useState('guardian');
  const [viewerLabel, setViewerLabel] = useState('');
  const [token, setToken] = useState('');
  const [validationError, setValidationError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const busy = sharing.status === 'loading' || sharing.status === 'saving';
  const userId = cloudSync.user?.id;
  const outgoingLinks = useMemo(() => sharing.links.filter((link) => link.learner_id === userId), [sharing.links, userId]);
  const incomingReports = sharing.reports || [];

  if (!cloudSync.isConfigured) return <p className="text-[11px] font-bold text-[var(--text)] opacity-55">クラウド同期の設定後に利用できます。</p>;
  if (!cloudSync.user) return <p className="text-[11px] font-bold leading-relaxed text-[var(--text)] opacity-55">先に上の「アカウント・クラウド同期」からログインしてください。</p>;

  const handleCreate = async () => {
    const label = learnerLabel.trim();
    setValidationError(null);
    sharing.clearMessage();
    if (label.length < 1 || label.length > 30) {
      setValidationError('児童の表示名を1〜30文字で入力してください。');
      return;
    }
    await sharing.createInvite({ learnerLabel: label, viewerRole });
  };

  const handleClaim = async () => {
    const label = viewerLabel.trim();
    setValidationError(null);
    sharing.clearMessage();
    if (label.length < 1 || label.length > 30) {
      setValidationError('あなたの表示名を1〜30文字で入力してください。');
      return;
    }
    if (await sharing.claimInvite({ token, viewerLabel: label })) setToken('');
  };

  const copyInvite = async () => {
    if (!sharing.invite) return;
    try {
      await navigator.clipboard.writeText(sharing.invite.formattedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setValidationError('コードを選択してコピーしてください。');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--bg)] p-1" role="tablist" aria-label="見守り共有の操作">
        <button type="button" role="tab" aria-selected={mode === 'share'} onClick={() => { setMode('share'); setValidationError(null); sharing.clearMessage(); }} className={`min-h-11 rounded-lg text-xs font-black ${mode === 'share' ? 'border-2 border-emerald-400 bg-[var(--panel)] shadow-sm' : 'opacity-55'}`}><span className="flex items-center justify-center gap-1"><HeartHandshake size={16} /> 見守ってもらう</span></button>
        <button type="button" role="tab" aria-selected={mode === 'watch'} onClick={() => { setMode('watch'); setValidationError(null); sharing.clearMessage(); }} className={`min-h-11 rounded-lg text-xs font-black ${mode === 'watch' ? 'border-2 border-violet-400 bg-[var(--panel)] shadow-sm' : 'opacity-55'}`}><span className="flex items-center justify-center gap-1"><GraduationCap size={16} /> 学習を見守る</span></button>
      </div>

      {mode === 'share' ? (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black text-[var(--text)]">児童の表示名
            <input value={learnerLabel} maxLength={30} onChange={(event) => setLearnerLabel(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 text-sm" placeholder="例：たろう" />
          </label>
          <div>
            <div className="mb-1 text-xs font-black text-[var(--text)]">招待する人</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLE_LABEL).map(([value, label]) => <button key={value} type="button" aria-pressed={viewerRole === value} onClick={() => setViewerRole(value)} className={`min-h-11 rounded-xl border-[3px] text-xs font-black ${viewerRole === value ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-[var(--text)]/20'}`}>{label}</button>)}
            </div>
          </div>
          <MotionButton variant="secondary" disabled={busy} onClick={handleCreate} className="min-h-12 border-[3px] border-[var(--text)] text-xs"><Link2 size={17} /> 15分招待コードを作る</MotionButton>

          {sharing.invite && (
            <div className="rounded-2xl border-[3px] border-emerald-300 bg-emerald-50 p-3 text-center" role="status">
              <div className="mb-1 text-[10px] font-black text-emerald-800">{ROLE_LABEL[sharing.invite.viewerRole]}へ、このコードだけを伝えます</div>
              <div className="select-all break-all rounded-xl bg-white px-2 py-3 font-mono text-xl font-black tracking-wider text-emerald-900">{sharing.invite.formattedToken}</div>
              <button type="button" onClick={copyInvite} className="mt-2 min-h-11 rounded-xl border-2 border-emerald-400 bg-white px-4 text-xs font-black text-emerald-800"><span className="flex items-center gap-1">{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'コピーしました' : 'コードをコピー'}</span></button>
              <button type="button" disabled={busy} onClick={sharing.cancelInvite} className="ml-2 mt-2 min-h-11 rounded-xl px-3 text-[10px] font-black text-rose-700 underline underline-offset-2">招待を取り消す</button>
              <p className="mt-2 text-[10px] font-bold leading-relaxed text-emerald-800">1回だけ使用でき、15分で無効になります。信頼できる保護者・先生にだけ伝えてください。</p>
            </div>
          )}

          {outgoingLinks.length > 0 && <div className="flex flex-col gap-2">
            <div className="text-xs font-black text-[var(--text)]">見守っている人</div>
            {outgoingLinks.map((link) => <div key={link.id} className="flex items-center justify-between gap-2 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-2.5">
              <div className="min-w-0"><div className="truncate text-sm font-black text-emerald-900">{link.viewer_label}</div><div className="text-[10px] font-bold text-emerald-700">{ROLE_LABEL[link.viewer_role]}</div></div>
              <button type="button" disabled={busy} onClick={() => { if (confirmRemove === link.id) sharing.removeLink(link.id); else setConfirmRemove(link.id); }} className="min-h-11 rounded-xl border-2 border-rose-300 bg-white px-2 text-[10px] font-black text-rose-700"><span className="flex items-center gap-1"><Trash2 size={14} />{confirmRemove === link.id ? 'もう一度押す' : '解除'}</span></button>
            </div>)}
          </div>}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black text-[var(--text)]">あなたの表示名
            <input value={viewerLabel} maxLength={30} onChange={(event) => setViewerLabel(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 text-sm" placeholder="例：お母さん、山田先生" />
          </label>
          <label className="text-xs font-black text-[var(--text)]">16文字の招待コード
            <input value={token} autoCapitalize="characters" autoCorrect="off" spellCheck="false" onChange={(event) => setToken(event.target.value.toUpperCase())} className="mt-1 min-h-11 w-full rounded-xl border-[3px] border-[var(--text)] bg-[var(--bg)] px-3 font-mono text-sm uppercase tracking-wider" placeholder="ABCD-EFGH-JKMN-PQRS" />
          </label>
          <MotionButton variant="secondary" disabled={busy} onClick={handleClaim} className="min-h-12 border-[3px] border-[var(--text)] text-xs"><Users size={17} /> 見守りを開始する</MotionButton>

          {incomingReports.length > 0 ? incomingReports.map((item) => <ReportCard key={item.link_id} item={item} busy={busy} confirmRemove={confirmRemove} setConfirmRemove={setConfirmRemove} onRemove={sharing.removeLink} />) : <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3 text-center text-[11px] font-bold text-slate-500">招待コードを入力すると、児童の学習要約がここに表示されます。</div>}
        </div>
      )}

      {(validationError || sharing.error) && <div role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{validationError || sharing.error}</div>}
      {sharing.notice && <div role="status" className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">{sharing.notice}</div>}
      {busy && <div role="status" className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--text)] opacity-55"><LoaderCircle className="animate-spin" size={16} /> 更新しています…</div>}
      <div className="flex items-start gap-2 rounded-xl border-2 border-sky-100 bg-sky-50 p-2.5 text-[10px] font-bold leading-relaxed text-sky-800"><ShieldCheck size={16} className="mt-0.5 shrink-0" />共有されるのは学習の要約だけです。メール、まち、設定、ドリル、個々の回答履歴は共有されません。</div>
      <button type="button" disabled={busy} onClick={sharing.refresh} className="min-h-11 text-xs font-bold text-sky-700"><span className="flex items-center justify-center gap-1"><RefreshCw size={14} /> 最新のレポートを確認</span></button>
    </div>
  );
};

export default LearningSharePanel;
