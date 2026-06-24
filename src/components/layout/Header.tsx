"use client";

import { PanelLeft, EyeOff, Bell, Zap } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useAdminStore } from "@/store/useAdminStore";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useTheme } from "next-themes";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function Header() {
  const { isSidebarOpen, setSidebarOpen, isTemporaryChat, setIsTemporaryChat } = useChatStore();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { activeAlerts, dismissAlert } = useAdminStore();

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const planName = session?.user?.plan ? session.user.plan.charAt(0).toUpperCase() + session.user.plan.slice(1) : "Free";
  const isPaidPlan = session?.user?.plan !== "free" && !!session?.user?.plan;

  const dismissedIds = mounted ? JSON.parse(localStorage.getItem("drasa_dismissed_alerts") || "[]") : [];
  const unreadCount = mounted ? activeAlerts.filter((a: any) => !dismissedIds.includes(a._id)).length : 0;

  return (
    <>
      {!isSidebarOpen && (
        <div className="md:hidden absolute top-4 left-4 z-50">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] bg-card dark:bg-[#1A1918] p-1.5 rounded-lg border border-border dark:border-[#2D2C2A]"
          >
            <PanelLeft size={20} />
          </button>
        </div>
      )}

      <div className="flex justify-center pt-4 pb-2 w-full absolute top-0 z-10 pointer-events-none">
        <div className="pointer-events-auto bg-card/80 dark:bg-[#262523]/80 backdrop-blur-md hover:bg-accent dark:hover:bg-[#32302D] text-muted-foreground dark:text-[#A3A19C] text-[13px] px-4 py-1.5 rounded-full border border-border dark:border-[#33312E] transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-primary/10 dark:hover:shadow-[#C36A4F]/10 cursor-pointer group">
          <span className={`font-semibold bg-gradient-to-r ${isPaidPlan ? 'from-foreground to-primary dark:from-[#E6E4DF] dark:to-[#C36A4F] group-hover:from-foreground group-hover:to-primary dark:group-hover:from-[#ffffff] dark:group-hover:to-[#ff8d6e]' : 'from-foreground to-foreground dark:from-[#E6E4DF] dark:to-[#E6E4DF]'} bg-clip-text text-transparent transition-colors`}>
            Drasa AI
          </span> 
          <span className="text-muted-foreground/50 dark:text-[#5C5A56]">·</span> 
          <div className="flex items-center gap-1.5">
            {isPaidPlan ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-foreground/80 dark:text-[#D4D2CD] font-medium">{planName}</span>
              </>
            ) : (
              <>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground dark:bg-[#8A8985]"></span>
                <span className="text-muted-foreground dark:text-[#8A8985] font-medium">Free</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {!isPaidPlan && (
          <button
            onClick={() => window.location.href = '/upgrade'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 dark:border-[#C36A4F]/30 bg-primary/10 dark:bg-[#C36A4F]/10 hover:bg-primary/20 dark:hover:bg-[#C36A4F]/20 text-primary dark:text-[#C36A4F] text-[13px] font-medium shadow-sm transition-all duration-300"
            title="Upgrade to Premium"
          >
            <Zap size={14} className="fill-current" />
            <span className="hidden sm:inline">Upgrade</span>
          </button>
        )}
        <button 
          onClick={() => setIsTemporaryChat(!isTemporaryChat)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300 text-[13px] font-medium shadow-sm ${
            isTemporaryChat 
              ? 'bg-primary/10 dark:bg-[#C36A4F]/10 text-primary dark:text-[#C36A4F] border-primary/30 dark:border-[#C36A4F]/30 hover:bg-primary/20 dark:hover:bg-[#C36A4F]/20' 
              : 'bg-card dark:bg-[#262523] text-muted-foreground dark:text-[#A3A19C] border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#32302D] hover:text-foreground dark:hover:text-[#E6E4DF]'
          }`}
          title="Temporary Chat (Messages won't be saved)"
        >
          <EyeOff size={16} className={isTemporaryChat ? 'animate-pulse text-primary dark:text-[#C36A4F]' : ''} />
          <span className="hidden sm:inline">Temporary Chat</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 rounded-lg border border-border dark:border-[#33312E] bg-card dark:bg-[#262523] hover:bg-accent dark:hover:bg-[#32302D] transition-colors relative text-muted-foreground dark:text-[#A3A19C] hover:text-foreground dark:hover:text-[#E6E4DF]"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-background dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-border dark:border-[#33312E] flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {activeAlerts.length > 0 && (
                  <button 
                    onClick={() => {
                      const allIds = activeAlerts.map(a => a._id);
                      localStorage.setItem("drasa_dismissed_alerts", JSON.stringify(allIds));
                      activeAlerts.forEach(a => dismissAlert(a._id));
                      setIsDropdownOpen(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {activeAlerts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  activeAlerts.map(alert => {
                    const isRead = dismissedIds.includes(alert._id);
                    return (
                      <div key={alert._id} className={`p-3 rounded-lg mb-1 border ${isRead ? 'opacity-60 border-transparent' : 'border-border dark:border-[#33312E] bg-accent/30 dark:bg-[#32302D]/30'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <div className={`w-2 h-2 rounded-full mt-1 ${alert.type === 'emergency' ? 'bg-red-500' : alert.type === 'maintenance' ? 'bg-orange-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        {alert.actionUrl && (
                          <a href={alert.actionUrl} className="text-xs text-primary mt-2 inline-block font-medium hover:underline">
                            {alert.actionText || "View Details"}
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
        {mounted ? (
          <AnimatedThemeToggler 
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            onThemeChange={setTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground outline-none text-muted-foreground"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full" />
        )}
      </div>
    </>
  );
}
