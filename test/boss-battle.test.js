import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  BOSS_RULES, BOSSES, bestStars, bossById, bossPhase, bossWins, coinsFor, comboBonus, createBattle, isBossUnlocked,
  judgeAttack, recordBossResult, resolveTurn, starsFor, suggestedBossId, timeLimitFor,
} from '../src/systems/boss-battle.js';
import { fillQueue } from '../src/systems/question-queue.js';
import { sanitizeStats } from '../src/systems/stats-schema.js';
import { BOSS_ART_BOX, BOSS_ART_IDS, BOSS_MOODS, bossArt, bossStage } from '../src/data/boss-art.js';
import { BOSS_PROFILES, bossProfile } from '../src/data/boss-profiles.js';
import { TRAINING_VIEWPORT_PRESETS } from '../src/utils/learning-viewport.js';

// ボスバトルは、にがてな字の「書きとりテスト」を たたかいにしたもの。
// 前の決まり（ハート 3・ミスで 2 へる・点数だけの判定）では、10 問のうち 7 問 書ける子でも ほとんど勝てなかった。
// ここでは、新しい決まり（systems/boss-battle.js）の計算と、勝ちやすさの つりあいを確かめる。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const kanji = (n) => Array.from({ length: n }, (_, i) => ({ id: `k${i}`, char: String.fromCharCode(0x4e00 + i) }));
const rng = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; }; };

const CRITICAL = { kind: 'critical', evaluation: 'easy', reason: 'ok' };
const HIT = { kind: 'hit', evaluation: 'good', reason: 'ok' };
const GRAZE = { kind: 'graze', evaluation: 'hard', reason: 'rough' };
const BLOCKED = { kind: 'blocked', evaluation: 'hard', reason: 'order' };
const MISS = { kind: 'miss', evaluation: 'again', reason: 'count' };
/** 決めた順に こうげきして、たたかいを進める */
function play(state, attacks, random = rng(1)) {
  const turns = [];
  for (const attack of attacks) {
    const turn = resolveTurn(state, attack, random);
    turns.push(turn);
    state = turn.state;
  }
  return { state, turns };
}

// ── 書いた字の判定 → たたかいの できごと ──

test('判定: 毎日のテストと同じ判定（judgeWriting）から決める。よく書けた字ほど 大きな こうげき', () => {
  assert.deepEqual(judgeAttack({ verdict: 'pass', evaluation: 'easy', reason: 'ok', lenient: false }), CRITICAL);
  assert.deepEqual(judgeAttack({ verdict: 'pass', evaluation: 'good', reason: 'ok', lenient: false }), HIT);
  assert.deepEqual(judgeAttack({ verdict: 'pass', evaluation: 'hard', reason: 'ok', lenient: false }), GRAZE);
});

test('判定: 書き順・線の交わりが ちがう字は、形が合っていても こうげきが通らない（ハートは へらない）', () => {
  for (const reason of ['order', 'cross']) {
    assert.deepEqual(judgeAttack({ verdict: 'pass', evaluation: 'hard', reason, lenient: false }), { kind: 'blocked', evaluation: 'hard', reason });
    // リベンジ（2 回目）で 読み取れる字として通った場合も、まちがった書き方に ごほうびは出さない
    assert.equal(judgeAttack({ verdict: 'pass', evaluation: 'hard', reason, lenient: true, attempt: { recognized: true } }).kind, 'blocked');
  }
});

