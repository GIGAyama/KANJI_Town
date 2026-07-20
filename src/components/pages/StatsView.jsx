import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, AlertCircle, ArrowLeft, Target, CalendarClock } from 'lucide-react';
import { F } from '../ui/FormatKun';
import { KANJI_DATA } from '../../data/kanji-data';
import { buildWeakKanjiPlan, getReviewForecast, getWeeklyLearningSummary, WEAK_PRACTICE_SUCCESS_TARGET } from '../../systems/learning-plan';

const StatsView = ({ setView, stats, startWeakSession }) => {
  const kanjiList = KANJI_DATA.map(k => ({ ...k, stat: stats.kanjiStats?.[k.id] }));
  const mastered = kanjiList.filter(k => k.stat?.status === 'mastered').length;
  const learning = kanjiList.filter(k => k.stat?.status === 'learning' || k.stat?.status === 'review').length;
  const notYet = kanjiList.filter(k => !k.stat || k.stat?.status === 'new').length;
  const totalKanji = KANJI_DATA.length;

  const weeklySummary = useMemo(
    () => getWeeklyLearningSummary(stats),
    [stats.daily, stats.settings],
  );
  const dailyData = weeklySummary.days.map((day, index) => ({
    ...day,
    label: index === 6 ? '今日' : index === 5 ? '昨日' : `${day.date.getDate()}日`,
  }));

  const maxExp = Math.max(...dailyData.map(d => d.exp), 1);
  const reviewForecast = useMemo(
    () => getReviewForecast(stats.kanjiStats),
    [stats.kanjiStats],
  );
  const forecastData = reviewForecast.days.map((day, index) => ({
    ...day,
    label: index === 0 ? '今日' : index === 1 ? '明日' : `${day.date.getMonth() + 1}/${day.date.getDate()}`,
  }));
  const nextReviewLabel = reviewForecast.nextReviewAt
    ? `${new Date(reviewForecast.nextReviewAt).getMonth() + 1}月${new Date(reviewForecast.nextReviewAt).getDate()}日`
    : null;

  // 復習期限・つまずき・連続正解数を加味した苦手漢字 top5
  const weakKanji = useMemo(() => {
    const { queue } = buildWeakKanjiPlan({
      kanjiData: KANJI_DATA,
      kanjiStats: stats.kanjiStats,
    });
    return queue.map(k => ({ ...k, stat: stats.kanjiStats?.[k.id] }));
  }, [stats.kanjiStats]);

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

      {/* 学習習慣サマリー */}
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
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-1">🎯</div>
          <div className="text-3xl font-black text-emerald-500">{weeklySummary.goalDays}<span className="text-base text-[var(--text)] opacity-40"> / 7</span></div>
          <div className="text-xs font-bold text-[var(--text)] opacity-60">{F("今週","こんしゅう")}の{F("目標","もくひょう")}{F("達成","たっせい")}</div>
        </div>
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-1">✍️</div>
          <div className="text-3xl font-black text-sky-500">{weeklySummary.accuracy === null ? '—' : `${weeklySummary.accuracy}%`}</div>
          <div className="text-xs font-bold text-[var(--text)] opacity-60">7{F("日","にち")}の{F("正答率","せいとうりつ")}</div>
        </div>
      </div>

      {/* 7日間の学習グラフ */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-black text-[var(--text)] mb-1 flex items-center gap-2"><TrendingUp size={16} className="text-[var(--secondary)]" /> {F("直近","ちょっきん")}7{F("日","にち")}の{F("学習","がくしゅう")}EXP</div>
        <div className="mb-3 text-[10px] font-bold text-[var(--text)] opacity-50">緑のバーは1日{weeklySummary.goal}{F("字","じ")}の{F("目標","もくひょう")}クリア</div>
        <div className="flex items-end gap-2 h-24">
          {dailyData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-lg transition-all ${day.goalComplete ? 'bg-emerald-400' : 'bg-[var(--secondary)] opacity-80'}`}
                style={{ height: `${Math.max((day.exp / maxExp) * 80, day.exp > 0 ? 8 : 2)}px` }}
                title={`${day.label}: ${day.exp} EXP・${day.reviewed}字`}
              />
              <div className={`text-[9px] font-bold truncate w-full text-center ${day.goalComplete ? 'text-emerald-600' : 'text-[var(--text)] opacity-50'}`}>{day.goalComplete ? '✓' : ''}{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 間隔反復の復習予報 */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-black text-[var(--text)] flex items-center gap-2"><CalendarClock size={17} className="text-sky-500" /> 7{F("日間","にちかん")}の{F("復習","ふくしゅう")}{F("予報","よほう")}</div>
          <div className="rounded-full bg-sky-50 border-2 border-sky-200 px-2.5 py-1 text-xs font-black text-sky-700">{reviewForecast.weekCount}{F("字","じ")}</div>
        </div>
        <div className={`mb-3 text-[11px] font-bold ${reviewForecast.overdueCount > 0 ? 'text-rose-600' : 'text-[var(--text)] opacity-55'}`}>
          {reviewForecast.overdueCount > 0
            ? `${reviewForecast.overdueCount}字が復習を待っています`
            : reviewForecast.todayCount > 0
              ? `きょうは ${reviewForecast.todayCount}字の復習予定です`
              : reviewForecast.tomorrowCount > 0
                ? `あしたは ${reviewForecast.tomorrowCount}字の復習予定です`
                : nextReviewLabel
                  ? `次の復習は ${nextReviewLabel} です`
                  : '学習した漢字が増えると、ここに予定が表示されます'}
        </div>
        <div className="flex items-end gap-2 h-28" role="list" aria-label={`7日間の復習予定、合計${reviewForecast.weekCount}字`}>
          {forecastData.map((day, index) => (
            <div key={day.key} role="listitem" aria-label={`${day.label}、復習${day.count}字`} className="flex-1 flex h-full flex-col items-center justify-end gap-1">
              <div className={`text-[10px] font-black ${day.count > 0 ? 'text-sky-700' : 'text-[var(--text)] opacity-35'}`}>{day.count}</div>
              <div className="flex h-16 w-full items-end">
                <div
                  className={`w-full rounded-t-lg transition-all ${index === 0 && reviewForecast.overdueCount > 0 ? 'bg-rose-400' : 'bg-sky-400'}`}
                  style={{ height: `${Math.max((day.count / reviewForecast.maxCount) * 64, day.count > 0 ? 8 : 2)}px`, opacity: day.count > 0 ? 1 : 0.25 }}
                  title={`${day.label}: ${day.count}字`}
                  aria-hidden="true"
                />
              </div>
              <div className={`w-full truncate text-center text-[9px] font-bold ${index < 2 ? 'text-[var(--text)]' : 'text-[var(--text)] opacity-50'}`}>{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 苦手な漢字 */}
      {weakKanji.length > 0 && (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-black text-[var(--text)] flex items-center gap-2"><AlertCircle size={16} className="text-rose-500" /> {F("苦手","にがて")}な{F("漢字","かんじ")} TOP5</div>
            <button
              type="button"
              onClick={startWeakSession}
              className="min-h-[44px] rounded-xl border-[2px] border-[var(--text)] bg-rose-400 px-3 py-2 text-xs font-black text-white shadow-[0_2px_0_var(--text)] transition-transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-rose-300"
              aria-label={`苦手な漢字${weakKanji.length}字の集中練習を始める`}
            >
              <span className="flex items-center gap-1.5"><Target size={16} aria-hidden="true" /> にがて{F("特訓","とっくん")} {weakKanji.length}{F("字","じ")}</span>
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {weakKanji.map((k) => (
              <div key={k.id} className="flex items-center gap-3 bg-[var(--bg)] rounded-xl px-3 py-2">
                <span className="text-2xl font-black" style={{ fontFamily: "'Klee One', serif" }}>{k.char}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--text)]">{k.on[0] || k.kun[0] || ''}</div>
                  <div className="text-xs text-rose-500 font-bold">
                    ミス {k.stat.mistakes || 0}{F("回","かい")}
                    {(k.stat.lapses || 0) > 0 && `・つまずき ${k.stat.lapses}回`}
                  </div>
                </div>
                <div className="shrink-0 rounded-lg bg-[var(--panel)] px-2 py-1 text-[10px] font-black text-[var(--text)] opacity-70" aria-label={`連続正解${k.stat.practiceStreak || 0}回、目標${WEAK_PRACTICE_SUCCESS_TARGET}回`}>
                  できた {k.stat.practiceStreak || 0}/{WEAK_PRACTICE_SUCCESS_TARGET}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsView;
