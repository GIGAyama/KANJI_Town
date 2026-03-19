// デイリーミッション定義 — マイ漢字タウン（Phase 7）
// 毎日3つのランダム課題で追加報酬

// ミッションテンプレート（毎日ランダムに3つ選ばれる）
export const MISSION_TEMPLATES = [
  { id: 'review_5', name: '復習5字', desc: '漢字を5文字復習する', type: 'review', target: 5, reward: 60, rewardExp: 100 },
  { id: 'review_10', name: '復習10字', desc: '漢字を10文字復習する', type: 'review', target: 10, reward: 120, rewardExp: 250 },
  { id: 'perfect_3', name: 'Perfect3回', desc: 'Perfectを3回だす', type: 'perfect', target: 3, reward: 80, rewardExp: 150 },
  { id: 'perfect_5', name: 'Perfect5回', desc: 'Perfectを5回だす', type: 'perfect', target: 5, reward: 150, rewardExp: 300 },
  { id: 'craft_1', name: 'クラフト1回', desc: 'アイテムを1回クラフトする', type: 'craft', target: 1, reward: 50, rewardExp: 100 },
  { id: 'craft_3', name: 'クラフト3回', desc: 'アイテムを3回クラフトする', type: 'craft', target: 3, reward: 120, rewardExp: 300 },
  { id: 'session_1', name: 'セッション1回', desc: '学習セッションを1回完了する', type: 'session', target: 1, reward: 50, rewardExp: 100 },
  { id: 'session_2', name: 'セッション2回', desc: '学習セッションを2回完了する', type: 'session', target: 2, reward: 120, rewardExp: 250 },
  { id: 'place_1', name: '建物を配置', desc: '建物を1つ配置する', type: 'place', target: 1, reward: 50, rewardExp: 50 },
  { id: 'earn_exp_100', name: 'EXP100獲得', desc: 'EXPを100以上かせぐ', type: 'exp', target: 100, reward: 80, rewardExp: 100 },
  { id: 'earn_exp_200', name: 'EXP200獲得', desc: 'EXPを200以上かせぐ', type: 'exp', target: 200, reward: 180, rewardExp: 200 },
  { id: 'new_kanji_3', name: '新漢字3字', desc: '新しい漢字を3つ学ぶ', type: 'new_kanji', target: 3, reward: 120, rewardExp: 300 },
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
