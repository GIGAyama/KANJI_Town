// てきとう書き（確かめの画面で「このまま こたえあわせ」を選んだ回数）から、
// その回の学習でもらえる EXP をどれだけ減らすかを決める。いまの決まりでは、1回でもあれば その回は何ももらえない。
// 見分けるのは strokeGrader.js（measureAttempt）、数えるのは App.jsx（1回の学習ごと）。
// コイン・もちもの・レベル・土地へのペナルティは careless-penalty.js。
import { CARELESS } from '../constants/gameConfig.js';

/**
 * @param {number} count - この回の学習での、てきとう書きの回数
 * @returns {number} EXP を減らす割合（0 〜 CARELESS.EXP_PENALTY_MAX）
 */
export function carelessPenaltyRate(count) {
  const extra = Math.max(0, Math.floor(Number(count) || 0) - CARELESS.FREE_WARNINGS);
  return Math.min(CARELESS.EXP_PENALTY_MAX, Math.round(extra * CARELESS.EXP_PENALTY_STEP * 100) / 100);
}

/**
 * @param {number} exp - 減らす前の EXP
 * @param {number} count - てきとう書きの回数
 * @returns {{ exp: number, lost: number, rate: number }}
 */
export function applyCarelessPenalty(exp, count) {
  const base = Math.max(0, Math.round(Number(exp) || 0));
  const rate = carelessPenaltyRate(count);
  const kept = Math.round(base * (1 - rate));
  return { exp: kept, lost: base - kept, rate };
}