test('判定: 読み取れる字（1 画の差・小さい字）は ハートを へらさない。書けなかった字だけが ミス', () => {
  // 1 回目: 理由を伝えて リベンジに回す
  assert.deepEqual(judgeAttack({ verdict: 'retry', evaluation: 'again', reason: 'count', attempt: { recognized: true } }), { kind: 'blocked', evaluation: 'again', reason: 'count' });
  assert.equal(judgeAttack({ verdict: 'retry', evaluation: 'again', reason: 'small', attempt: { recognized: true } }).kind, 'blocked');
  // リベンジ（2 回目）: かすり として通す
  assert.deepEqual(judgeAttack({ verdict: 'pass', evaluation: 'hard', reason: 'count', lenient: true, attempt: { recognized: true } }), { kind: 'graze', evaluation: 'hard', reason: 'count' });
  // 読み取れない字・ほとんど書いていない字・何も書かずに 時間切れ
  assert.deepEqual(judgeAttack({ verdict: 'retry', evaluation: 'again', reason: 'count', attempt: { recognized: false } }), MISS);
  assert.deepEqual(judgeAttack({ verdict: 'careless', evaluation: 'again', reason: 'few-strokes', attempt: { recognized: false } }), { kind: 'miss', evaluation: 'again', reason: 'careless' });
  assert.deepEqual(judgeAttack(null), { kind: 'miss', evaluation: 'again', reason: 'timeout' });
});

// ── ダメージ・コンボ・ハート ──

test('ダメージ: 会心 15・ヒット 10・かすり 5。つづけて当てると コンボで +2 ずつ（+6 まで）', () => {
  assert.deepEqual(BOSS_RULES.DAMAGE, { critical: 15, hit: 10, graze: 5 });
  assert.deepEqual([1, 2, 3, 4, 5, 9].map(comboBonus), [0, 2, 4, 6, 6, 6]);
  const { state, turns } = play(createBattle(kanji(10), { bossId: 'dragon' }), [CRITICAL, HIT, GRAZE, CRITICAL, HIT]);
  assert.deepEqual(turns.map((t) => t.damage), [15, 12, 9, 21, 16]);
  assert.deepEqual(turns.map((t) => t.parts.combo), [0, 2, 4, 6, 6]);
  assert.equal(state.bossHp, 130 - 73);
  assert.equal(state.combo, 5);
  assert.equal(state.maxCombo, 5);
  assert.deepEqual([state.criticals, state.hits, state.grazes], [2, 2, 1]);
  assert.equal(state.playerHp, BOSS_RULES.PLAYER_MAX_HP);
});

test('ハート: へるのは 書けなかったときだけ（1 回に 1 つ）。ふせがれたときは コンボが 切れるだけ', () => {
  const start = createBattle(kanji(10));
  const { state, turns } = play(start, [HIT, HIT, BLOCKED, HIT, MISS]);
  assert.deepEqual(turns.map((t) => t.state.playerHp), [4, 4, 4, 4, 3]);
  assert.deepEqual(turns.map((t) => t.state.combo), [1, 2, 0, 1, 0]);
  assert.deepEqual(turns.map((t) => t.hurt), [false, false, false, false, true]);
  assert.deepEqual(turns.map((t) => t.damage), [10, 12, 0, 10, 0]);
  assert.equal(state.misses, 1);
  assert.equal(state.blocked, 1);
  // もとの state は変えない
  assert.equal(start.bossHp, 100);
  assert.equal(start.turn, 1);
});

test('勝ち負け: ボスの体力が 0 で勝ち、ハートが 0 で負け。決まったあとは 進まない', () => {
  const won = play(createBattle(kanji(10)), Array(6).fill(CRITICAL)).state;
  assert.equal(won.status, 'won');
  assert.equal(won.bossHp, 0);
  assert.equal(won.turn, 6, '勝った問題で止まる');
  const lost = play(createBattle(kanji(10)), Array(BOSS_RULES.PLAYER_MAX_HP).fill(MISS)).state;
  assert.equal(lost.status, 'lost');
  assert.equal(lost.playerHp, 0);
  const after = resolveTurn(lost, CRITICAL);
  assert.equal(after.state, lost);
  assert.equal(after.damage, 0);
  // 出す字が無ければ はじまらない
  assert.equal(createBattle([]).status, 'lost');
  assert.equal(createBattle(undefined).current, null);
});

// ── リベンジ ──

