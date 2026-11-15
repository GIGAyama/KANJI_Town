// 宿題の見せ方（ホームのカード・マイドリル・受け取り画面・結果画面）— マイ漢字タウン
//
// 画面でしか使わないものをここに置く（起動時に読む homework.js を小さく保つため）。
// 副作用を持たない純粋ロジックだけを置き、DOM・React・KANJI_DATA には依存しない。
import { isValidDateKey, sanitizeHomework } from './drill-share.js';
import { HOMEWORK_ID_PATTERN, readHomework } from './homework.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const keyToUtc = (key) => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

/** today から due までの日数（あした=1、きのう=-1）。どちらかが日付でなければ null */
export function daysUntil(due, today) {
  if (!isValidDateKey(due) || !isValidDateKey(today)) return null;
  return Math.round((keyToUtc(due) - keyToUtc(today)) / DAY_MS);
}

/** YYYY-MM-DD に日数を足す（日付でなければ null） */
export function addDays(key, days) {
  if (!isValidDateKey(key)) return null;
  const date = new Date(keyToUtc(key) + Math.round(Number(days) || 0) * DAY_MS);
  return date.toISOString().slice(0, 10);
}

/** 「11/20」の形（日付でなければ ''） */
export function formatMonthDay(key) {
  return isValidDateKey(key) ? `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}` : '';
}

/** 保存してある宿題の結果を読む（壊れた欄は捨てる） */
export function readHomeworkResult(drill) {
  const r = drill?.homeworkResult;
  if (!r || typeof r !== 'object') return { tries: 0, best: null, doneOn: null, lastOn: null };
  return {
    tries: Number.isInteger(r.tries) && r.tries > 0 ? r.tries : 0,
    best: Number.isFinite(r.best) && r.best >= 0 && r.best <= 100 ? r.best : null,
    doneOn: isValidDateKey(r.doneOn) ? r.doneOn : null,
    lastOn: isValidDateKey(r.lastOn) ? r.lastOn : null,
  };
}

/**
 * 宿題の今のようす。宿題でなければ null。
 *   state: 'todo'（まだ）| 'doing'（とりくみ中）| 'done'（できた）
 *   daysLeft: しめきりまでの日数（きょう=0、すぎたら負）
 */
export function getHomeworkState(drill, today) {
  const hw = readHomework(drill);
  if (!hw) return null;
  const result = readHomeworkResult(drill);
  const state = result.doneOn ? 'done' : result.tries > 0 ? 'doing' : 'todo';
  const daysLeft = daysUntil(hw.due, today);
  return { ...hw, state, daysLeft, overdue: state !== 'done' && daysLeft !== null && daysLeft < 0, result };
}

/**
 * ホームに出す宿題。まだの宿題は いつまでも出し、できた宿題は しめきりの日まで出す。
 * まだ・とりくみ中を しめきりが近い順に先へ、できたものは あとに並べる。
 * @returns {{ drill: object, index: number, hw: object }[]} index は myDrills の中の位置
 */
export function listHomeworkForHome(drills, today) {
  return (Array.isArray(drills) ? drills : [])
    .map((drill, index) => ({ drill, index, hw: getHomeworkState(drill, today) }))
    .filter(({ hw }) => hw && (hw.state !== 'done' || (hw.daysLeft ?? -1) >= 0))
    .sort((a, b) => (Number(a.hw.state === 'done') - Number(b.hw.state === 'done'))
      || a.hw.due.localeCompare(b.hw.due)
      || a.index - b.index);
}

/** 同じ宿題の決まりか（しめきり・やること・問題数・合格の目安） */
function sameHomework(a, b) {
  const x = sanitizeHomework(a);
  const y = sanitizeHomework(b);
  if (!x || !y) return !x && !y;
  return x.due === y.due && x.mode === y.mode && x.count === y.count && x.pass === y.pass;
}

/** 端末の中で重ならない宿題の id を作る */
function makeHomeworkId(drills, now) {
  const used = new Set(drills.map((d) => d?.homework?.id));
  let n = Math.max(0, Math.floor(Number(now) || 0));
  let id = `h${n.toString(36)}`;
  while (used.has(id) || !HOMEWORK_ID_PATTERN.test(id)) { n += 1; id = `h${n.toString(36)}`; }
  return id;
}

/**
 * 受け取ったドリル（リンク・4けたの数字）をマイドリルに足す。
 * - 漢字は isKnownKanji が true のものだけ（このアプリに無い字を落とす）
 * - 宿題があれば、端末の中の id を付けて保存する
 * - 名前・字・宿題がまったく同じドリルがもうあれば、足さずにそれを返す（同じリンクを2回ひらいたとき）
 * @returns {{ myDrills: object[], drill: object|null, alreadySaved: boolean }} 字が1つも無ければ drill は null
 */
export function addReceivedDrill(myDrills, received, { now = Date.now(), isKnownKanji = () => true } = {}) {
  const list = Array.isArray(myDrills) ? myDrills : [];
  const kanjis = (Array.isArray(received?.kanjis) ? received.kanjis : []).filter((id) => isKnownKanji(id));
  if (!received?.name || kanjis.length === 0) return { myDrills: list, drill: null, alreadySaved: false };
  const homework = sanitizeHomework(received.homework);
  const existing = list.find((d) => d?.name === received.name
    && Array.isArray(d.kanjis) && d.kanjis.length === kanjis.length
    && d.kanjis.every((id, i) => id === kanjis[i])
    && sameHomework(d.homework, homework)
    && (!homework || readHomework(d)));
  if (existing) return { myDrills: list, drill: existing, alreadySaved: true };
  const drill = {
    name: received.name,
    kanjis,
    createdAt: now,
    ...(homework ? { homework: { ...homework, id: makeHomeworkId(list, now) } } : {}),
  };
  return { myDrills: [...list, drill], drill, alreadySaved: false };
}
