/**
 * 1日ごとの学習記録（stats.daily）を、月ごとの集計（stats.dailyArchive）にたたむ。
 *
 * 容量が足りなくなったとき、以前は古い日を消していた。通算の学習日数と復習回数の実績は
 * daily から数え直すので、消したとたんに進み具合が戻っていた（120日 → 8日）。
 * たためば、日ごとの細かさは失うが、数は残る。React や JSX に依存させない（テストから読むため）。
 */

/** 1日の記録で数える欄（月ごとの集計にたたむときも同じ欄を足す） */
export const DAILY_SUM_FIELDS = ['exp', 'reviewed', 'perfects', 'attempts', 'correct'];
/** 0 のときは月ごとの集計に欄を作らないもの（てきとう書きの回数。無い子の記録を太らせない） */
const DAILY_OPTIONAL_SUM_FIELDS = ['careless', 'carelessWarned'];

/**
 * cutoffDate（YYYY-MM-DD）より前の日を月ごとの集計にたたんだ新しい stats を返す。
 * cutoffDate が null なら全部の日をたたむ。元の stats は変えない。
 */
export function foldDailyIntoArchive(stats, cutoffDate) {
  if (!stats || !stats.daily) return stats;
  const daily = { ...stats.daily };
  const dailyArchive = { ...(stats.dailyArchive || {}) };
  for (const dateKey of Object.keys(daily)) {
    if (cutoffDate && dateKey >= cutoffDate) continue;
    const day = daily[dateKey] || {};
    const monthKey = dateKey.slice(0, 7);
    const month = { days: 0, ...(dailyArchive[monthKey] || {}) };
    month.days += 1;
    for (const field of DAILY_SUM_FIELDS) month[field] = (Number(month[field]) || 0) + (Number(day[field]) || 0);
    for (const field of DAILY_OPTIONAL_SUM_FIELDS) {
      const sum = (Number(month[field]) || 0) + (Number(day[field]) || 0);
      if (sum > 0) month[field] = sum;
    }
    dailyArchive[monthKey] = month;
    delete daily[dateKey];
  }
  return { ...stats, daily, dailyArchive };
}

/** 通算の学習日数と復習回数（たたんだ月の分も数える） */
export function countStudyTotals(stats) {
  const daily = stats?.daily || {};
  const archive = stats?.dailyArchive || {};
  let loginDays = Object.keys(daily).length;
  let reviewTotal = Object.values(daily).reduce((sum, d) => sum + (Number(d?.reviewed) || 0), 0);
  for (const month of Object.values(archive)) {
    loginDays += Number(month?.days) || 0;
    reviewTotal += Number(month?.reviewed) || 0;
  }
  return { loginDays, reviewTotal };
}
