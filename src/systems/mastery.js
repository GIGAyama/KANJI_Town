export const MASTERY_SKILLS = ['reading', 'meaning', 'writing', 'stroke'];

export const MASTERY_SKILL_DEFINITIONS = {
  reading: { label: '読み', shortLabel: '音読', icon: '📖', mode: 'read' },
  // 意味を問う問題はまだ無く、記録されるのは「見た」（exposed）だけ（上限60点）。
  // measured: false の技能は、練習をどこから始めるかの判断に使わない。
  meaning: { label: '意味', shortLabel: '意味', icon: '💡', mode: 'read', measured: false },
  writing: { label: '書字', shortLabel: 'なぞり', icon: '✍️', mode: 'write' },
  stroke: { label: '筆順', shortLabel: '書き順', icon: '🖌️', mode: 'watch' },
};

const EVIDENCE_RULES = {
  exposed: { delta: 8, cap: 60, success: false },
  // 音読チャレンジクリア。声に出して読んだ行動の証拠。
  // 音量検出のため読みの正誤までは保証できず success には数えない。
  voiced: { delta: 15, cap: 75, success: false },
  guided: { delta: 6, cap: 75, success: true },
  again: { delta: -18, success: false },
  hard: { delta: 2, success: true },
  good: { delta: 10, success: true },
  easy: { delta: 15, success: true },
};

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

function getLegacyBaseScore(card = {}) {
  if (card.status === 'mastered') return 85;
  if (card.status === 'review' || card.graduated) return 55;
  if (card.status === 'learning') return 30;
  return 0;
}

function normalizeEntry(entry, fallbackScore) {
  return {
    score: clampScore(entry?.score ?? fallbackScore),
    attempts: Math.max(0, Number(entry?.attempts) || 0),
    successes: Math.max(0, Number(entry?.successes) || 0),
    lastPracticedAt: Math.max(0, Number(entry?.lastPracticedAt) || 0),
    lastEvidence: typeof entry?.lastEvidence === 'string' ? entry.lastEvidence : null,
  };
}

/** 旧カードや部分的な保存データを4技能の共通形式へ補完する。 */
export function normalizeSkillMastery(skillMastery, card = {}) {
  const fallbackScore = getLegacyBaseScore(card);
  return Object.fromEntries(
    MASTERY_SKILLS.map((skill) => [skill, normalizeEntry(skillMastery?.[skill], fallbackScore)]),
  );
}

/** 複数技能の練習証拠を1回の状態更新で記録する。 */
export function recordSkillEvidence(card, updates, now = Date.now()) {
  const mastery = normalizeSkillMastery(card?.skillMastery, card);

  (Array.isArray(updates) ? updates : []).forEach(({ skill, evidence }) => {
    if (!MASTERY_SKILLS.includes(skill) || !EVIDENCE_RULES[evidence]) return;
    const current = mastery[skill];
    const rule = EVIDENCE_RULES[evidence];
    const proposedScore = clampScore(current.score + rule.delta);
    const nextScore = rule.cap === undefined
      ? proposedScore
      : Math.max(current.score, Math.min(proposedScore, rule.cap));

    mastery[skill] = {
      score: nextScore,
      attempts: current.attempts + 1,
      successes: current.successes + (rule.success ? 1 : 0),
      lastPracticedAt: now,
      lastEvidence: evidence,
    };
  });

  return mastery;
}

const EVALUATION_RANK = { again: 0, hard: 1, good: 2, easy: 3 };
const lowerEvaluation = (a, b) => (EVALUATION_RANK[a] <= EVALUATION_RANK[b] ? a : b);

/** 字形の点の割合から、書字の証拠を決める（講評の「字の形」と同じ区切り） */
function shapeEvidence(ratio) {
  if (ratio >= 0.85) return 'easy';
  if (ratio >= 0.6) return 'good';
  if (ratio >= 0.35) return 'hard';
  return 'again';
}

