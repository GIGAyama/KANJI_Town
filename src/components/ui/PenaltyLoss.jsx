import { F } from './FormatKun';

/** 失う割合を、子どもに見せることばにする */
const amountWord = (rate) => (rate >= 1 ? 'ぜんぶ' : rate === 0.5 ? F("半分", "はんぶん") : `${Math.round(rate * 100)}%`);

/**
 * ペナルティの段（CARELESS.HEAVY_STEPS の1つ）を、これから失うものの行にする（確かめの画面に出す）。
 * @param {{ coins?: number, items?: number, materials?: number, levels?: number, land?: number }|null} step
 * @returns {Array<{ key: string, icon: string, text: import('react').ReactNode }>}
 */
export function penaltyStepLines(step) {
  if (!step) return [];
  const lines = [];
  if (step.coins) lines.push({ key: 'coins', icon: '🪙', text: <>コインが {amountWord(step.coins)} なくなる</> });
  // もちものには、町に置いた建物もふくむ（持っている数に、置いてある分が入っているため）
  if (step.items) lines.push({ key: 'items', icon: '🏠', text: <>もちもの・たてものが {amountWord(step.items)} なくなる</> });
  if (step.materials) lines.push({ key: 'materials', icon: '🧱', text: <>{F("素材","そざい")}が {amountWord(step.materials)} なくなる</> });
  if (step.levels) lines.push({ key: 'levels', icon: '⬇️', text: <>レベルが {step.levels} さがる</> });
  if (step.land) lines.push({ key: 'land', icon: '🥀', text: <>{F("町","まち")}の {F("土地","とち")}が {step.land}マス かれて、もう もどらない</> });
  return lines;
}

/** 次の段で、いまの段より重くなるものだけの行（「つぎに やると」と知らせる） */
export function penaltyAddedLines(step, nextStep) {
  if (!nextStep) return [];
  return penaltyStepLines(nextStep).filter(({ key }) => (nextStep[key] || 0) > (step?.[key] || 0));
}

/**
 * 実際に失ったもの（systems/careless-penalty.js の summarizePenalty / totalPenalty）を並べる。
 * 何も失っていなければ何も出さない。
 * @param {{ loss: { coins: number, items: number, materials: number, levels: number, land: number } }} props
 */
export default function PenaltyLoss({ loss, className = '' }) {
  const parts = [];
  if (loss?.coins) parts.push(<span key="coins">🪙 コイン {loss.coins.toLocaleString()}まい</span>);
  if (loss?.items) parts.push(<span key="items">🏠 もちもの {loss.items}こ</span>);
  if (loss?.materials) parts.push(<span key="materials">🧱 {F("素材","そざい")} {loss.materials}こ</span>);
  if (loss?.levels) parts.push(<span key="levels">⬇️ レベル {loss.levels}</span>);
  if (loss?.land) parts.push(<span key="land">🥀 {F("土地","とち")} {loss.land}マス</span>);
  if (parts.length === 0) return null;
  return <span className={`inline-flex flex-wrap gap-x-3 gap-y-0.5 font-black ${className}`} data-testid="penalty-loss">{parts}</span>;
}
