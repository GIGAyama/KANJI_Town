import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Palette, GraduationCap, Database, Download, Upload, Trash2, RotateCcw, Sun, Moon, Sparkles, ChevronRight, AlertTriangle, Check, X, Accessibility, Activity, Smartphone } from 'lucide-react';
import { MotionButton } from '../ui';
import InstallAppPanel from '../ui/InstallAppPanel';
import { StorageAPI } from '../../systems/storage';
import { IMPORT_MAX_BYTES, validateImportedStats } from '../../systems/stats-schema';
import { loadStudyRecords } from '../../systems/studyStats';
import { saveStudyRecord } from '../../systems/studyLog';
import { STUDY_APP_ID } from '../../systems/studySession';

/** このアプリの学習ログのうち、まだ端末に無いものだけを足す（同じ id は足さない）。足した件数を返す */
function mergeStudyRecords(records) {
  if (!Array.isArray(records) || records.length === 0) return 0;
  let existing;
  try { existing = new Set((JSON.parse(window.localStorage.getItem('study.records.v1') || '[]') || []).map(r => r && r.id)); } catch { existing = new Set(); }
  let added = 0;
  records
    .filter(r => r && typeof r === 'object' && r.schema === 'study.v1' && r.appId === STUDY_APP_ID && typeof r.id === 'string' && !existing.has(r.id))
    .sort((a, b) => String(a.endedAt || '').localeCompare(String(b.endedAt || '')))
    .forEach(r => { if (saveStudyRecord(r)) { existing.add(r.id); added++; } });
  return added;
}
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { DAILY_GOAL_OPTIONS, getDailyGoal } from '../../systems/learning-plan';
import { getMotionPreference } from '../../utils/motion-preference';
import { isReadingCheckEnabled } from '../../utils/reading-preference';
import SystemStatusPanel from '../settings/SystemStatusPanel';
import { APP_VERSION, BUILD_COMMIT } from '../../systems/diagnostics';

// 手動テーマ選択肢
const THEME_OPTIONS = [
  { id: 'auto', label: 'じどう', desc: 'レベルに合わせて変わる', icon: Sparkles },
  { id: 'default', label: 'ベーシック', desc: '赤×緑のスタンダード', colors: ['#ef4444', '#10b981', '#fbbf24'] },
  { id: 'sakura', label: 'さくら', desc: 'やさしいピンク', colors: ['#d946ef', '#f472b6', '#fbcfe8'] },
  { id: 'ocean', label: 'うみ', desc: 'さわやかなブルー', colors: ['#0284c7', '#38bdf8', '#7dd3fc'] },
  { id: 'sunset', label: 'ゆうやけ', desc: 'あたたかいオレンジ', colors: ['#ea580c', '#f97316', '#fcd34d'] },
  { id: 'gold', label: 'おうごん', desc: 'きらめくゴールド', colors: ['#b45309', '#eab308', '#fef08a'] },
  { id: 'dark', label: 'ダーク', desc: '目にやさしい暗い色', icon: Moon },
];

// 音量プリセット
const VOLUME_LEVELS = [
  { id: 'off', label: 'オフ', value: 0 },
  { id: 'low', label: '小', value: 0.3 },
  { id: 'mid', label: '中', value: 0.6 },
  { id: 'high', label: '大', value: 1.0 },
];

const MOTION_OPTIONS = [
  { id: 'system', label: 'じどう', desc: '端末設定に合わせる' },
  { id: 'full', label: '標準', desc: '演出を楽しむ' },
  { id: 'reduced', label: '少なめ', desc: '動きをおさえる' },
];

// 確認ダイアログ
const ConfirmDialog = ({ title, message, onConfirm, onCancel, danger }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-5 max-w-sm w-full shadow-[6px_6px_0_var(--text)]" onClick={e => e.stopPropagation()}>
      <div className="flex items-center gap-2 mb-3">
        {danger && <AlertTriangle size={24} className="text-red-500" />}
        <h3 className="font-black text-lg text-[var(--text)]">{title}</h3>
      </div>
      <p className="text-sm text-[var(--text)] opacity-70 mb-4 leading-relaxed">{message}</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl border-[3px] border-[var(--text)] font-bold text-sm bg-[var(--bg)] text-[var(--text)] hover:opacity-80 transition-opacity flex items-center justify-center gap-1">
          <X size={16} /> やめる
        </button>
        <button onClick={onConfirm} className={`flex-1 py-3 rounded-xl border-[3px] border-[var(--text)] font-bold text-sm text-white transition-opacity hover:opacity-80 flex items-center justify-center gap-1 ${danger ? 'bg-red-500' : 'bg-[var(--primary)]'}`}>
          <Check size={16} /> {F("実行","じっこう")}する
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// セクションヘッダー
const Section = ({ icon: Icon, title, children }) => (
  <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] shadow-[4px_4px_0_var(--text)] p-4 flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <Icon size={20} className="text-[var(--primary)]" />
      <h3 className="font-black text-[var(--text)]">{title}</h3>
    </div>
    {children}
  </div>
);

