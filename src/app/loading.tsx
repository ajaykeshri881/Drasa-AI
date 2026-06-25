export default function Loading() {
  return (
    <div className="flex h-screen w-full bg-background dark:bg-[#121110] overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar Skeleton (Desktop only) */}
      <aside className="hidden md:flex flex-col w-[260px] h-full bg-[#FAFAFA] dark:bg-[#1A1918] border-r border-border dark:border-[#33312E] p-4">
        <div className="flex items-center justify-between mb-8 mt-2">
          <div className="h-6 w-24 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-6 w-6 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
            <div className="h-6 w-6 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-10 w-full bg-muted dark:bg-[#2A2928] rounded-lg animate-pulse"></div>
          <div className="h-10 w-full bg-muted dark:bg-[#2A2928] rounded-lg animate-pulse"></div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="h-4 w-16 bg-muted dark:bg-[#2A2928] rounded animate-pulse mb-2"></div>
          <div className="h-8 w-full bg-muted dark:bg-[#2A2928] rounded-lg animate-pulse"></div>
          <div className="h-8 w-full bg-muted dark:bg-[#2A2928] rounded-lg animate-pulse"></div>
          <div className="h-8 w-full bg-muted dark:bg-[#2A2928] rounded-lg animate-pulse"></div>
        </div>

        <div className="mt-auto pt-4 border-t border-border dark:border-[#33312E]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted dark:bg-[#2A2928] rounded-full animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
              <div className="h-2 w-12 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area Skeleton */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Mobile Header Skeleton */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border dark:border-[#33312E]">
          <div className="h-6 w-6 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
          <div className="h-6 w-20 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
          <div className="h-6 w-6 bg-muted dark:bg-[#2A2928] rounded animate-pulse"></div>
        </header>

        {/* Center Content Skeleton */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-[10vh]">
          <div className="h-10 w-64 bg-muted dark:bg-[#1A1918] rounded-lg animate-pulse mb-8"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[600px]">
            <div className="h-20 w-full bg-muted dark:bg-[#1A1918] rounded-xl animate-pulse"></div>
            <div className="h-20 w-full bg-muted dark:bg-[#1A1918] rounded-xl animate-pulse"></div>
            <div className="h-20 w-full bg-muted dark:bg-[#1A1918] rounded-xl animate-pulse"></div>
            <div className="h-20 w-full bg-muted dark:bg-[#1A1918] rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Input Box Skeleton */}
        <div className="absolute bottom-0 w-full pt-10 pb-4">
          <div className="w-full max-w-3xl mx-auto px-4 pb-6">
            <div className="w-full h-24 bg-muted dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </main>

    </div>
  );
}
