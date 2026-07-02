export default function Loading() {
  return (
    <div className="flex-1 flex flex-col h-full relative animate-in fade-in duration-500">
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
    </div>
  );
}
