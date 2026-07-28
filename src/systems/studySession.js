// study.v1 レコードの組み立て — 漢字タウン固有層。
// 仕様書の3層構成（studyLog: 保存 / studySession: 組み立て / studyStats: 読み出し）のうち、
// セッションの開始・回答・終了・中断を追い、共通スキーマのレコードへ変換して保存する。
import { saveStudyRecord } from './studyLog.js';
import { StorageAPI } from './storage.js';
import { buildLearningReport } from './learning-report.js';
import { APP_VERSION } from './diagnostics.js';

export const STUDY_APP_ID = 'kanji-town';

// タブ非表示のままこの時間戻らなかったら中断として確定する。
// 教師の説明を聞くための離席が中断にならないよう、仕様 §5.4 により5分より短くしないこと。
const HIDDEN_ABORT_MS = 5 * 60 * 1000;
const IDLE_STOP_MS = 60 * 1000;
const TICK_MS = 1000;
const STUDY_ITEMS_MAX = 200;         // 1レコードの設問数の上限。studyLog.js と同じ値（§2.10）

let session = null;
// タブ破棄（pagehide）で確定した後、bfcache 復帰時に残り分の新レコードを開始するための控え
let resumeAfterPageHide = null;
let detachListeners = null;

/** 決定的ハッシュ（djb2）。児童作成ドリルの unit.id 生成用。乱数・時刻は混ぜない。 */
export function hashUnitName(name) {
  let h = 5381;
  const text = String(name || '');
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

/** マイドリルは固有IDを持たないため、名前ハッシュで `custom-{hash}` を割り当てる（§2.5）。 */
export function buildDrillStudyUnit(drill) {
  return {
    id: `custom-${hashUnitName(drill?.name)}`,
    title: String(drill?.name || 'マイドリル'),
    preset: false,
  };
}

/** キュー内の学年が揃っているときのみ unit.grade を設定する（§2.5）。 */
const uniformGrade = (queue) => {
  const grades = new Set((queue || []).map((k) => k?.grade).filter(Boolean));
  return grades.size === 1 ? grades.values().next().value : undefined;
};

/**
 * 学習ビューとセッションデータから、レコードのコア層メタ情報を組み立てる。
 * mode / unit / source / grading の割り当ては仕様 §3.3 の漢字タウン定義に従う。
 */
export function buildStudyMeta(view, sessionData = {}) {
  const queue = Array.isArray(sessionData.queue) ? sessionData.queue : [];
  // 中断からの復帰では残り分だけが新しいレコードの出題数になる（§5.4）
  const remaining = Array.isArray(sessionData.remainingQueue) ? sessionData.remainingQueue : queue;
  const queueIds = [...new Set(remaining.map((k) => k?.id).filter(Boolean))];
  const grade = uniformGrade(queue);

  switch (view) {
    case 'session': {
      const unit = sessionData.studyUnit
        || (sessionData.isWeakPractice
          ? { id: 'weak-review', title: 'にがて漢字の特訓', ...(grade ? { grade } : {}), preset: true }
          : sessionData.isDrill
            ? { id: 'custom-drill', title: 'マイドリル', preset: false }
            : { id: grade ? `g${grade}-daily` : 'daily-mixed', title: grade ? `${grade}年の漢字れんしゅう` : '漢字れんしゅう', ...(grade ? { grade } : {}), preset: true });
      return {
        mode: 'drill',
        unit,
        source: sessionData.isWeakPractice ? 'weak' : sessionData.isDrill ? 'custom' : 'course',
        // 読み・意味は自己評価、書字・筆順は strokeGrader の客観採点が混在する
        grading: 'mixed',
        fixedCount: queueIds.length,
      };
    }
    case 'drillTest':
      return {
        mode: 'test',
        unit: sessionData.studyUnit || { id: 'custom-drill', title: 'マイドリル', preset: false },
        source: 'custom',
        grading: 'objective',
        fixedCount: queueIds.length,
      };
    case 'flashcard':
      return {
        mode: 'flashcard',
        unit: { id: 'flashcard-read', title: 'フラッシュカード', ...(grade ? { grade } : {}), preset: true },
        // 学習済み漢字からの復習出題。自己申告（読めた／読めなかった）
        source: 'review',
        grading: 'selfReport',
        fixedCount: queueIds.length,
      };
    case 'survival':
      return {
        mode: 'survival',
        unit: { id: 'survival', title: 'サバイバル', ...(grade ? { grade } : {}), preset: true },
        source: 'review',
        grading: 'objective',
        // 制限時間まで出題が続くため、出題数は解答実績から確定する
        fixedCount: null,
      };
    case 'boss':
      return {
        mode: 'boss',
        unit: { id: 'boss-battle', title: 'ボスバトル', ...(grade ? { grade } : {}), preset: true },
        // ミスの多い漢字を優先して出題するため母集団が偏る（§2.4）
        source: 'weak',
        grading: 'objective',
        fixedCount: null,
      };
    default:
      return null;
  }
}

const now = () => Date.now();

function createState(meta, count) {
  return {
    meta,
    count,
    items: new Map(),
    startedAtMs: now(),
    activeMs: 0,
    mark: now(),
    idle: false,
    hiddenAtMs: null,
    completed: false,
    completedAtMs: null,
  };
}

function tick(s) {
  const t = now();
  if (!s.idle && !document.hidden) s.activeMs += t - s.mark;
  s.mark = t;
}

/** 既存の学習レポートを ext（拡張層）へ転用する（§3.3 / §8.2）。 */
function buildStudyExt() {
  try {
    const report = buildLearningReport(StorageAPI.getStats());
    return {
      skills: report.mastery,
      srs: {
        learned: report.progress.learned,
        mastered: report.progress.mastered,
        overdueReviews: report.support.overdueReviews,
        weekReviews: report.support.weekReviews,
      },
      weakIds: report.support.weakKanjiIds,
      streak: report.habit.streak,
    };
  } catch {
    return {};
  }
}

function finalize(status, endMsOverride) {
  const s = session;
  session = null;
  if (!s) return;
  // 1問も解答していないレコードは保存しない（§5.4 中断レコードの3原則）
  const attempted = s.items.size;
  if (attempted === 0) return;

  tick(s);
  const endMs = endMsOverride ?? s.completedAtMs ?? now();
  const elapsedMs = Math.max(0, endMs - s.startedAtMs);
  const items = Array.from(s.items.values());
  // サバイバル・ボスは出題数が可変のため、解答された数を出題数とする。
  // 固定キューでは開始時（中断復帰後は残り分）の出題数を用いる。
  const count = s.meta.fixedCount === null ? attempted : Math.max(s.count, attempted);

  // items は1レコード200件まで（studyLog.js が超過分を切り捨てる）。
  // 集計側は正答率の分母を items から数えるため、summary は切り詰めたあとの
  // items から算出し、`attempted === items.length` を必ず守る（§2.7）。
  // 切り捨てが起きたときは、実際の解答実績を ext に残して失わないようにする。
  // count は切り詰め前の attempted のままとする（出題数は実際に出した数）
  const kept = items.slice(0, STUDY_ITEMS_MAX);
  const truncated = items.length > kept.length
    ? { attempted: items.length, firstTryCorrect: items.filter((it) => it.firstTry).length }
    : null;

  saveStudyRecord({
    appId: STUDY_APP_ID,
    appVersion: APP_VERSION,
    kind: 'session',
    mode: s.meta.mode,
    unit: s.meta.unit,
    source: s.meta.source,
    multiplayer: false,
    grading: s.meta.grading,
    startedAt: new Date(s.startedAtMs).toISOString(),
    endedAt: new Date(endMs).toISOString(),
    elapsedMs,
    // 異なる時計の丸め誤差で activeMs > elapsedMs にならないよう必ずクランプする（§2.8）
    activeMs: Math.min(Math.round(s.activeMs), elapsedMs),
    timeBasis: 'app',
    status,
    summary: {
      count,
      attempted: kept.length,
      firstTryCorrect: kept.filter((it) => it.firstTry).length,
      correct: kept.filter((it) => it.ok).length,
    },
    items: kept,
    ext: { ...buildStudyExt(), ...(truncated ? { itemsTruncated: truncated } : {}) },
  });
}

function handleVisibilityChange() {
  if (!session) return;
  tick(session);
  if (document.hidden) {
    if (session.hiddenAtMs === null) session.hiddenAtMs = now();
    return;
  }
  const hiddenAt = session.hiddenAtMs;
  session.hiddenAtMs = null;
  session.mark = now();
  if (hiddenAt !== null && !session.completed && now() - hiddenAt >= HIDDEN_ABORT_MS) {
    // 5分以上戻らなかった → タブを離れた時刻で中断として締め、
    // 残り分の新しいレコードを開始する（中断済みレコードには追記しない。§5.4）
    const { meta, count, items } = session;
    const remaining = meta.fixedCount === null ? 0 : Math.max(0, count - items.size);
    finalize('aborted', hiddenAt);
    session = createState(meta, remaining);
  }
}

function handlePageHide() {
  if (!session) return;
  const { meta, count, items, completed } = session;
  const remaining = meta.fixedCount === null ? 0 : Math.max(0, count - items.size);
  finalize(completed ? 'completed' : 'aborted');
  resumeAfterPageHide = completed ? null : { meta, remaining };
}

function handlePageShow(event) {
  // bfcache から復帰して学習が続く場合は、残り分で新しいレコードを開始する
  if (event?.persisted && resumeAfterPageHide && !session) {
    session = createState(resumeAfterPageHide.meta, resumeAfterPageHide.remaining);
  }
  resumeAfterPageHide = null;
}

function attach() {
  if (detachListeners) return;
  const wake = () => {
    if (!session) return;
    tick(session);
    session.idle = false;
  };
  const tickTimer = setInterval(() => { if (session) tick(session); }, TICK_MS);
  // 一定時間操作がなければ activeMs の加算を止める（次の操作で再開）
  const idleTimer = setInterval(() => {
    if (!session) return;
    tick(session);
    session.idle = true;
  }, IDLE_STOP_MS);
  const activityEvents = ['click', 'keydown', 'touchstart', 'pointerdown'];
  activityEvents.forEach((ev) => document.addEventListener(ev, wake));
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('pageshow', handlePageShow);

  detachListeners = () => {
    clearInterval(tickTimer);
    clearInterval(idleTimer);
    activityEvents.forEach((ev) => document.removeEventListener(ev, wake));
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('pageshow', handlePageShow);
    detachListeners = null;
  };
}

/** 学習ビューへ入ったときに呼ぶ。前のセッションが残っていれば中断として確定する。 */
export function beginStudySession(meta) {
  if (!meta || !meta.unit) return;
  if (session) finalize(session.completed ? 'completed' : 'aborted');
  resumeAfterPageHide = null;
  session = createState(meta, meta.fixedCount === null ? 0 : meta.fixedCount);
  attach();
}

/**
 * 1問の解答を記録する。同じ設問への再解答は tries を重ね、firstTry は初回の結果を保持する。
 * firstTryCorrect が本仕様の主指標（§2.7）。
 */
export function recordStudyAttempt(q, { ok = false, skill } = {}) {
  if (!session || typeof q !== 'string' || q.length === 0) return;
  const item = session.items.get(q);
  if (item) {
    item.tries += 1;
    item.ok = Boolean(ok);
  } else {
    session.items.set(q, {
      q,
      ok: Boolean(ok),
      firstTry: Boolean(ok),
      tries: 1,
      ...(skill ? { skill } : {}),
    });
  }
}

/**
 * 規定の終了条件に達したときに呼ぶ（リザルトへ遷移する処理の冒頭）。
 * 実際の保存は finishStudySession が行う。統計の保存後に ext を組み立てるための二段構え。
 */
export function markStudySessionCompleted() {
  if (!session) return;
  session.completed = true;
  session.completedAtMs = now();
}

/**
 * 学習ビューを離れたときに呼ぶ。markStudySessionCompleted 済みなら completed、
 * そうでなければ aborted としてレコードを確定する（途中で切り上げた完走扱いを防ぐ。§5.4）。
 */
export function finishStudySession() {
  if (session) finalize(session.completed ? 'completed' : 'aborted');
  if (detachListeners) detachListeners();
  resumeAfterPageHide = null;
}
