import { motion } from 'framer-motion';

const Medal = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="medal-gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <path d="M35 40 L25 80 L50 70 L75 80 L65 40" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />
    <path d="M40 40 L35 70 L50 65 L65 70 L60 40" fill="#dc2626" opacity="0.6" />
    <circle cx="50" cy="40" r="32" fill="url(#medal-gold)" stroke="#78350f" strokeWidth="2.5" />
    <circle cx="50" cy="40" r="26" fill="none" stroke="#fef3c7" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />
    <path d="M50 22 L56 36 H70 L59 44 L63 58 L50 50 L37 58 L41 44 L30 36 H44 Z" fill="#fff" opacity="0.9" />
    {/* Sparkles */}
    <path d="M75 15 L77 20 L82 22 L77 24 L75 29 L73 24 L68 22 L73 20 Z" fill="#fff" opacity="0.8" />
    <path d="M25 25 L26 28 L29 29 L26 30 L25 33 L24 30 L21 29 L24 28 Z" fill="#fff" opacity="0.6" />
  </svg>
);

const StampEffect = ({ stamp }) => {
  if (!stamp) return null;
  const config = { 
    'easy': { text: <Medal className="w-[180px] h-[180px] md:w-[240px] md:h-[240px]" />, color: 'text-amber-500', label: 'よくできました！', purify: true }, 
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
