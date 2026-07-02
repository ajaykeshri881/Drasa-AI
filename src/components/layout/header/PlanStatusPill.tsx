import React from "react";

interface PlanStatusPillProps {
  isPaidPlan: boolean;
  planName: string;
}

export function PlanStatusPill({ isPaidPlan, planName }: PlanStatusPillProps) {
  return (
    <div className="flex-1 flex justify-center mx-2 pointer-events-auto min-w-0">
      <div className="bg-card/80 dark:bg-[#262523]/80 backdrop-blur-md hover:bg-accent dark:hover:bg-[#32302D] text-muted-foreground dark:text-[#A3A19C] text-[12px] sm:text-[13px] px-3 sm:px-4 py-1.5 rounded-full border border-border dark:border-[#33312E] transition-all duration-300 flex items-center gap-1.5 shadow-lg hover:shadow-primary/10 dark:hover:shadow-[#C36A4F]/10 cursor-pointer group whitespace-nowrap overflow-hidden max-w-full">
        <span className="font-semibold shrink-0 bg-gradient-to-r from-foreground to-primary dark:from-[#E6E4DF] dark:to-[#C36A4F] group-hover:from-foreground group-hover:to-primary dark:group-hover:from-[#ffffff] dark:group-hover:to-[#ff8d6e] bg-clip-text text-transparent transition-colors">
          Drasa AI
        </span> 
        <span className="text-muted-foreground/50 dark:text-[#5C5A56] shrink-0">·</span> 
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          {isPaidPlan ? (
            <>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-foreground/80 dark:text-[#D4D2CD] font-medium truncate">{planName}</span>
            </>
          ) : (
            <>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground dark:bg-[#8A8985] shrink-0"></span>
              <span className="text-muted-foreground dark:text-[#8A8985] font-medium truncate">Free</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
