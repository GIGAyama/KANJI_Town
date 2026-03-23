// デイリーミッション定義 — マイ漢字タウン（Phase 7+: 13 → 20テンプレートに拡張）
// 毎日3つのランダム課題で追加報酬
// name / desc は RubyText 用「漢字（ふりがな）」形式

// ミッションテンプレート（毎日ランダムに3つ選ばれる）
export const MISSION_TEMPLATES = [
  // 復習系
  { id: 'review_5',      name: '復習（ふくしゅう）5字（じ）',         desc: '漢字（かんじ）を5文字（もじ）復習（ふくしゅう）する',                     type: 'review',    target: 5,   reward: 60,  rewardExp: 100 },
  { id: 'review_10',     name: '復習（ふくしゅう）10字（じ）',        desc: '漢字（かんじ）を10文字（もじ）復習（ふくしゅう）する',                    type: 'review',    target: 10,  reward: 120, rewardExp: 250 },
  { id: 'review_20',     name: '復習（ふくしゅう）20字（じ）',        desc: '漢字（かんじ）を20文字（もじ）復習（ふくしゅう）する',                    type: 'review',    target: 20,  reward: 200, rewardExp: 400 },

  // Perfect系
  { id: 'perfect_3',     name: 'Perfect3回（かい）',                   desc: 'Perfectを3回（かい）出（だ）す',                                           type: 'perfect',   target: 3,   reward: 80,  rewardExp: 150 },
  { id: 'perfect_5',     name: 'Perfect5回（かい）',                   desc: 'Perfectを5回（かい）出（だ）す',                                           type: 'perfect',   target: 5,   reward: 150, rewardExp: 300 },
  { id: 'perfect_10',    name: 'Perfect10回（かい）',                  desc: 'Perfectを10回（かい）出（だ）す',                                          type: 'perfect',   target: 10,  reward: 250, rewardExp: 500 },

  // クラフト系
  { id: 'craft_1',       name: 'クラフト1回（かい）',                  desc: 'アイテムを1回（かい）クラフトする',                                        type: 'craft',     target: 1,   reward: 50,  rewardExp: 100 },
  { id: 'craft_3',       name: 'クラフト3回（かい）',                  desc: 'アイテムを3回（かい）クラフトする',                                        type: 'craft',     target: 3,   reward: 120, rewardExp: 300 },

  // セッション系
  { id: 'session_1',     name: 'セッション1回（かい）',                desc: '学習（がくしゅう）セッションを1回（かい）完了（かんりょう）する',           type: 'session',   target: 1,   reward: 50,  rewardExp: 100 },
  { id: 'session_2',     name: 'セッション2回（かい）',                desc: '学習（がくしゅう）セッションを2回（かい）完了（かんりょう）する',           type: 'session',   target: 2,   reward: 120, rewardExp: 250 },
  { id: 'session_3',     name: 'セッション3回（かい）',                desc: '学習（がくしゅう）セッションを3回（かい）完了（かんりょう）する',           type: 'session',   target: 3,   reward: 200, rewardExp: 400 },

  // 配置系
  { id: 'place_1',       name: '建物（たてもの）を配置（はいち）',     desc: '建物（たてもの）を1つ配置（はいち）する',                                  type: 'place',     target: 1,   reward: 50,  rewardExp: 50  },
  { id: 'place_3',       name: '建物（たてもの）3つ配置（はいち）',    desc: '建物（たてもの）を3つ配置（はいち）する',                                  type: 'place',     target: 3,   reward: 120, rewardExp: 150 },

  // EXP獲得系
  { id: 'earn_exp_100',  name: 'EXP100獲得（かくとく）',               desc: 'EXPを100以上（いじょう）かせぐ',                                           type: 'exp',       target: 100, reward: 80,  rewardExp: 100 },
  { id: 'earn_exp_200',  name: 'EXP200獲得（かくとく）',               desc: 'EXPを200以上（いじょう）かせぐ',                                           type: 'exp',       target: 200, reward: 180, rewardExp: 200 },
  { id: 'earn_exp_500',  name: 'EXP500獲得（かくとく）',               desc: 'EXPを500以上（いじょう）かせぐ',                                           type: 'exp',       target: 500, reward: 300, rewardExp: 400 },

  // 新漢字系
  { id: 'new_kanji_3',   name: '新（あたら）しい漢字（かんじ）3字（じ）', desc: '新（あたら）しい漢字（かんじ）を3つ学（まな）ぶ',                       type: 'new_kanji', target: 3,   reward: 120, rewardExp: 300 },
  { id: 'new_kanji_5',   name: '新（あたら）しい漢字（かんじ）5字（じ）', desc: '新（あたら）しい漢字（かんじ）を5つ学（まな）ぶ',                       type: 'new_kanji', target: 5,   reward: 200, rewardExp: 500 },

  // マスター系（新規）
  { id: 'master_1',      name: '漢字（かんじ）を1字（じ）マスター',    desc: '漢字（かんじ）を1文字（もじ）マスターする',                                type: 'master',    target: 1,   reward: 150, rewardExp: 300 },
  { id: 'master_2',      name: '漢字（かんじ）を2字（じ）マスター',    desc: '漢字（かんじ）を2文字（もじ）マスターする',                                type: 'master',    target: 2,   reward: 250, rewardExp: 500 },
];

// 日付文字列からシード生成（同じ日に同じミッションが出る）
function dateSeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 日付ごとに3つのミッションを決定的に選ぶ
export function getDailyMissions(dateStr) {
  const seed = dateSeed(dateStr);
  const indices = [];
  const pool = [...MISSION_TEMPLATES];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = (seed * (i + 7) + i * 31) % pool.length;
    indices.push(pool.splice(idx, 1)[0]);
  }
  return indices;
}

// ミッション進捗の更新
export function updateMissionProgress(missions, type, amount) {
  return missions.map(m => {
    if (m.type !== type || m.claimed) return m;
    return { ...m, current: Math.min((m.current || 0) + amount, m.target) };
  });
}
