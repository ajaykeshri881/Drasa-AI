import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from "next-themes";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center gap-2">
        <Sun size={18} className="text-muted-foreground dark:text-[#8A8985]" />
        Appearance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'light', icon: <Sun size={20} />, label: 'Light' },
          { id: 'dark', icon: <Moon size={20} />, label: 'Dark' },
          { id: 'system', icon: <Monitor size={20} />, label: 'System' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all duration-200 ${
              theme === t.id 
                ? 'border-primary dark:border-[#C36A4F] bg-primary/5 dark:bg-[#C36A4F]/10 text-primary dark:text-[#C36A4F]' 
                : 'border-border dark:border-[#33312E] text-muted-foreground hover:border-border/80 hover:bg-accent/50 dark:hover:bg-[#363532]/50'
            }`}
          >
            {t.icon}
            <span className="font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
