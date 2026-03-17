// ログインボーナスポップアップ — マイ漢字タウン（Phase 7）
import React from 'react';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { F } from '../ui/FormatKun';
import { LOGIN_BONUS_CYCLE } from '../../data/login-bonus';

const LoginBonusPopup = ({ streak, bonusDay, reward, onClaim }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.5, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] shadow-[6px_6px_0_var(--text)] p-6 max-w-sm w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-5xl mb-2"
          >
            🎁
          </motion.div>
          <h2 className="text-lg font-black text-[var(--text)] mb-1">ログインボーナス！</h2>
          <p className="text-xs text-[var(--text)] opacity-50 mb-4">{streak}{F("日","にち")}{F("連続","れんぞく")}ログイン</p>

          {/* 7日間サイクル表示 */}
          <div className="flex justify-center gap-1.5 mb-4">
            {LOGIN_BONUS_CYCLE.map((b, i) => {
              const isToday = b.day === bonusDay;
              const isPast = b.day < bonusDay;
              return (
                <motion.div
                  key={b.day}
                  initial={isToday ? { scale: 0 } : {}}
                  animate={isToday ? { scale: 1 } : {}}
                  transition={{ type: 'spring', delay: 0.3 + i * 0.05 }}
                  className={`w-10 h-12 rounded-xl border-[2px] flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-all ${
                    isToday
                      ? 'border-amber-400 bg-amber-50 shadow-[0_2px_0_#b45309] scale-110'
                      : isPast
                      ? 'border-emerald-300 bg-emerald-50 opacity-60'
                      : 'border-gray-200 bg-gray-50 opacity-40'
                  }`}
                >
                  <span>{b.icon}</span>
                  <span className="text-[8px]">{b.day}{F("日","にち")}</span>
                </motion.div>
              );
            })}
          </div>

          {/* 今日の報酬 */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-amber-50 border-[3px] border-amber-300 rounded-2xl p-4 mb-4"
          >
            <div className="text-3xl mb-1">{reward.icon}</div>
            <div className="font-black text-amber-700 text-base">{reward.label}</div>
            <div className="text-xs text-amber-600 opacity-70">Day {bonusDay} ボーナス</div>
          </motion.div>

          <MotionButton
            variant="accent"
            onClick={onClaim}
            className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309]"
          >
            <Gift size={20} /> うけとる！
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LoginBonusPopup;
