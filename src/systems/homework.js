// 宿題（先生が「宿題にする」で配ったマイドリル）— マイ漢字タウン
//
// 宿題の決まり（しめきり・やること・問題数・合格の目安）はリンクの中に入って届き、
// 児童の端末のマイドリルに drill.homework として保存する。結果は同じドリルの
// drill.homeworkResult に残す。サーバーは無いので、先生は児童の端末を見られない。
//
//   drill.homework       = { due: 'YYYY-MM-DD', mode: 'practice'|'test', count?, pass?, id }
//   drill.homeworkResult = { tries: 回数, best: 最高点(%), doneOn?: できた日, lastOn: さいごにやった日 }
//
// id は、学習の結果をどのドリルに書くかを見分けるための端末の中だけの印（リンクには入れない）。
// ここは起動時に読む（App の記録の確定で使う）ので、何も import しない小さなものにする。
// リンクの形は drill-share.js、画面にしか使わないものは homework-status.js に置く。
// 副作用を持たない純粋ロジックだけを置き、DOM・React・KANJI_DATA には依存しない。

/** YYYY-MM-DD として正しい日付か（2020〜2099年の、暦にある日だけ） */
export function isValidDateKey(value) {
  const m = typeof value === 'string' ? value.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return y >= 2020 && y <= 2099 && mo >= 1 && mo <= 12 && d >= 1
    && d <= new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

/** 宿題のテストの問題数（0 は「ぜんぶ」） */
export const HOMEWORK_TEST_COUNTS = [0, 10, 20, 50];

/**
 * 宿題の決まり（リンク・P2P・保存データから来る外部入力）を確かめて整える。だめなら null。
 *   れんしゅう: { due: 'YYYY-MM-DD', mode: 'practice' }
 *   テスト    : { due, mode: 'test', count: 0|10|20|50, pass: 0〜100 }
 * 余分な欄は捨てる。
 */
export function sanitizeHomework(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !isValidDateKey(value.due)) return null;
  if (value.mode === 'practice') return { due: value.due, mode: 'practice' };
  const { count, pass } = value;
  if (value.mode !== 'test' || !HOMEWORK_TEST_COUNTS.includes(count)
    || !Number.isInteger(pass) || pass < 0 || pass > 100) return null;
  return { due: value.due, mode: 'test', count, pass };
}

/** 宿題の id の形（端末の中だけの印） */
export const HOMEWORK_ID_PATTERN = /^h[0-9a-z]{1,16}$/;

/** 保存してある宿題を読む（壊れていれば null） */
export function readHomework(drill) {
  const hw = sanitizeHomework(drill?.homework);
  const id = drill?.homework?.id;
  return hw && typeof id === 'string' && HOMEWORK_ID_PATTERN.test(id) ? { ...hw, id } : null;
}

/**
 * 宿題の学習を終えたときに、そのドリルへ結果を書く。
 * 点数は「できた問題 ÷ こたえた問題」。テストは合格の目安以上で、れんしゅうはぜんぶの字を書けたら「できた」。
 * （何度やり直してもできない字は次の学習へ回る。そのときは incomplete: true で呼ぶ）
 * できた日は、はじめてできた日のまま変えない。
 * @returns {{ drills: object[], report: object|null }} 見つからない・1問もこたえていないときは drills をそのまま返す
 */
export function recordHomeworkResult(drills, homeworkId, { correct, attempts, today, incomplete = false }) {
  const list = Array.isArray(drills) ? drills : [];
  const index = homeworkId ? list.findIndex((d) => readHomework(d)?.id === homeworkId) : -1;
  const tried = Math.floor(Number(attempts) || 0);
  if (index < 0 || tried <= 0 || !isValidDateKey(today)) return { drills: list, report: null };
  const drill = list[index];
  const hw = readHomework(drill);
  const score = Math.max(0, Math.min(100, Math.round(((Number(correct) || 0) / tried) * 100)));
  const prev = drill.homeworkResult || {};
  const prevBest = Number.isFinite(prev.best) ? prev.best : -1;
  // れんしゅうは、できなかった字を残して終えたとき（incomplete）は「できた」にしない
  const passed = hw.mode === 'practice' ? !incomplete : score >= hw.pass;
  const doneOn = isValidDateKey(prev.doneOn) ? prev.doneOn : passed ? today : undefined;
  const homeworkResult = {
    tries: (Number.isInteger(prev.tries) && prev.tries > 0 ? prev.tries : 0) + 1,
    best: Math.max(prevBest, score),
    ...(doneOn ? { doneOn } : {}),
    lastOn: today,
  };
  const next = [...list];
  next[index] = { ...drill, homeworkResult };
  return {
    drills: next,
    report: { name: drill.name, mode: hw.mode, score, best: homeworkResult.best, passed, pass: hw.pass, doneOn, today },
  };
}
