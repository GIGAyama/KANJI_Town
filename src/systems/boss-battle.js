// ボスバトルのルール — マイ漢字タウン
// React に依存しない純粋な関数だけを置く（components/training/BossBattleView.jsx が使い、test/ から確かめる）。
//
// ボスバトルは、まちがいの多い字の「書きとりテスト」を たたかいの形にしたもの。
// 前の決まりは、楽しむ前に負けるように できていた:
//   ・書けたかどうかを点数だけで決めていて、ふつうに書いた字でも 3 回に 1 回は「ミス」になった
//     （docs/stroke-grading.md の試算。線の交わりの見方が きびしい）
//   ・ハートは 3 つで、ミス 1 回で 2 つ へる。にがてな字ばかり 10 問のうち 2 回まちがえると負け
//     （10 問のうち 7 問 書ける子が 勝てるのは 10 回に 1 回くらい）
//   ・まちがえても 正しい字を見られず、会心の一撃でも ふつうの こうげきと 同じダメージだった
//
// いまの決まり:
//   ・書けたかどうかは、毎日のテストと同じ判定（strokeGrader.js の judgeWriting）で決める
//   ・ていねいに書くほど 大きなダメージ（会心 15・ヒット 10・かすり 5）。つづけて当てると コンボで ふえる
//   ・ハートが へるのは「書けなかった」ときだけ（1 回に 1 つ）。おしい字（書き順・線の交わり・1 画の差・小さい字）は
//     ボスに ふせがれるだけで、ハートは へらない
//   ・書けなかった字・おしい字は、こたえを見たあと 2 問あとに「リベンジ」で もう一度出る。
//     書ければ ダメージが ふえて、ハートが 1 つ もどる（まちがいを 直すことが、勝つ近道になる）

import { appendRound } from './question-queue.js';

/** ボスバトルの決まりの数 */
export const BOSS_RULES = Object.freeze({
  /** じぶんの ハートの数 */
  PLAYER_MAX_HP: 4,
  /** こうげきの ダメージ（会心・ヒット・かすり） */
  DAMAGE: Object.freeze({ critical: 15, hit: 10, graze: 5 }),
  /** コンボ 2 から、1 つ ふえるごとに足すダメージと、その上限 */
  COMBO_STEP: 2,
  COMBO_MAX_BONUS: 6,
  /** リベンジで書けたときに足すダメージ */
  REVENGE_BONUS: 5,
  /** まちがえた字は、ほかの字を この数だけ はさんでから もう一度出す */
  REVENGE_DELAY: 2,
  /** もらえるコイン（1 回の こうげき・勝ったときの ★ 1 つ） */
  COINS: Object.freeze({ critical: 8, hit: 5, graze: 3, star: 10 }),
});

/**
 * ボス。上から順に出てくる（前のボスを たおすと、次のボスと たたかえる）。
 * hp が大きいほど 長い たたかいになる。名前・せりふ・絵は data/boss-art.js と画面の側にある。
 */
export const BOSSES = Object.freeze([
  Object.freeze({ id: 'ghost', hp: 100 }),
  Object.freeze({ id: 'octopus', hp: 110 }),
  Object.freeze({ id: 'oni', hp: 120 }),
  Object.freeze({ id: 'dragon', hp: 130 }),
]);

export const bossById = (id) => BOSSES.find((boss) => boss.id === id) || BOSSES[0];

/** 1 問の制限時間（秒）。画数が多いほど長い。にがてな字を思い出す時間を入れて、前（画数 × 3、15〜45 秒）より長くした */
export function timeLimitFor(strokeCount) {
  const strokes = Number.isFinite(strokeCount) && strokeCount > 0 ? strokeCount : 0;
  if (!strokes) return 30;
  return Math.min(60, Math.max(20, strokes * 3 + 10));
}

/**
 * 書いた字の判定（judgeWriting の結果）を、たたかいの できごとに する。
 *   critical … 会心の一撃（よく書けた）      hit … ヒット（書けた）      graze … かすった（書けたが ざつ）
 *   blocked  … おしい。ボスに ふせがれた（ハートは へらない）           miss … 書けなかった（ハートが 1 つ へる）
 * evaluation は 間隔反復に わたす評価（毎日のテストと同じ）。
 * @param {object|null} judgment judgeWriting の結果。何も書かずに時間が切れたときは null
 * @returns {{ kind: 'critical'|'hit'|'graze'|'blocked'|'miss', evaluation: 'easy'|'good'|'hard'|'again', reason: string }}
 */
