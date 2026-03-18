// 住民素材収集結果ポップアップ — マイ漢字タウン（Phase 7）
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Coins, TrendingUp } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { F } from '../ui/FormatKun';
import { MATERIALS } from '../../data/materials';

const ResidentCollectionPopup = ({ result, satisfaction, satLabel, onConfirm }) => {
  if (!result) return null;

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
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-5xl mb-2"
          >
            🏠
          </motion.div>
          <h2 className="text-lg font-black text-[var(--text)] mb-1">{F("住民","じゅうみん")}がお仕事を終えました！</h2>
          <p className="text-xs text-[var(--text)] opacity-50 mb-4">今日の収穫を報告します</p>

          {/* 満足度ステータス */}
          <div className="flex justify-center items-center gap-2 mb-4 bg-[var(--bg)] border-2 border-[var(--text)] rounded-xl py-2 px-4 shadow-sm">
            <span className="text-xs font-bold text-[var(--text)] opacity-60">町の満足度:</span>
            <span className="font-black text-sm" style={{ color: satLabel.color }}>{satLabel.emoji} {satLabel.text} ({satisfaction}%)</span>
          </div>

          {/* 収集結果リスト */}
          <div className="bg-emerald-50 border-[3px] border-emerald-300 rounded-2xl p-4 mb-4">
            <div className="flex flex-col gap-2">
              {Object.entries(result.materials || {}).map(([matId, amount]) => {
                const mat = MATERIALS[matId];
                if (!mat) return null;
                return (
                  <div key={matId} className="flex items-center justify-between bg-white/50 rounded-lg px-3 py-1.5 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{mat.icon}</span>
                      <span className="text-xs font-bold text-emerald-800">{mat.name}</span>
                    </div>
                    <span className="font-black text-emerald-600">+{amount}</span>
                  </div>
                );
              })}
              {result.coins > 0 && (
                <div className="flex items-center justify-between bg-yellow-100/50 rounded-lg px-3 py-1.5 border border-yellow-200 mt-1">
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-800">コイン報酬</span>
                  </div>
                  <span className="font-black text-yellow-600">+{result.coins}</span>
                </div>
              )}
              {result.maintenanceCost > 0 && (
                <div className="flex items-center justify-between opacity-60 px-3 py-1 border-t border-emerald-200 mt-1">
                  <span className="text-[10px] font-bold text-emerald-800">建物維持費</span>
                  <span className="text-[10px] font-bold text-rose-500">-{result.maintenanceCost}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-[var(--text)] opacity-50 mb-4 italic">※学習をサボると満足度が下がり、収穫が減ります</p>

          <MotionButton
            variant="success"
            onClick={onConfirm}
            className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_#065f46]"
          >
            おつかれさま！
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResidentCollectionPopup;
