import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Pencil } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModalDialog from '../ui/ModalDialog';
import { F } from '../ui/FormatKun';
import { penaltyAddedLines, penaltyStepLines } from '../ui/PenaltyLoss';
import { CARELESS } from '../../constants/gameConfig';

/**
 * ほとんど書かずに「こたえあわせ」を押したときの確かめ（答えは、まだ見せない）。
 *
 * ペナルティは重く、取り返しがつかない（コイン・もちもの・素材・レベル・町の土地）。
 * だから、何を失うかを先に見せ、子どもが自分で「このまま」を選んだときにだけ科す。
 * - 書きなおす（いちばん大きいボタン。Esc もこれ）: 何も起きない。書いた線もそのまま
 * - わからない: 答えを見て、もう1回（何も減らない）
 * - このまま こたえあわせ: 数秒たってから押せる。1画書いたあとに手が当たって「こたえあわせ」を
 *   押し、続けてもう1回 押してしまっても、科されないようにするため
 *
 * @param {{ preview: { heavy: boolean, step: object|null, nextStep: object|null }, onRewrite: () => void,
 *   onGiveUp: () => void, onProceed: () => void }} props
 */
export default function CarelessConfirm({ preview, onRewrite, onGiveUp, onProceed }) {
  const [left, setLeft] = useState(Math.ceil(CARELESS.CONFIRM_DELAY_MS / 1000));
  useEffect(() => {
    if (left <= 0) return undefined;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);
  const armed = left <= 0;
  const lines = penaltyStepLines(preview?.heavy ? preview.step : null);
  const added = penaltyAddedLines(preview?.heavy ? preview.step : null, preview?.nextStep);

  return (
    <ModalDialog
      labelId="careless-confirm-title"
      onEscape={onRewrite}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[105] bg-black/60 flex items-center justify-center p-3"
    >
      <motion.div
        initial={{ scale: 0.85, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        data-testid="careless-confirm"
        className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] shadow-[6px_6px_0_var(--text)] p-4 sm:p-5 [@media(max-height:619px)]:p-3 max-w-sm w-full max-h-full overflow-y-auto text-center"
      >
        {/* 背の低い画面では絵を省き、余白を詰める（いちばん重い段でも、3つのボタンが画面に入るように） */}
        <div className="text-4xl mb-1 [@media(max-height:619px)]:hidden" aria-hidden="true">✋</div>
        <h2 id="careless-confirm-title" className="text-lg font-black text-[var(--text)] leading-snug">まだ ほとんど {F("書","か")}いていないよ</h2>
        <p className="mt-1 text-xs font-bold text-[var(--text)] leading-relaxed">
          このまま こたえあわせを すると「てきとう{F("書","が")}き」に なって、
        </p>
        <ul className="mt-2 text-left text-sm font-black text-[var(--text)] bg-[var(--bg)] border-[3px] border-[var(--primary)] rounded-xl px-3 py-2 space-y-1 leading-snug [@media(max-height:619px)]:mt-1 [@media(max-height:619px)]:px-2 [@media(max-height:619px)]:py-1 [@media(max-height:619px)]:space-y-0.5 [@media(max-height:619px)]:text-[13px]" data-testid="careless-confirm-losses">
          <li className="flex gap-2"><span aria-hidden="true">⭐</span><span>この{F("回","かい")}の EXP と コインは もらえない</span></li>
          {lines.map(({ key, icon, text }) => (
            <li key={key} className="flex gap-2" data-loss={key}><span aria-hidden="true">{icon}</span><span>{text}</span></li>
          ))}
        </ul>
        {added.length > 0 && (
          <p className="mt-2 text-[11px] font-bold text-[var(--text-muted)] leading-relaxed" data-testid="careless-confirm-next">
            {preview.heavy ? <>つぎに やると：</> : <>あしたから また やると：</>}
            {added.map(({ key, text }, index) => <span key={key}>{index > 0 ? '・' : ''}{text}</span>)}
          </p>
        )}
        <p className="mt-2 text-xs font-bold text-[var(--text)] leading-relaxed [@media(max-height:619px)]:mt-1 [@media(max-height:619px)]:leading-snug">
          {/* 文のとちゅうで折れないよう、文ごとにまとめる */}
          <span className="inline-block">わからないときは「わからない」を おしてね。</span>
          <span className="inline-block">なにも へらないよ。</span>
        </p>
        <div className="mt-3 flex flex-col gap-2 [@media(max-height:619px)]:mt-2 [@media(max-height:619px)]:gap-1.5">
          <MotionButton variant="primary" data-autofocus onClick={onRewrite} data-testid="careless-rewrite" className="w-full py-3 [@media(max-height:619px)]:py-2 text-lg font-black border-[4px] border-[var(--text)] shadow-[0_5px_0_#9f1239]">
            <Pencil size={22} /> {F("書","か")}きなおす
          </MotionButton>
          <MotionButton variant="secondary" onClick={onGiveUp} data-testid="careless-giveup" style={{ minHeight: 48 }} className="w-full py-2 text-sm font-black border-[3px] border-[var(--text)]">
            <HelpCircle size={18} /> わからない（こたえを {F("見","み")}る）
          </MotionButton>
          <MotionButton
            variant="secondary"
            onClick={() => { if (armed) onProceed(); }}
            disabled={!armed}
            aria-disabled={!armed || undefined}
            data-testid="careless-proceed"
            style={{ minHeight: 48 }}
            className="w-full py-2 text-xs font-bold border-[2px] border-[var(--text)] shadow-none"
          >
            {armed ? <>このまま こたえあわせ（なくなっても いい）</> : <>このまま こたえあわせ（{left}）</>}
          </MotionButton>
        </div>
      </motion.div>
    </ModalDialog>
  );
}
