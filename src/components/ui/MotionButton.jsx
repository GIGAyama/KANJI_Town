import { motion } from 'framer-motion';
import { audioCtrl } from '../../systems/audio.js';

const MotionButton = ({ children, onClick, className, disabled, variant = "default", ...props }) => {
  let variantClasses = "";
  if (variant === "primary") variantClasses = "bg-[var(--primary)] text-[var(--panel)] hover:bg-rose-600 shadow-[0_4px_0_#9f1239]";
  else if (variant === "secondary") variantClasses = "bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--bg)] shadow-[0_4px_0_var(--text)]";
  else if (variant === "success") variantClasses = "bg-[var(--secondary)] text-[var(--panel)] hover:bg-emerald-600 shadow-[0_4px_0_#065f46]";
  else if (variant === "danger") variantClasses = "bg-slate-500 text-white hover:bg-slate-600 shadow-[0_4px_0_#334155]";
  else if (variant === "accent") variantClasses = "bg-[var(--accent)] text-[var(--text)] hover:bg-amber-400 shadow-[0_4px_0_#b45309]";
  else if (variant === "warning") variantClasses = "bg-amber-400 text-amber-900 hover:bg-amber-500 shadow-[0_4px_0_#92400e]";
  return (
    <motion.button whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.95, y: 2, boxShadow: "none" } : {}} onClick={() => { if (disabled) return; audioCtrl.playSE('click'); if (onClick) onClick(); }} className={`rounded-[20px] font-bold border-none outline-none flex items-center justify-center gap-2 select-none touch-manipulation transition-colors ${disabled ? 'opacity-50 cursor-not-allowed filter grayscale' : ''} ${variantClasses} ${className}`} {...props}>
      {children}
    </motion.button>
  );
};

export default MotionButton;
