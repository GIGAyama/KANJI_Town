import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, AlertCircle, ArrowLeft } from 'lucide-react';
import { F } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';

const StatsView = ({ setView, stats }) => {
  const kanjiList = KANJI_DATA.map(k => ({ ...k, stat: stats.kanjiStats?.[k.id] }));
  const mastered = kanjiList.filter(k => k.stat?.status === 'mastered').length;
  const learning = kanjiList.filter(k => k.stat?.status === 'learning' || k.stat?.status === 'review').length;
  const notYet = kanjiList.filter(k => !k.stat || k.stat?.status === 'new').length;
  const totalKanji = KANJI_DATA.length;

  // 直近7日の学習データ
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString();
      const label = i === 0 ? '今日' : i === 1 ? '昨日' : `${d.getDate()}日`;
      days.push({ label, exp: stats.daily?.[key]?.exp || 0, reviewed: stats.daily?.[key]?.reviewed || 0 });
    }
    return days;
  }, [stats.daily]);

  const maxExp = Math.max(...dailyData.map(d => d.exp), 1);

  // 苦手な漢字 top5
  const weakKanji = kanjiList
    .filter(k => k.stat && (k.stat.mistakes || 0) > 0)
    .sort((a, b) => (b.stat.mistakes || 0) - (a.stat.mistakes || 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><BarChart3 size={24} className="text-[var(--secondary)]" /> {F("学習","がくしゅう")}きろく</h2>
      </div>

      {/* 習得状況サマリー */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
        <div className="text-sm font-black text-[var(--text)] opacity-60 mb-3 text-center">{F("漢字","かんじ")}の{F("習得","しゅうとく")}{F("状況","じょうきょう")}（{F("全","ぜん")}{totalKanji}{F("文字","もじ")}）</div>
        <div className="flex h-6 rounded-full overflow-hidden border-[2px] border-[var(--text)] mb-2">
          {mastered > 0 && <div className="bg-emerald-400 transition-all" style={{ width: `${(mastered / totalKanji) * 100}%` }} title={`習得: ${mastered}`} />}
          {learning > 0 && <div className="bg-sky-400 transition-all" style={{ width: `${(learning / totalKanji) * 100}%` }} title={`学習中: ${learning}`} />}
          <div className="bg-gray-200 flex-1" title={`未学習: ${notYet}`} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: <>{F("習得","しゅうとく")}</>, count: mastered, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { label: <>{F("学習中","がくしゅうちゅう")}</>, count: learning, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
            { label: <>{F("未学習","みがくしゅう")}</>, count: notYet, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border-2 rounded-xl p-2`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
              <div className="text-xs font-bold text-[var(--text)] opacity-60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 連続学習ストリーク */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-3xl font-black text-[var(--primary)]">{stats.streak || 0}</div>
          <div className="text-xs font-bold text-[var(--text)] opacity-60">{F("連続","れんぞく")}{F("学習","がくしゅう")}{F("日数","にっすう")}</div>
        </div>
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-1">⚡</div>
          <div className="text-3xl font-black text-amber-500">{(stats.totalExp || 0).toLocaleString()}</div>
          <div className="text-xs font-bold text-[var(--text)] opacity-60">{F("累計","るいけい")}EXP</div>
        </div>
      </div>

      {/* 7日間の学習グラフ */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-black text-[var(--text)] mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-[var(--secondary)]" /> {F("直近","ちょっきん")}7{F("日","にち")}の{F("学習","がくしゅう")}EXP</div>
        <div className="flex items-end gap-2 h-24">
          {dailyData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-[var(--secondary)] opacity-80 transition-all" style={{ height: `${Math.max((day.exp / maxExp) * 80, day.exp > 0 ? 8 : 2)}px` }} />
              <div className="text-[9px] font-bold text-[var(--text)] opacity-50 truncate w-full text-center">{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 苦手な漢字 */}
      {weakKanji.length > 0 && (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-black text-[var(--text)] mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-rose-500" /> {F("苦手","にがて")}な{F("漢字","かんじ")} TOP5</div>
          <div className="flex flex-col gap-2">
            {weakKanji.map((k, i) => (
              <div key={k.id} className="flex items-center gap-3 bg-[var(--bg)] rounded-xl px-3 py-2">
                <span className="text-2xl font-black" style={{ fontFamily: "'Klee One', serif" }}>{k.char}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--text)]">{k.on[0] || k.kun[0] || ''}</div>
                  <div className="text-xs text-rose-500 font-bold">ミス {k.stat.mistakes}{F("回","かい")}</div>
                </div>
                <div className="text-lg">{'😅'.repeat(Math.min(i + 1, 3))}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsView;
