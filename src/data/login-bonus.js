// ログインボーナス定義 — マイ漢字タウン（Phase 7）
// 7日周期の連続ログイン報酬

export const LOGIN_BONUS_CYCLE = [
  { day: 1, type: 'coins', amount: 50, label: '50コイン', icon: '🪙' },
  { day: 2, type: 'material', material: 'wood', amount: 5, label: '木材×5', icon: '🪵' },
  { day: 3, type: 'coins', amount: 100, label: '100コイン', icon: '🪙' },
  { day: 4, type: 'material', material: 'stone', amount: 5, label: '石材×5', icon: '🪨' },
  { day: 5, type: 'material', material: 'iron', amount: 3, label: '鉄×3', icon: '⚙️' },
  { day: 6, type: 'coins', amount: 200, label: '200コイン', icon: '🪙' },
  { day: 7, type: 'special', amount: 500, material: 'crystal', materialAmount: 3, label: '500コイン＋水晶×3', icon: '🎁' },
];

export function getLoginBonusDay(streak) {
  return ((streak - 1) % 7) + 1;
}

export function getLoginBonusReward(day) {
  return LOGIN_BONUS_CYCLE.find(b => b.day === day) || LOGIN_BONUS_CYCLE[0];
}

export function applyLoginBonus(stats, reward) {
  const newStats = { ...stats };
  if (reward.type === 'coins') {
    newStats.coins = (newStats.coins || 0) + reward.amount;
  } else if (reward.type === 'material') {
    newStats.materials = { ...newStats.materials };
    newStats.materials[reward.material] = (newStats.materials[reward.material] || 0) + reward.amount;
  } else if (reward.type === 'special') {
    newStats.coins = (newStats.coins || 0) + reward.amount;
    newStats.materials = { ...newStats.materials };
    newStats.materials[reward.material] = (newStats.materials[reward.material] || 0) + reward.materialAmount;
  }
  return newStats;
}
