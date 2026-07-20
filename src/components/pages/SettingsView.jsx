import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Palette, GraduationCap, Database, Download, Upload, Trash2, RotateCcw, Sun, Moon, Sparkles, ChevronRight, AlertTriangle, Check, X } from 'lucide-react';
import { MotionButton } from '../ui';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { DAILY_GOAL_OPTIONS, getDailyGoal } from '../../systems/learning-plan';

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
  const showFurigana = settings.showFurigana !== false;
  const sessionSize = settings.sessionSize || 'normal';
  const dailyGoal = getDailyGoal(settings);

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
    const data = JSON.stringify(stats, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanji-town-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('データをエクスポートしました');
  };

  // データインポート
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.kanjiStats && !imported.totalExp && imported.totalExp !== 0) {
          showToast('ファイルの形式が正しくありません');
          return;
        }
        setConfirm({
          title: 'データを復元',
          message: 'バックアップデータで今のデータを上書きします。この操作は取り消せません。',
          danger: true,
          onConfirm: () => {
            StorageAPI.saveStatsImmediate(imported);
            setStats(StorageAPI.getStats());
            setConfirm(null);
            showToast('データを復元しました');
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
  const handleReset = () => {
    setConfirm({
      title: 'データを全て消す',
      message: 'すべてのセーブデータ（漢字の進捗・まちのデータ・実績など）が消えます。この操作は取り消せません！',
      danger: true,
      onConfirm: () => {
        window.localStorage.removeItem('kanji_town_v7');
        window.localStorage.removeItem('kanji_mega_builder_final_v6');
        window.localStorage.removeItem('kanji_mega_builder_final_v5');
        setStats(StorageAPI.getStats());
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
              <div className="text-[10px] text-[var(--text)] opacity-50">セッション{F("開始時","かいしじ")}に{F("音声","おんせい")}を{F("再生","さいせい")}</div>
            </div>
            <button onClick={() => { audioCtrl.playSE('click'); updateSettings({ autoPlay: !autoPlay }); }} className={`w-14 h-8 rounded-full border-[3px] border-[var(--text)] transition-all relative ${autoPlay ? 'bg-[var(--secondary)]' : 'bg-gray-300'}`}>
              <motion.div animate={{ x: autoPlay ? 22 : 2 }} className="absolute top-0.5 w-5 h-5 rounded-full bg-white border-2 border-[var(--text)]" />
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

          <button onClick={handleReset} className="mt-2 flex items-center justify-center gap-2 py-3 rounded-xl border-[3px] border-red-300 text-red-500 font-bold text-xs hover:bg-red-50 transition-colors">
            <Trash2 size={16} /> すべてのデータを{F("消","け")}す
          </button>
        </div>
      </Section>

      {/* バージョン情報 */}
      <div className="text-center text-[10px] text-[var(--text)] opacity-30 pb-4">
        マイ漢字タウン v0.1.0 | Phase 6
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