export function judgeAttack(judgment) {
  if (!judgment) return { kind: 'miss', evaluation: 'again', reason: 'timeout' };
  const { verdict, evaluation, reason, attempt, lenient } = judgment;
  if (verdict === 'pass') {
    // 書き順・線の交わりが ちがう字は、形が合っていても こうげきを通さない（まちがった書き方に ごほうびを出さない）
    if (reason === 'order' || reason === 'cross') return { kind: 'blocked', evaluation: 'hard', reason };
    if (lenient) return { kind: 'graze', evaluation: 'hard', reason };
    if (evaluation === 'easy') return { kind: 'critical', evaluation: 'easy', reason: 'ok' };
    if (evaluation === 'good') return { kind: 'hit', evaluation: 'good', reason: 'ok' };
    return { kind: 'graze', evaluation: 'hard', reason: 'rough' };
  }
  // 読み取れる字（1 画の差・小さい字など）は、書こうとして書けている。ハートは へらさず、理由を伝えて リベンジに回す
  if (verdict === 'retry' && attempt?.recognized) return { kind: 'blocked', evaluation: 'again', reason: reason || 'shape' };
  return { kind: 'miss', evaluation: 'again', reason: verdict === 'careless' ? 'careless' : (reason || 'shape') };
}

/** ボスの ようす。0: ふつう  1: いかり（体力が半分より少ない）  2: ピンチ（体力が 2 割より少ない） */
export function bossPhase(hp, maxHp) {
  if (!(maxHp > 0) || hp <= 0) return 2;
  const ratio = hp / maxHp;
  return ratio > 0.5 ? 0 : ratio > 0.2 ? 1 : 2;
}

/** コンボの数から、足すダメージ */
export const comboBonus = (combo) => Math.min(BOSS_RULES.COMBO_MAX_BONUS, Math.max(0, combo - 1) * BOSS_RULES.COMBO_STEP);

/**
 * たたかいを はじめる。
 * @param {object[]} queue 出す字（まちがいの多い順。App が作る）
 * @param {{ bossId?: string }} [options]
 */
export function createBattle(queue, { bossId } = {}) {
  const boss = bossById(bossId);
  const pool = Array.isArray(queue) ? queue.filter(Boolean) : [];
  const upcoming = pool.map((kanji) => ({ kanji, revenge: false }));
  return {
    bossId: boss.id,
    bossMaxHp: boss.hp,
    bossHp: boss.hp,
    playerMaxHp: BOSS_RULES.PLAYER_MAX_HP,
    playerHp: BOSS_RULES.PLAYER_MAX_HP,
    pool,
    current: upcoming[0] || null,
    upcoming: upcoming.slice(1),
    turn: 1,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    criticals: 0,
    grazes: 0,
    blocked: 0,
    misses: 0,
    revenges: 0,
    coins: 0,
    /** こたえを見た字（書けなかった字・おしい字）。重ねて入れない */
    failed: [],
    status: pool.length ? 'fighting' : 'lost',
  };
}

/** これから出す問題が足りなければ、出す字を 1 周ぶん足す（つなぎ目で同じ字が つづかないように） */
function refill(upcoming, pool, last, random) {
  if (!pool.length) return upcoming;
  const kanjis = appendRound([last, ...upcoming.map((entry) => entry.kanji)], pool, random).slice(upcoming.length + 1);
  return [...upcoming, ...kanjis.map((kanji) => ({ kanji, revenge: false }))];
}

/** まちがえた字を、ほかの字を REVENGE_DELAY 問 はさんだ所に「リベンジ」として入れる */
function queueRevenge(upcoming, kanji, pool, random) {
  let list = upcoming;
  // 先の問題が足りなければ足す（すぐ次に 同じ字が出ないように）
  if (list.length < BOSS_RULES.REVENGE_DELAY && pool.some((item) => item !== kanji)) list = refill(list, pool, kanji, random);
  const at = Math.min(BOSS_RULES.REVENGE_DELAY, list.length);
  // 近くに 同じ字が もう ならんでいれば、それを リベンジにする（同じ字を 2 回 足さない）
  const near = list.findIndex((entry, i) => i <= at + 1 && entry.kanji === kanji);
  if (near >= 0) return list.map((entry, i) => (i === near ? { kanji, revenge: true } : entry));
  return [...list.slice(0, at), { kanji, revenge: true }, ...list.slice(at)];
}

/**
 * 1 回の こうげきの結果で、たたかいを 1 つ進める。もとの state は変えない。
 * @param {ReturnType<typeof createBattle>} state
 * @param {ReturnType<typeof judgeAttack>} attack
 * @param {() => number} [random]
 * @returns {{ state: object, damage: number, parts: { base: number, combo: number, revenge: number },
 *            healed: boolean, hurt: boolean, revenge: boolean, evaluation: string }}
 *   evaluation は 間隔反復に わたす評価（リベンジで書けた字は、こたえを見た すぐあとなので good まで）
 */