test('リベンジ: 書けなかった字は、ほかの字を 2 問 はさんで もう一度出る。書ければ +5 と ハート 1 つ', () => {
  const k = kanji(10);
  let { state, turns } = play(createBattle(k), [MISS]);
  assert.equal(state.playerHp, 3);
  assert.deepEqual(state.failed, [k[0]]);
  assert.deepEqual([state.current, ...state.upcoming.slice(0, 3)].map((e) => [e.kanji.id, e.revenge]), [['k1', false], ['k2', false], ['k0', true], ['k3', false]]);
  ({ state, turns } = play(state, [HIT, HIT, HIT]));
  const revenge = turns[2];
  assert.equal(revenge.revenge, true);
  assert.equal(revenge.healed, true);
  assert.deepEqual(revenge.parts, { base: 10, combo: 4, revenge: 5 });
  assert.equal(state.playerHp, 4);
  assert.equal(state.revenges, 1);
  // 書けた字は もう リベンジに ならない
  assert.equal(state.current.revenge, false);
  assert.equal(state.current.kanji.id, 'k3');
});

test('リベンジ: ハートが いっぱいのときは ふえない。こたえを見た すぐあとなので、評価は good まで', () => {
  // ふせがれた字（ハートは へっていない）の リベンジ
  const { state, turns } = play(createBattle(kanji(10)), [BLOCKED, HIT, HIT, CRITICAL]);
  const revenge = turns[3];
  assert.equal(revenge.revenge, true);
  assert.equal(revenge.healed, false);
  assert.equal(state.playerHp, BOSS_RULES.PLAYER_MAX_HP);
  assert.equal(revenge.evaluation, 'good', '会心でも easy にしない');
  assert.equal(turns[2].evaluation, 'good');
  assert.equal(turns[0].evaluation, 'hard');
  // リベンジで また書けなければ、もう一度 2 問あとに出る
  const again = play(createBattle(kanji(10)), [MISS, HIT, HIT, MISS]);
  assert.equal(again.state.playerHp, 2);
  assert.deepEqual(again.state.failed.map((x) => x.id), ['k0'], '同じ字を 2 回 入れない');
  assert.equal(again.state.upcoming[1].kanji.id, 'k0');
  assert.equal(again.state.upcoming[1].revenge, true);
});

test('出す字: たたかいが長びいても 問題が なくならず、同じ字が つづかない（字が 3 つ以上あるとき）', () => {
  for (const count of [3, 5, 10]) {
    const random = rng(count);
    const pool = kanji(count);
    let state = createBattle(fillQueue(pool, 10, random));
    let prev = state.current.kanji;
    const pattern = [BLOCKED, GRAZE, BLOCKED, BLOCKED, GRAZE];
    for (let i = 0; i < 60 && state.status === 'fighting'; i++) {
      state = resolveTurn(state, pattern[i % pattern.length], random).state;
      if (state.status !== 'fighting') break;
      assert.ok(state.current && state.current.kanji, `${count} 字: 問題が なくなった`);
      assert.notEqual(state.current.kanji, prev, `${count} 字: ${i + 2} 問めが 前と同じ字`);
      prev = state.current.kanji;
    }
  }
  // 字が 1 つだけのときは 同じ字が つづく（止まらない）
  let one = createBattle(fillQueue(kanji(1), 10));
  for (let i = 0; i < 3; i++) one = resolveTurn(one, MISS).state;
  assert.equal(one.status, 'fighting');
  assert.equal(one.current.kanji.id, 'k0');
  assert.equal(one.current.revenge, true);
});

// ── ★・コイン・時間・ボスの ようす ──

