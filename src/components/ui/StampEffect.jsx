import { motion } from 'framer-motion';

const Hanamaru = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
    <path d="M50,10 C25,10 10,30 15,55 C20,80 40,90 65,85 C90,80 95,55 90,30 C85,15 65,5 50,10 C30,15 20,40 25,60 C30,80 55,85 75,70" />
    {[0, 72, 144, 216, 288].map(angle => (
      <path key={angle} d="M50,8 Q55,0 60,8" strokeWidth="3" transform={`rotate(${angle}, 50, 50)`} />
    ))}
  </svg>
);

const StampEffect = ({ stamp }) => {
  if (!stamp) return null;
  const config = { 
    'easy': { text: <Hanamaru className="w-[180px] h-[180px] md:w-[240px] md:h-[240px]" />, color: 'text-rose-500', label: 'よゆう！', purify: true }, 
    'good': { text: '👍', color: 'text-sky-500', label: '書けた！' }, 
    'again': { text: '💦', color: 'text-slate-500', label: '忘れた…' } 
  }[stamp];

  return (
    <motion.div initial={{ scale: 4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.5 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      {config.purify && <motion.div initial={{ width: 0, opacity: 1 }} animate={{ width: '150%', opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 z-[-1] pointer-events-none flex items-center justify-center overflow-hidden"><div className="h-40 bg-slate-900 rounded-full blur-[2px] w-full origin-left -rotate-12 transform scale-150"></div></motion.div>}
      <div className={`text-[150px] md:text-[200px] leading-none drop-shadow-2xl filter ${config.color}`} style={typeof config.text === 'string' ? { textShadow: '4px 4px 0 #fff, -4px -4px 0 #fff, 4px -4px 0 #fff, -4px 4px 0 #fff' } : {}}>
        {config.text}
      </div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4 bg-white/90 backdrop-blur px-6 py-2 rounded-full border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] text-3xl font-black text-[var(--text)]">{config.label}</motion.div>
    </motion.div>
  );
};

export default StampEffect;
