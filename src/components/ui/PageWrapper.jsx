import { motion } from 'framer-motion';

const PageWrapper = ({ children, keyName, wide }) => (<motion.div key={keyName} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className={`absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden p-2 md:p-4 no-scrollbar ${wide ? '' : ''}`}><div className={`m-auto w-full h-full ${wide ? 'max-w-7xl' : 'max-w-lg'}`}>{children}</div></motion.div>);
const FullScreenWrapper = ({ children, keyName }) => (<motion.div key={keyName} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="absolute inset-0 flex flex-col p-0 md:p-6 overflow-hidden"><div className="w-full h-full max-w-7xl mx-auto flex flex-col">{children}</div></motion.div>);

export { PageWrapper, FullScreenWrapper };