test('★: ハートを 1 つも へらさなければ 3、2 つまでなら 2、勝てば 1。負けは 0', () => {
  const win = (misses) => play(createBattle(kanji(10), { bossId: 'ghost' }), [...Array(misses).fill(MISS), ...Array(8).fill(CRITICAL)]).state;
  assert.deepEqual([0, 1, 2, 3].map((n) => starsFor(win(n))), [3, 2, 2, 1]);
  assert.equal(starsFor(play(createBattle(kanji(10)), Array(4).fill(MISS)).state), 0);
  // ふせがれただけでは ★ は へらない
  assert.equal(starsFor(play(createBattle(kanji(10)), [BLOCKED, ...Array(7).fill(CRITICAL)]).state), 3);
});

test('コイン: 当てるたびに もらえ、勝つと ★ の分が ふえる。負けたときは 半分', () => {
  const won = play(createBattle(kanji(10)), [HIT, GRAZE, ...Array(6).fill(CRITICAL)]).state;
  assert.equal(won.status, 'won');
  const landed = won.criticals * 8 + won.hits * 5 + won.grazes * 3;
  assert.equal(won.coins, landed);
  assert.equal(coinsFor(won), landed + 3 * 10);
  const lost = play(createBattle(kanji(10)), [HIT, CRITICAL, MISS, MISS, MISS, MISS]).state;
  assert.equal(lost.status, 'lost');
  assert.equal(coinsFor(lost), Math.floor((5 + 8) / 2));
});

test('制限時間: 画数が多いほど長く、20〜60 秒。前（画数 × 3、15〜45 秒）より 短くならない', () => {
  assert.deepEqual([1, 3, 5, 10, 15, 20, 29].map(timeLimitFor), [20, 20, 25, 40, 55, 60, 60]);
  for (let strokes = 1; strokes <= 29; strokes++) {
    assert.ok(timeLimitFor(strokes) >= Math.min(45, Math.max(15, strokes * 3)), `${strokes} 画`);
  }
  assert.equal(timeLimitFor(0), 30);
  assert.equal(timeLimitFor(NaN), 30);
});

test('ボスの ようす: 体力が半分より少ないと いかり、2 割より少ないと ピンチ', () => {
  assert.deepEqual([100, 51, 50, 21, 20, 1, 0].map((hp) => bossPhase(hp, 100)), [0, 0, 1, 1, 2, 2, 2]);
});