/**
 * 書き取りの採点結果から、書字（writing）と筆順（stroke）の証拠を別々に決める。
 * 以前は両方に同じ自己評価を記録していたので、「形は取れるが書き順が怪しい」を
 * 切り分けられず、筆順だけが弱い字で「書き順」から始める練習が提案されなかった。
 * - 筆順: 書き順がちがえば again、書く向きが逆の画があれば hard まで
 * - 書字: 点画の交差がちがえば again、それ以外は字形の点の割合で決める
 * どちらも、児童がつけた評価より上にはしない（自分に厳しくつけた評価はそのまま使う）。
 * 採点できなかったとき（画数ちがい・お手本なし）は、両方に評価をそのまま使う。
 * @param {object|null} gradeResult - gradeStrokes の結果
 * @param {'again'|'hard'|'good'|'easy'} evaluation - 間隔反復に使う評価
 * @returns {Array<{skill: 'writing'|'stroke', evidence: string}>}
 */
export function writingSkillEvidence(gradeResult, evaluation) {
  if (!(evaluation in EVALUATION_RANK)) return [];
  if (!gradeResult || gradeResult.strokeCountMatch !== true) {
    return [{ skill: 'writing', evidence: evaluation }, { skill: 'stroke', evidence: evaluation }];
  }
  const shape = (gradeResult.breakdown || []).find((item) => item.key === 'shape');
  const shapeRatio = shape && shape.max > 0 ? shape.points / shape.max : 0;
  const writing = gradeResult.crossMatch === false ? 'again' : shapeEvidence(shapeRatio);
  const reversed = (gradeResult.strokeFeedback || []).some((item) => item.reversed);
  const stroke = gradeResult.orderMatch === false ? 'again' : reversed ? 'hard' : evaluation;
  return [
    { skill: 'writing', evidence: lowerEvaluation(writing, evaluation) },
    { skill: 'stroke', evidence: lowerEvaluation(stroke, evaluation) },
  ];
}

/** テストや練習で実際に測っている技能（意味は見た回数しか記録していない） */
export const MEASURED_SKILLS = MASTERY_SKILLS.filter((skill) => MASTERY_SKILL_DEFINITIONS[skill].measured !== false);

export function getWeakestSkill(card, { skills = MASTERY_SKILLS } = {}) {
  const mastery = normalizeSkillMastery(card?.skillMastery, card);
  return skills
    .map((skill) => ({ skill, ...MASTERY_SKILL_DEFINITIONS[skill], ...mastery[skill] }))
    .reduce((weakest, current) => (current.score < weakest.score ? current : weakest));
}

/**
 * 新出は基礎から、復習は50点未満の最弱技能から始める。
 * 意味は見た回数でしか伸びない（7回見るまで50点未満）ので判断に使わない。
 * 以前は意味の点のせいで、復習のたびに「音読」から始まっていた。
 */
export function getRecommendedPracticeMode(card, { isNew = false, threshold = 50 } = {}) {
  if (isNew) return 'read';
  const weakest = getWeakestSkill(card, { skills: MEASURED_SKILLS });
  return weakest.score < threshold ? weakest.mode : 'test';
}

/** 学習済み漢字全体の4技能平均を学習記録画面向けに集計する。 */
export function getSkillMasterySummary(kanjiStats = {}) {
  const learnedCards = Object.values(kanjiStats || {}).filter((card) => card && card.status !== 'new');
  const totals = Object.fromEntries(MASTERY_SKILLS.map((skill) => [skill, 0]));
  let evidenceCount = 0;

  learnedCards.forEach((card) => {
    const mastery = normalizeSkillMastery(card.skillMastery, card);
    MASTERY_SKILLS.forEach((skill) => {
      totals[skill] += mastery[skill].score;
      evidenceCount += mastery[skill].attempts;
    });
  });

  const scores = Object.fromEntries(MASTERY_SKILLS.map((skill) => [
    skill,
    learnedCards.length > 0 ? Math.round(totals[skill] / learnedCards.length) : 0,
  ]));

  return { scores, learnedCount: learnedCards.length, evidenceCount };
}
