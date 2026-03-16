const ModeLayout = ({ mainContent, sidebarContent }) => (
  <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 md:gap-6 w-full h-full">
    <div className="flex-1 bg-[var(--bg)] rounded-[20px] border-[4px] border-[var(--text)] flex items-center justify-center overflow-auto p-2 md:p-8 shadow-inner relative min-h-[40vh] md:min-h-0">{mainContent}</div>
    <div className="w-full lg:w-[340px] flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto no-scrollbar pb-6 lg:pb-0">{sidebarContent}</div>
  </div>
);

export default ModeLayout;