test('ボス: 4 体。あとのボスほど 体力が多い。名前・せりふ・絵が そろっている', () => {
  assert.deepEqual(BOSSES.map((b) => b.id), ['ghost', 'octopus', 'oni', 'dragon']);
  assert.deepEqual(BOSSES.map((b) => b.id), [...BOSS_ART_IDS]);
  for (let i = 1; i < BOSSES.length; i++) assert.ok(BOSSES[i].hp > BOSSES[i - 1].hp);
  assert.equal(bossById('nobody'), BOSSES[0]);
  assert.equal(createBattle(kanji(3), { bossId: 'oni' }).bossMaxHp, 120);
  const names = new Set();
  for (const { id } of BOSSES) {
    const profile = bossProfile(id);
    assert.equal(profile, BOSS_PROFILES[id]);
    names.add(profile.name);
    for (const key of ['name', 'place', 'intro', 'attack', 'guard', 'rage', 'lose', 'cheer']) {
      assert.ok(typeof profile[key] === 'string' && profile[key].length >= 3, `${id}.${key}`);
      // 1 年生が 1 人で読めるように、漢字を使わない（ふりがなを付ける所が無い）
      assert.ok(!/[㐀-鿿]/.test(profile[key]), `${id}.${key} に漢字がある: ${profile[key]}`);
    }
    assert.match(profile.color, /^#[0-9a-f]{6}$/);
  }
  assert.equal(names.size, BOSSES.length);
  assert.equal(bossProfile('nobody'), BOSS_PROFILES.ghost);
});

// ── きろく ──

test('きろく: 勝つと 回数と いちばん多い ★ が残る。負けは そのまま', () => {
  let record = recordBossResult(undefined, { bossId: 'ghost', stars: 2 });
  assert.deepEqual(record, { wins: 1, w_ghost: 1, s_ghost: 2 });
  record = recordBossResult(record, { bossId: 'ghost', stars: 1 });
  assert.deepEqual(record, { wins: 2, w_ghost: 2, s_ghost: 2 }, '★ は へらない');
  record = recordBossResult(record, { bossId: 'octopus', stars: 3 });
  assert.deepEqual(record, { wins: 3, w_ghost: 2, s_ghost: 2, w_octopus: 1, s_octopus: 3 });
  assert.deepEqual(recordBossResult(record, { bossId: 'oni', stars: 0 }), record);
  assert.deepEqual(recordBossResult(record, { bossId: 'nobody', stars: 3 }), record);
  assert.equal(bestStars(record, 'ghost'), 2);
  assert.equal(bossWins(record, 'ghost'), 2);
  assert.equal(bestStars(record, 'dragon'), 0);
  // こわれた きろく・よけいな欄は 捨てる
  assert.deepEqual(recordBossResult({ wins: '3', s_ghost: 9, w_ghost: -1, __proto__x: 1, other: 5 }, { bossId: 'ghost', stars: 1 }), { wins: 1, w_ghost: 1, s_ghost: 9 });
  assert.equal(bestStars({ s_ghost: 9 }, 'ghost'), 3);
  assert.equal(bestStars(null, 'ghost'), 0);
});

test('きろく: 次のボスは、前のボスを たおすと たたかえる。はじめに えらんでおくのは まだ たおしていないボス', () => {
  assert.deepEqual(BOSSES.map((b) => isBossUnlocked(undefined, b.id)), [true, false, false, false]);
  assert.equal(suggestedBossId(undefined), 'ghost');
  const one = { wins: 1, w_ghost: 1, s_ghost: 1 };
  assert.deepEqual(BOSSES.map((b) => isBossUnlocked(one, b.id)), [true, true, false, false]);
  assert.equal(suggestedBossId(one), 'octopus');
  assert.equal(isBossUnlocked(one, 'nobody'), false);
  // ぜんぶ たおしたら、★ が いちばん少ないボス
  const all = { s_ghost: 3, s_octopus: 2, s_oni: 3, s_dragon: 2 };
  assert.equal(suggestedBossId(all), 'octopus');
  assert.equal(suggestedBossId({ s_ghost: 3, s_octopus: 3, s_oni: 3, s_dragon: 3 }), 'ghost');
});

test('きろく: 保存データの形を確かめるときに、数だけを残す', () => {
  // 読みこんだファイルの中の "__proto__" という名前の欄（JSON.parse では ふつうの欄になる）
  const kept = sanitizeStats(JSON.parse('{"totalExp":1,"bossRecord":{"wins":2,"s_ghost":"3","w_ghost":"x","__proto__":{"a":1}}}'));
  assert.deepEqual(kept.stats.bossRecord, { wins: 2, s_ghost: 3 });
  const dropped = sanitizeStats({ totalExp: 1, bossRecord: 'broken' });
  assert.equal('bossRecord' in dropped.stats, false);
  assert.ok(dropped.repaired.includes('bossRecord'));
});

// ── 勝ちやすさの つりあい ──

/**
 * 子どもの もけい: 字ごとに「書ける」か決まっている（割合 p）。書けない字は ミス。
 * こたえを見たあとは 75% の確率で書ける（書けたら その後は書ける）。
 * 書ける字の出かた: 会心 35%・ヒット 45%・かすり 10%・おしい 10%。
 */
function simulate(p, bossId, seed) {
  const random = rng(seed);
  const pool = kanji(10).map((k) => ({ ...k, known: random() < p, seen: false }));
  let state = createBattle(fillQueue(pool, 10, random), { bossId });
  for (let i = 0; i < 200 && state.status === 'fighting'; i++) {
    const k = state.current.kanji;
    let can = k.known;
    if (!can && k.seen) { can = random() < 0.75; if (can) k.known = true; }
    let attack = MISS;
    if (can) { const x = random(); attack = x < 0.35 ? CRITICAL : x < 0.8 ? HIT : x < 0.9 ? GRAZE : BLOCKED; } else k.seen = true;
    state = resolveTurn(state, attack, random).state;
  }
  return state;
}
function rates(p, bossId, runs = 1500) {
  let wins = 0; let turns = 0; let three = 0;
  for (let i = 0; i < runs; i++) {
    const state = simulate(p, bossId, i * 7919 + Math.round(p * 100));
    turns += state.turn;
    if (state.status === 'won') { wins++; if (starsFor(state) === 3) three++; }
  }
  return { win: wins / runs, turns: turns / runs, three: three / runs };
}

test('つりあい: 7 わり 書ける子は たいてい勝て、3 わりの子も 直しながら 勝てることがある', () => {
  for (const { id } of BOSSES) {
    const weak = rates(0.3, id);
    const half = rates(0.5, id);
    const most = rates(0.7, id);
    const all = rates(1, id);
    assert.ok(weak.win > 0.25 && weak.win < 0.6, `${id} 3 わり: 勝率 ${weak.win.toFixed(2)}`);
    assert.ok(half.win > 0.5 && half.win < 0.8, `${id} 5 わり: 勝率 ${half.win.toFixed(2)}`);
    assert.ok(most.win > 0.75 && most.win < 0.95, `${id} 7 わり: 勝率 ${most.win.toFixed(2)}`);
    assert.equal(all.win, 1, `${id}: ぜんぶ書ける子が負けた`);
    assert.equal(all.three, 1);
    // ★ 3 つは、にがてな字が のこっているうちは むずかしい
    assert.ok(most.three < 0.2, `${id} 7 わり: ★3 ${most.three.toFixed(2)}`);
    // 長さ: 6〜16 問（1 問 20〜30 秒として 3〜8 分）
    for (const [label, r] of [['3 わり', weak], ['5 わり', half], ['7 わり', most], ['ぜんぶ', all]]) {
      assert.ok(r.turns >= 6 && r.turns <= 16, `${id} ${label}: 平均 ${r.turns.toFixed(1)} 問`);
    }
  }
});

test('つりあい: 前の決まり（ハート 3・ミスで 2 へる・10 回 当てる）は、7 わり 書ける子でも 15% も勝てなかった', () => {
  // 前の決まりを そのまま計算する（点数だけの判定で ていねいな字が落ちる分は、ここでは入れていない）
  const random = rng(42);
  let wins = 0;
  for (let i = 0; i < 4000; i++) {
    let hp = 3; let boss = 10;
    while (hp > 0 && boss > 0) { if (random() < 0.7) boss--; else hp -= 2; }
    if (boss <= 0) wins++;
  }
  assert.ok(wins / 4000 < 0.15, `前の決まりの勝率 ${(wins / 4000).toFixed(3)}`);
  assert.ok(rates(0.7, 'ghost').win > 0.75);
});

// ── 絵 ──

test('絵: どのボスも 6 つの表情があり、表情ごとに ちがう絵になる', () => {
  assert.deepEqual([...BOSS_MOODS], ['idle', 'smug', 'hurt', 'angry', 'attack', 'down']);
  for (const id of BOSS_ART_IDS) {
    const seen = new Set();
    for (const mood of BOSS_MOODS) {
      const art = bossArt(id, mood);
      assert.ok(art.length > 2000, `${id}/${mood}: 絵が短い`);
      assert.ok(!/NaN|undefined|null/.test(art), `${id}/${mood}: こわれた数字`);
      seen.add(art);
    }
    assert.equal(seen.size, BOSS_MOODS.length, `${id}: 同じ絵の表情がある`);
    assert.equal(bossArt(id, 'nothing'), bossArt(id, 'idle'));
    const stage = bossStage(id);
    assert.ok(stage.startsWith('<rect') && stage.length > 500, `${id}: 舞台`);
  }
  assert.equal(bossArt('nobody'), bossArt('ghost'));
  assert.equal(bossStage('nobody'), bossStage('ghost'));
  assert.ok(BOSS_ART_BOX.width > 200 && BOSS_ART_BOX.x * -2 === BOSS_ART_BOX.width, '枠は 左右対称');
});

test('絵: フィルター・図形の opacity・外の資源を使わない（動かすたびの 描きなおしを軽くする）', () => {
  const all = BOSS_ART_IDS.flatMap((id) => [bossStage(id), ...BOSS_MOODS.map((mood) => bossArt(id, mood))]).join('');
  assert.ok(!/filter|<script|<image|<use|href|url\(/.test(all));
  assert.ok(!/\sopacity=/.test(all), '図形の opacity（うすい色は fill-opacity で書く）');
  // 前の おばけ（紫の かたまりに 目が 2 つ。filter で光らせていた）は消した
  assert.equal(existsSync(new URL('../src/data/iso-svg/special.jsx', import.meta.url)), false);
  for (const file of ['../src/data/town-items.jsx', '../src/data/iso-svg.js', '../src/data/iso-svg/shared.jsx']) {
    assert.ok(!/SvgGhostBoss|glow-effect|special\.jsx/.test(read(file)), `${file}: 前の おばけが残っている`);
  }
});

// ── 画面 ──

test('画面: 判定は 毎日のテストと同じ（judgeWriting）。点数だけで決めない', () => {
  const view = read('../src/components/training/BossBattleView.jsx');
  const code = view.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(code, /judgeWriting\(strokes, strokeData, canvasSize, \{ previousFails: entry\.revenge \? 1 : 0 \}\)/);
  assert.ok(!/gradeStrokes|result\.total\s*>=|isOrderMistake/.test(code), '点数の しきい値で 合否を決めている');
  // 時間切れは、書いた所までを採点する
  assert.match(code, /submitRef\.current\(canvasRef\.current\?\.takeStrokes\(\) \|\| \[\], true\)/);
  // 勝ったときだけ きろくを わたす
  assert.match(code, /onFinish\(\{ coins, perfectCount: state\.criticals, rareDrop: 't_gold_castle', bossRecord: record \}\)/);
  assert.match(code, /onBossDefeat\(\{ coins, perfectCount: state\.criticals, failedKanji: state\.failed \}\)/);
  const app = read('../src/App.jsx');
  assert.match(app, /bossRecord=\{stats\.bossRecord\}/);
  assert.match(app, /if \(additionalResults\.bossRecord\) newStats\.bossRecord = additionalResults\.bossRecord;/);
});

test('画面: 子どもに見せる文に、ふりがなの無い漢字が無い', () => {
  for (const file of ['BossBattleView.jsx', 'boss/BossIntro.jsx', 'boss/BossResult.jsx', 'boss/BossStage.jsx', 'boss/BossCanvas.jsx']) {
    const code = read(`../src/components/training/${file}`)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      // ふりがなを付ける書き方 F('字', 'じ')
      .replace(/F\('[^']+',\s*'[^']+'\)/g, '');
    const kanjiLeft = [...code.matchAll(/[^\n]*[㐀-鿿][^\n]*/g)].map((m) => m[0].trim());
    assert.deepEqual(kanjiLeft, [], `${file}: ふりがなの無い漢字`);
  }
});

test('画面: ますの大きさの計算は、舞台の高さ・左の列のはばと 同じ数を使う', () => {
  const view = read('../src/components/training/BossBattleView.jsx');
  const { stackedFlex, sideW } = TRAINING_VIEWPORT_PRESETS.boss;
  assert.ok(view.includes(`min-h-[clamp(${stackedFlex.min}px,${Math.round(stackedFlex.ratio * 100)}dvh,${stackedFlex.max}px)] max-h-[${stackedFlex.max}px]`), '縦積みの舞台の高さが preset と ちがう');
  assert.ok(view.includes(`vw,${sideW}px)]`), '横並びの左の列のはばが preset と ちがう');
});
