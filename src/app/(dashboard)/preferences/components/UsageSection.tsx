import React from 'react';
import { Activity } from 'lucide-react';

interface UsageSectionProps {
  userData: any;
}

export function UsageSection({ userData }: UsageSectionProps) {
  if (!userData) return null;

  return (
    <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] flex items-center gap-2">
          <Activity size={18} className="text-primary dark:text-[#C36A4F]" />
          Usage & Limits
        </h2>
        <div className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary dark:text-[#C36A4F] uppercase tracking-wider">
          {userData.plan} Plan
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground dark:text-[#E6E4DF] font-medium">Monthly Tokens</span>
            <span className="text-muted-foreground dark:text-[#8A8985]">
              {((userData.usage?.tokensUsedThisMonth || 0) / 1000).toFixed(1)}k / {userData.plan === 'ultimate' ? '2M' : userData.plan === 'pro' ? '750k' : '25k'}
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted dark:bg-[#1A1918] rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary dark:bg-[#C36A4F] transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${Math.min(100, ((userData.usage?.tokensUsedThisMonth || 0) / (userData.plan === 'ultimate' ? 2000000 : userData.plan === 'pro' ? 750000 : 25000)) * 100)}%`
              }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground dark:text-[#8A8985] text-right">
            {Math.round(Math.min(100, ((userData.usage?.tokensUsedThisMonth || 0) / (userData.plan === 'ultimate' ? 2000000 : userData.plan === 'pro' ? 750000 : 25000)) * 100))}% used this month
          </div>
        </div>
      </div>

      {userData.plan !== 'ultimate' && (
        <div className="mt-6 pt-5 border-t border-border/50 dark:border-[#33312E]/50">
          <div className="bg-gradient-to-r from-primary/10 to-transparent dark:from-[#C36A4F]/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold text-primary dark:text-[#C36A4F] text-sm">Need more limits?</h4>
              <p className="text-xs text-muted-foreground dark:text-[#8A8985] mt-0.5">Upgrade your plan for higher monthly allowances and premium models.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/upgrade'}
              className="px-4 py-2 bg-primary text-primary-foreground dark:bg-[#C36A4F] dark:text-[#1A1918] text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