export function resolveTurn(state, attack, random = Math.random) {
  if (state.status !== 'fighting' || !state.current) return { state, damage: 0, parts: { base: 0, combo: 0, revenge: 0 }, healed: false, hurt: false, revenge: false, evaluation: attack.evaluation };
  const { kanji, revenge } = state.current;
  const next = { ...state };
  const parts = { base: 0, combo: 0, revenge: 0 };
  let healed = false;
  let hurt = false;
  const landed = attack.kind === 'critical' || attack.kind === 'hit' || attack.kind === 'graze';

  if (landed) {
    next.combo = state.combo + 1;
    next.maxCombo = Math.max(state.maxCombo, next.combo);
    parts.base = BOSS_RULES.DAMAGE[attack.kind];
    parts.combo = comboBonus(next.combo);
    if (revenge) {
      parts.revenge = BOSS_RULES.REVENGE_BONUS;
      next.revenges = state.revenges + 1;
      if (state.playerHp < state.playerMaxHp) { next.playerHp = state.playerHp + 1; healed = true; }
    }
    if (attack.kind === 'critical') next.criticals = state.criticals + 1;
    else if (attack.kind === 'hit') next.hits = state.hits + 1;
    else next.grazes = state.grazes + 1;
    next.coins = state.coins + BOSS_RULES.COINS[attack.kind];
  } else {
    next.combo = 0;
    if (attack.kind === 'miss') {
      next.misses = state.misses + 1;
      next.playerHp = Math.max(0, state.playerHp - 1);
      hurt = true;
    } else {
      next.blocked = state.blocked + 1;
    }
    if (!state.failed.includes(kanji)) next.failed = [...state.failed, kanji];
  }

  const damage = parts.base + parts.combo + parts.revenge;
  next.bossHp = Math.max(0, state.bossHp - damage);

  if (next.bossHp <= 0) next.status = 'won';
  else if (next.playerHp <= 0) next.status = 'lost';

  if (next.status === 'fighting') {
    let upcoming = landed ? state.upcoming : queueRevenge(state.upcoming, kanji, state.pool, random);
    if (!upcoming.length) upcoming = refill(upcoming, state.pool, kanji, random);
    next.current = upcoming[0] || { kanji, revenge: !landed };
    next.upcoming = upcoming.slice(1);
    next.turn = state.turn + 1;
  }

  const evaluation = revenge && attack.evaluation === 'easy' ? 'good' : attack.evaluation;
  return { state: next, damage, parts, healed, hurt, revenge: Boolean(revenge && landed), evaluation };
}

/** 勝ったときの ★（1〜3）。ハートを 1 つも へらさなければ 3、2 つまでなら 2 */
export function starsFor(state) {
  if (state.status !== 'won') return 0;
  return state.misses === 0 ? 3 : state.misses <= 2 ? 2 : 1;
}

/** たたかいで もらえるコイン。負けたときは 半分（前と同じ） */
export function coinsFor(state) {
  if (state.status === 'won') return state.coins + starsFor(state) * BOSS_RULES.COINS.star;
  return Math.floor(state.coins / 2);
}

// ── きろく（stats.bossRecord。0 以上の数だけを持つ ひらたい表） ──
//   wins        … 勝った回数（ぜんぶのボス）
//   w_<ボス>    … そのボスに勝った回数
//   s_<ボス>    … そのボスの いちばん多い ★（1 以上なら、たおしたことがある）

const count = (value) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);

/** そのボスの いちばん多い ★（0〜3） */
export const bestStars = (record, bossId) => Math.min(3, count(record?.[`s_${bossId}`]));
/** そのボスに勝った回数 */
export const bossWins = (record, bossId) => count(record?.[`w_${bossId}`]);

/** たたかえるボスか（1 体めは いつでも。2 体めからは、前のボスを たおしてから） */
export function isBossUnlocked(record, bossId) {
  const index = BOSSES.findIndex((boss) => boss.id === bossId);
  if (index < 0) return false;
  return index === 0 || bestStars(record, BOSSES[index - 1].id) > 0;
}

/**
 * はじめに えらんでおくボス。まだ たおしていない いちばん前のボス。
 * ぜんぶ たおしたあとは、★ が いちばん少ないボス（同じなら 前のボス）。
 */
export function suggestedBossId(record) {
  const fresh = BOSSES.find((boss) => bestStars(record, boss.id) === 0);
  if (fresh) return fresh.id;
  return [...BOSSES].sort((a, b) => bestStars(record, a.id) - bestStars(record, b.id))[0].id;
}

/**
 * たたかいの結果を きろくに足した、新しい きろくを返す（負けたときは そのまま）。
 * @param {object|undefined} record いまの stats.bossRecord
 * @param {{ bossId: string, stars: number }} result
 */
export function recordBossResult(record, { bossId, stars }) {
  const base = {};
  for (const [key, value] of Object.entries(record && typeof record === 'object' ? record : {})) {
    if (/^(wins|[ws]_[a-z]+)$/.test(key) && count(value) > 0) base[key] = count(value);
  }
  if (!(stars > 0) || !BOSSES.some((boss) => boss.id === bossId)) return base;
  return {
    ...base,
    wins: count(base.wins) + 1,
    [`w_${bossId}`]: count(base[`w_${bossId}`]) + 1,
    [`s_${bossId}`]: Math.max(count(base[`s_${bossId}`]), Math.min(3, Math.floor(stars))),
  };
}
