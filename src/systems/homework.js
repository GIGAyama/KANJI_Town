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
// ここは起動時に読む（App の記録の確定で使う）ので、画面にしか使わないものは homework-status.js に置く。
// 副作用を持たない純粋ロジックだけを置き、DOM・React・KANJI_DATA には依存しない。
import { isValidDateKey, sanitizeHomework } from './drill-share.js';

/** 宿題の id の形（端末の中だけの印） */
export const HOMEWORK_ID_PATTERN = /^h[0-9a-z]{1,16}$/;

/** 保存してある宿題を読む（壊れていれば null） */
export function readHomework(drill) {
  const hw = sanitizeHomework(drill?.homework);
  const id = drill?.homework?.id;
  return hw && typeof id === 'string' && HOMEWORK_ID_PATTERN.test(id) ? { ...hw, id } : null;
}

/** テストの宿題で出す問題数（0「ぜんぶ」と、ドリルより多い数は、ドリルの字数） */
export function homeworkQuestionCount(hw, kanjiCount) {
  const total = Math.max(0, Math.floor(Number(kanjiCount) || 0));
  return hw?.count > 0 ? Math.min(hw.count, total) : total;
}

/**
 * この学習が宿題になるときは、その宿題の id を返す（ならないときは null）。
 * やることが合っていて、テストなら決められた問題数以上で受けたときだけ宿題として数える。
 * @param {object} drill マイドリル
 * @param {'practice'|'test'} kind
 * @param {number} [count] テストの問題数
 */
export function homeworkIdFor(drill, kind, count = 0) {
  const hw = readHomework(drill);
  if (!hw || hw.mode !== kind) return null;
  if (kind === 'test' && count < homeworkQuestionCount(hw, drill.kanjis?.length)) return null;
  return hw.id;
}

/**
 * 宿題の学習を終えたときに、そのドリルへ結果を書く。
 * 点数は「できた問題 ÷ こたえた問題」。テストは合格の目安以上で、れんしゅうは終えたら「できた」。
 * できた日は、はじめてできた日のまま変えない。
 * @returns {{ drills: object[], report: object|null }} 見つからない・1問もこたえていないときは drills をそのまま返す
 */
export function recordHomeworkResult(drills, homeworkId, { correct, attempts, today }) {
  const list = Array.isArray(drills) ? drills : [];
  const index = homeworkId ? list.findIndex((d) => readHomework(d)?.id === homeworkId) : -1;
  const tried = Math.floor(Number(attempts) || 0);
  if (index < 0 || tried <= 0 || !isValidDateKey(today)) return { drills: list, report: null };
  const drill = list[index];
  const hw = readHomework(drill);
  const score = Math.max(0, Math.min(100, Math.round(((Number(correct) || 0) / tried) * 100)));
  const prev = drill.homeworkResult || {};
  const prevBest = Number.isFinite(prev.best) ? prev.best : -1;
  const passed = hw.mode === 'practice' || score >= hw.pass;
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
