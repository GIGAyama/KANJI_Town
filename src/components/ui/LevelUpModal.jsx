import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import ModalDialog from './ModalDialog';
import MotionButton from './MotionButton';
import { F } from './FormatKun';
import { TOWN_ITEM_MAP } from '../../data/town-items';
import { audioCtrl } from '../../systems/audio';

/** これより多いごほうびは、1つずつ並べずにまとめて出す（いっきに何十レベルも上がったとき） */
const LIST_LIMIT = 6;

/** 1つのごほうびを、画面に出すことばにする */
function rewardLabel({ level, reward }) {
  const name = reward.type === 'item' ? TOWN_ITEM_MAP.get(reward.id)?.name : null;
  // Lv100 から先の建物は、ごほうびの名前（「レアな たてもの」）に、もらった建物の名前を添える
  if (name && level > 100) return `${reward.text}「${name}」`;
  if (reward.text) return reward.text;
  if (reward.type === 'coins') return `コイン ${reward.amount}まい`;
  return name ? `「${name}」` : 'ごほうび';
}

/** ごほうびが多いときの、まとめた行（コインの合計と、建物・そのほかを数行） */
function summarize(rewards) {
  const coins = rewards.reduce((sum, { reward }) => sum + (reward.type === 'coins' ? reward.amount : 0), 0);
  const others = rewards.filter(({ reward }) => reward.type !== 'coins');
  const lines = others.slice(-LIST_LIMIT).map(rewardLabel);
  if (others.length > LIST_LIMIT) lines.unshift(`ほかに たてものなど ${others.length - LIST_LIMIT}こ`);
  if (coins > 0) lines.unshift(`コイン あわせて ${coins.toLocaleString()}まい`);
  return lines;
}

/**
 * レベルが上がったときのお祝い。学習の結果の画面と、Lv100 の上限を外した版を
 * はじめて開いたとき（capLifted: ためていた EXP の分だけ、いっきに上がる）に出す。
 * @param {{ levelUpData: { oldLevel: number, newLevel: number, rewards: Array }, onClose: () => void, capLifted?: boolean }} props
 */
export default function LevelUpModal({ levelUpData, onClose, capLifted = false }) {
  useEffect(() => {
    if (capLifted) audioCtrl.playSE('level_up', 0.5);
  }, [capLifted]);

  const rewards = (levelUpData.rewards || []).filter((entry) => entry?.reward);
  const lines = rewards.length > LIST_LIMIT ? summarize(rewards) : rewards.map(rewardLabel);

  return (
    <ModalDialog labelId="levelup-title" onEscape={onClose} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--panel)] w-full max-w-sm max-h-full overflow-y-auto rounded-3xl border-[4px] border-[var(--primary)] shadow-[0_8px_0_var(--primary)]" data-testid="levelup-modal">
        <div className="bg-[var(--primary)] text-[var(--panel)] text-center py-4 relative">
          <div id="levelup-title" className="text-3xl font-black tracking-widest">{F("昇","しょう")}{F("格","かく")}！</div>
          <div className="absolute top-0 right-0 left-0 bottom-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgZmlsbD0iI2ZmZiI+PHBhdGggZD0iTTExIDEwaDJ2NGgtem0wLThoMnY0aC0yem0wIDEyaDJ2NGgtMnpNNCAxMHYyaDQtMnYtem0tNCAwaDJ2Mkgwem0xNiAwaDZWMTBoLTZ6Ii8+PC9zdmc+')] bg-repeat" />
        </div>
        <div className="p-6 text-center">
          <div className="text-[var(--text)] font-bold mb-1">
            {capLifted
              ? <>レベル100の {F("先","さき")}が できたよ！<br />いままで がんばった ぶん、いっきに レベルアップ！</>
              : <>レベルが{F("上","あ")}がった！</>}
          </div>
          <div className="flex items-center justify-center gap-3 my-4">
            <div className="text-4xl font-black text-[var(--text-muted)]">Lv.{levelUpData.oldLevel}</div>
            <ChevronRight size={32} className="text-[var(--primary)]" />
            <div className="text-6xl font-black text-[var(--primary)] drop-shadow-md" data-testid="levelup-new">Lv.{levelUpData.newLevel}</div>
          </div>
          {lines.length > 0 && (
            <div className="bg-[var(--bg)] rounded-xl p-3 border-2 border-[var(--text)] text-left mb-6">
              <div className="text-sm font-black mb-2 text-center text-[var(--text-muted)] border-b-2 border-dashed border-[var(--text)] pb-2">ごほうび</div>
              <ul className="space-y-2">
                {lines.map((line, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.2) }} className="flex items-start gap-2 text-sm font-bold text-[var(--text)]">
                    <span className="shrink-0 text-[var(--primary)]">🎁</span> {line}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
          <MotionButton variant="primary" data-autofocus onClick={onClose} className="w-full py-4 text-xl border-[4px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
            やったー！ 🎉
          </MotionButton>
        </div>
      </div>
    </ModalDialog>
  );
}