const SettingsView = ({ setView, stats, setStats, isMuted, setIsMuted, levelInfo }) => {
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const settings = stats.settings || {};
  const themeOverride = settings.themeOverride || 'auto';
  const volumeLevel = settings.volumeLevel ?? (isMuted ? 'off' : 'high');
  const autoPlay = settings.autoPlay !== false;
  const readingCheck = isReadingCheckEnabled(settings);
  const showFurigana = settings.showFurigana !== false;
  const sessionSize = settings.sessionSize || 'normal';
  const dailyGoal = getDailyGoal(settings);
  const motionPreference = getMotionPreference(settings);

  const updateSettings = (patch) => {
    const newSettings = { ...settings, ...patch };
    const newStats = { ...stats, settings: newSettings };
    setStats(newStats);
    StorageAPI.saveStats(newStats);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  // テーマ変更
  const handleThemeChange = (id) => {
    audioCtrl.playSE('click');
    updateSettings({ themeOverride: id });
  };

  const handleMotionChange = (id) => {
    audioCtrl.playSE('click');
    updateSettings({ motionPreference: id });
  };

  // 音量変更
  const handleVolumeChange = (vol) => {
    audioCtrl.playSE('click');
    updateSettings({ volumeLevel: vol.id });
    if (vol.id === 'off') {
      if (!isMuted) setIsMuted(audioCtrl.toggle());
    } else {
      if (isMuted) setIsMuted(audioCtrl.toggle());
      audioCtrl.volume = vol.value;
    }
  };

  // データエクスポート
  const handleExport = () => {
    audioCtrl.playSE('click');
    // 端末の引っ越しに使えるよう、このアプリの学習ログ（さいきんのとりくみ）もいっしょに書き出す
    const exportedAt = Date.now();
    const exported = { ...stats, lastExportAt: exportedAt, studyRecords: loadStudyRecords(STUDY_APP_ID).reverse() };
    const data = JSON.stringify(exported, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanji-town-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    // 最後に書き出した日を残す（書き出しを勧めるときの目安）
    const next = { ...stats, lastExportAt: exportedAt };
    setStats(next);
    StorageAPI.saveStats(next);
    showToast('データをエクスポートしました');
  };

  // データインポート
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > IMPORT_MAX_BYTES) {
      showToast('ファイルが大きすぎます');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        // このアプリが書き出したバックアップだけを受けつける。以前は {"totalExp":0} のような
        // ファイルでも通り、上書きした直後に記録がすべて消えたり、起動できなくなったりしていた。
        const { studyRecords, ...importedStats } = JSON.parse(ev.target.result) || {};
        const checked = validateImportedStats(importedStats);
        if (!checked.ok) {
          showToast('マイ漢字タウンのバックアップではないようです');
          return;
        }
        setConfirm({
          title: 'データを復元',
          message: 'バックアップデータで今のデータを上書きします。まちがえたときは「読みこむ前にもどす」でもどせます。',
          danger: true,
          onConfirm: () => {
            // 読みこむ前の記録を1つ控えておく（まちがえて読みこんだときに取り消せるように）
            StorageAPI.keepBeforeImportCopy();
            const saved = StorageAPI.saveStatsImmediate(checked.stats);
            setConfirm(null);
            if (!saved) {
              showToast('保存できませんでした。今のデータはそのままです');
              return;
            }
            const addedRecords = mergeStudyRecords(studyRecords);
            setStats(StorageAPI.getStats());
            setCanUndoImport(StorageAPI.hasBeforeImportCopy());
            showToast(addedRecords > 0 ? `データを復元しました（学習の記録 ${addedRecords}件）` : 'データを復元しました');
          },
        });
      } catch {
        showToast('ファイルを読み込めませんでした');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // データリセット
  // 読みこむ前の記録にもどす（まちがえて読みこんだとき）
  const [canUndoImport, setCanUndoImport] = useState(() => StorageAPI.hasBeforeImportCopy());
  const handleUndoImport = () => {
    setConfirm({
      title: '読みこむ前にもどす',
      message: 'バックアップを読みこむ前の記録にもどします。',
      danger: true,
      onConfirm: () => {
        const restored = StorageAPI.restoreBeforeImportCopy();
        setConfirm(null);
        if (!restored) {
          showToast('もどせませんでした');
          return;
        }
        setStats(StorageAPI.getStats());
        setCanUndoImport(false);
        showToast('読みこむ前の記録にもどしました');
      },
    });
  };

  const handleReset = () => {
    setConfirm({
      title: 'データを全て消す',
      message: '町・漢字の進み具合・実績・マイドリルが消えます。学習の記録（さいきんのとりくみ）はほかのアプリと共通のため端末には残りますが、この画面には出さなくなります。この操作は取り消せません！',
      danger: true,
      onConfirm: () => {
        StorageAPI.resetAll();
        setStats(StorageAPI.getStats());
        setCanUndoImport(false);
        setConfirm(null);
        showToast('データをリセットしました');
      },
    });
  };

  // ストレージ使用量
  const getStorageSize = () => {
    try {
      const data = window.localStorage.getItem('kanji_town_v7');
      if (!data) return '0 KB';
      const bytes = new Blob([data]).size;
      return bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
    } catch { return '不明'; }
  };

  return (
    <div className="flex flex-col items-center gap-4 pb-6 h-full overflow-y-auto no-scrollbar">
      {/* ヘッダー */}
      <div className="w-full flex items-center gap-3">
        <button onClick={() => { audioCtrl.playSE('click'); setView('home'); }} className="p-2 rounded-xl border-[3px] border-[var(--text)] bg-[var(--panel)] hover:bg-[var(--bg)] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shadow-[2px_2px_0_var(--text)]">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-[var(--text)]">せってい</h2>
      </div>

      {/* テーマ設定 */}
      <Section icon={Palette} title="テーマ">
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map(t => {
            const isActive = themeOverride === t.id;
            return (
              <button key={t.id} onClick={() => handleThemeChange(t.id)} className={`p-3 rounded-xl border-[3px] text-left transition-all ${isActive ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[2px_2px_0_var(--primary)]' : 'border-[var(--text)]/20 hover:border-[var(--text)]/50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {t.icon ? <t.icon size={16} className={isActive ? 'text-[var(--primary)]' : 'text-[var(--text)] opacity-50'} /> : (
                    <div className="flex gap-0.5">
                      {t.colors.map((c, i) => <div key={i} className="w-3 h-3 rounded-full border border-[var(--text)]/20" style={{ backgroundColor: c }} />)}
                    </div>
                  )}
                  {isActive && <Check size={14} className="text-[var(--primary)] ml-auto" />}
                </div>
                <div className="font-black text-xs text-[var(--text)]">{t.label}</div>
                <div className="text-[10px] text-[var(--text)] opacity-50">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 動き・端末負荷の設定 */}
      <Section icon={Accessibility} title="画面のうごき">
        <div className="grid grid-cols-3 gap-2">
          {MOTION_OPTIONS.map((option) => {
            const isActive = motionPreference === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleMotionChange(option.id)}
                className={`min-h-[72px] rounded-xl border-[3px] p-2 text-center transition-all ${isActive ? 'border-[var(--secondary)] bg-[var(--secondary)]/10 shadow-[2px_2px_0_var(--secondary)]' : 'border-[var(--text)]/20 hover:border-[var(--text)]/50'}`}
              >
                <div className="flex items-center justify-center gap-1 text-xs font-black text-[var(--text)]">
                  {option.label}
                  {isActive && <Check size={13} className="text-[var(--secondary)]" aria-hidden="true" />}
                </div>
                <div className="mt-1 text-[9px] font-bold leading-tight text-[var(--text)] opacity-50">{option.desc}</div>
              </button>
            );
          })}
        </div>
        <div className="rounded-xl bg-[var(--bg)] px-3 py-2 text-[10px] font-bold leading-relaxed text-[var(--text)] opacity-60">
          「{F("少","すく")}なめ」はアニメーション・{F("天気","てんき")}・{F("紙吹雪","かみふぶき")}をおさえ、電池も長もちしやすくします。
        </div>
      </Section>

      {/* 音の設定 */}
      <Section icon={isMuted ? VolumeX : Volume2} title="音の設定">
        <div className="flex gap-2">
          {VOLUME_LEVELS.map(vol => {
            const isActive = volumeLevel === vol.id;
            return (
              <button key={vol.id} onClick={() => handleVolumeChange(vol)} className={`flex-1 py-3 rounded-xl border-[3px] font-bold text-sm transition-all ${isActive ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[2px_2px_0_var(--text)]' : 'border-[var(--text)]/20 text-[var(--text)] hover:border-[var(--text)]/50'}`}>
                {vol.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 学習設定 */}
      <Section icon={GraduationCap} title={<>{F("学習","がくしゅう")}せってい</>}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[var(--text)]">ふりがなを{F("表示","ひょうじ")}</div>
              <div className="text-[10px] text-[var(--text)] opacity-50">{F("漢字","かんじ")}の{F("上","うえ")}にひらがなを{F("表示","ひょうじ")}する</div>
            </div>
            <button onClick={() => { audioCtrl.playSE('click'); updateSettings({ showFurigana: !showFurigana }); }} className={`w-14 h-8 rounded-full border-[3px] border-[var(--text)] transition-all relative ${showFurigana ? 'bg-[var(--secondary)]' : 'bg-gray-300'}`}>
              <motion.div animate={{ x: showFurigana ? 22 : 2 }} className="absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--text)]" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[var(--text)]">{F("自動","じどう")}{F("再生","さいせい")}</div>
              <div className="text-[10px] text-[var(--text)] opacity-50">{F("音読","おんどく")}のとき お{F("手本","てほん")}の{F("音声","おんせい")}を{F("自動","じどう")}で{F("再生","さいせい")}</div>
            </div>
            <button onClick={() => { audioCtrl.playSE('click'); updateSettings({ autoPlay: !autoPlay }); }} className={`w-14 h-8 rounded-full border-[3px] border-[var(--text)] transition-all relative ${autoPlay ? 'bg-[var(--secondary)]' : 'bg-gray-300'}`}>
              <motion.div animate={{ x: autoPlay ? 22 : 2 }} className="absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--text)]" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[var(--text)]">{F("音読","おんどく")}チャレンジ</div>
              <div className="text-[10px] text-[var(--text)] opacity-50">マイクで{F("声","こえ")}に{F("出","だ")}して よめたかチェック（ろくおん・そうしんは しない）</div>
            </div>
            <button onClick={() => { audioCtrl.playSE('click'); updateSettings({ readingCheck: !readingCheck }); }} className={`w-14 h-8 rounded-full border-[3px] border-[var(--text)] transition-all relative ${readingCheck ? 'bg-[var(--secondary)]' : 'bg-gray-300'}`}>
              <motion.div animate={{ x: readingCheck ? 22 : 2 }} className="absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--text)]" />
            </button>
          </div>

          <div>
            <div className="text-sm font-bold text-[var(--text)] mb-2">1{F("回","かい")}のセッションの{F("量","りょう")}</div>
            <div className="flex gap-2">
              {[
                { id: 'small', label: <>{F("少","すく")}なめ</>, desc: '復習10＋新3' },
                { id: 'normal', label: 'ふつう', desc: '復習20＋新5' },
                { id: 'large', label: <>{F("多","おお")}め</>, desc: '復習30＋新8' },
              ].map(s => {
                const isActive = sessionSize === s.id;
                return (
                  <button key={s.id} onClick={() => { audioCtrl.playSE('click'); updateSettings({ sessionSize: s.id }); }} className={`flex-1 py-2 rounded-xl border-[3px] transition-all text-center ${isActive ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[2px_2px_0_var(--primary)]' : 'border-[var(--text)]/20'}`}>
                    <div className="text-xs font-black text-[var(--text)]">{s.label}</div>
                    <div className="text-[9px] text-[var(--text)] opacity-50">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-[var(--text)] mb-1">1{F("日","にち")}の{F("学習","がくしゅう")}{F("目標","もくひょう")}</div>
            <div className="text-[10px] text-[var(--text)] opacity-50 mb-2">ホームに{F("表示","ひょうじ")}する、むりなく{F("続","つづ")}けるためのめやす</div>
            <div className="grid grid-cols-3 gap-2">
              {DAILY_GOAL_OPTIONS.map((goal) => {
                const isActive = dailyGoal === goal;
                return (
                  <button key={goal} onClick={() => { audioCtrl.playSE('click'); updateSettings({ dailyGoal: goal }); }} className={`py-2.5 rounded-xl border-[3px] transition-all text-center ${isActive ? 'border-[var(--secondary)] bg-[var(--secondary)]/10 shadow-[2px_2px_0_var(--secondary)]' : 'border-[var(--text)]/20'}`}>
                    <div className="text-base font-black text-[var(--text)]">{goal}<span className="text-[10px] ml-0.5">字</span></div>
                    <div className="text-[9px] text-[var(--text)] opacity-50">{goal === 5 ? 'ゆったり' : goal === 10 ? 'おすすめ' : 'しっかり'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* データ管理 */}
      <Section icon={Database} title={<>データ{F("管理","かんり")}</>}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between bg-[var(--bg)] rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-[var(--text)] opacity-60">ストレージ{F("使用量","しようりょう")}</span>
            <span className="text-xs font-black text-[var(--text)]">{getStorageSize()}</span>
          </div>
          <div className="flex items-center justify-between bg-[var(--bg)] rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-[var(--text)] opacity-60">{F("覚","おぼ")}えた{F("漢字","かんじ")}</span>
            <span className="text-xs font-black text-[var(--text)]">{Object.values(stats.kanjiStats || {}).filter(s => s.status === 'mastered').length} {F("字","じ")}</span>
          </div>
          <div className="flex items-center justify-between bg-[var(--bg)] rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-[var(--text)] opacity-60">{F("学習中","がくしゅうちゅう")}の{F("漢字","かんじ")}</span>
            <span className="text-xs font-black text-[var(--text)]">{Object.values(stats.kanjiStats || {}).filter(s => s.status !== 'new' && s.status !== 'mastered').length} {F("字","じ")}</span>
          </div>

          <div className="flex gap-2 mt-1">
            <MotionButton variant="secondary" className="flex-1 py-3 text-xs border-[3px] border-[var(--text)] shadow-sm" onClick={handleExport}>
              <Download size={16} /> エクスポート
            </MotionButton>
            <MotionButton variant="secondary" className="flex-1 py-3 text-xs border-[3px] border-[var(--text)] shadow-sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> インポート
            </MotionButton>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <p className="text-[11px] font-bold text-[var(--text)] opacity-80 leading-relaxed">
            {stats.lastExportAt
              ? <>{F("最後","さいご")}に{F("書","か")}き{F("出","だ")}した{F("日","ひ")}: {new Date(stats.lastExportAt).toLocaleDateString('ja-JP')}</>
              : <>まだ{F("書","か")}き{F("出","だ")}していません。{F("長","なが")}い{F("休","やす")}みの{F("前","まえ")}や、{F("端末","たんまつ")}を{F("変","か")}える{F("前","まえ")}にエクスポートしておくと{F("安心","あんしん")}です。</>}
          </p>
          {canUndoImport && (
            <MotionButton variant="secondary" className="py-3 text-xs border-[3px] border-[var(--text)] shadow-sm" onClick={handleUndoImport}>
              <RotateCcw size={16} /> {F("読","よ")}みこむ{F("前","まえ")}にもどす
            </MotionButton>
          )}

          <button onClick={handleReset} className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border-[3px] border-red-300 text-red-500 font-bold text-xs hover:bg-red-50 transition-colors">
            <Trash2 size={16} /> すべてのデータを{F("消","け")}す
          </button>
        </div>
      </Section>

      {/* ホーム画面へのインストール */}
      <Section icon={Smartphone} title={<>ホーム{F("画面","がめん")}に{F("入","い")}れる</>}>
        <InstallAppPanel />
      </Section>

      {/* 運用診断・サポート */}
      <Section icon={Activity} title="アプリの状態とサポート">
        <SystemStatusPanel />
      </Section>

      {/* バージョン情報 */}
      <div className="text-center text-[10px] text-[var(--text)] opacity-30 pb-4">
        マイ漢字タウン v{APP_VERSION} · {BUILD_COMMIT.slice(0, 8)}
      </div>

      {/* 確認ダイアログ */}
      <AnimatePresence>
        {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      </AnimatePresence>

      {/* トースト */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-[var(--text)] text-[var(--panel)] px-5 py-3 rounded-full font-bold text-sm shadow-lg border-[3px] border-[var(--panel)]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsView;
