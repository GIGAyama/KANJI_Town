const ModeLayout = ({ mainContent, sidebarContent }) => (
  <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-4 md:gap-6 w-full h-full overflow-y-auto md:overflow-hidden no-scrollbar">
    <div className="bg-[var(--bg)] rounded-[20px] border-[4px] border-[var(--text)] flex items-center justify-center overflow-auto p-2 md:p-6 shadow-inner relative shrink-0 h-[40vh] min-h-[200px] md:h-auto md:flex-1 md:min-h-0">{mainContent}</div>
    <div className="w-full md:w-[360px] flex flex-col shrink-0 md:h-full md:overflow-y-auto no-scrollbar pb-6 md:pb-0">{sidebarContent}</div>
  </div>
);

export default ModeLayout;
