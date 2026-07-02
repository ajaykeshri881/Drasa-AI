"use client";

import { PanelLeft, EyeOff, Zap, Share2 } from "lucide-react";
import { useChatStore } from "@/features/chat/store/useChatStore";
import { AnimatedThemeToggler } from "@/components/ui/theme/animated-theme-toggler";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PlanStatusPill } from "./PlanStatusPill";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { ShareDialog } from "@/features/chat/components/ShareDialog";
import { usePathname } from "next/navigation";

export function Header() {
  const { isSidebarOpen, setSidebarOpen, isTemporaryChat, setIsTemporaryChat, activeChatId } = useChatStore();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close share dialog when navigating away
  useEffect(() => {
    setIsShareOpen(false);
  }, [pathname]);
  
  const planName = session?.user?.plan ? session.user.plan.charAt(0).toUpperCase() + session.user.plan.slice(1) : "Free";
  const isPaidPlan = session?.user?.plan !== "free" && !!session?.user?.plan;

  // Show share button only on chat pages with an active chat and logged-in user
  const isChatPage = pathname?.startsWith("/c/");
  const canShare = isChatPage && !!activeChatId && !isTemporaryChat;

  return (
    <>
      {/* Top Gradient Mask to prevent scrolling text from overlapping icons */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-background via-background/95 to-transparent z-20 pointer-events-none" />

      {/* Header Content Container */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-start justify-between px-3 sm:px-4 pt-4 pointer-events-none">
        
        {/* Left: Hamburger */}
        <div className="shrink-0 flex items-start justify-start pointer-events-auto">
          {!isSidebarOpen && (
            <div className="md:hidden">
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] bg-card dark:bg-[#1A1918] p-1.5 rounded-lg border border-border dark:border-[#2D2C2A]"
              >
                <PanelLeft size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Center: Drasa AI Pill */}
        <PlanStatusPill isPaidPlan={isPaidPlan} planName={planName} />

        {/* Right: Action Buttons */}
        <div className="shrink-0 flex justify-end items-center gap-1 sm:gap-2 pointer-events-auto">
          {!isPaidPlan && (
            <button
              onClick={() => window.location.href = '/upgrade'}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-primary/30 dark:border-[#C36A4F]/30 bg-primary/10 dark:bg-[#C36A4F]/10 hover:bg-primary/20 dark:hover:bg-[#C36A4F]/20 text-primary dark:text-[#C36A4F] text-[13px] font-medium shadow-sm transition-all duration-300 shrink-0"
              title="Upgrade to Premium"
            >
              <Zap size={14} className="fill-current" />
              <span className="hidden sm:inline">Upgrade</span>
            </button>
          )}

          {/* Share Button — only visible when on an active non-temporary chat */}
          {canShare && (
            <button
              onClick={() => setIsShareOpen(true)}
              id="share-chat-btn"
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-border dark:border-[#33312E] bg-card dark:bg-[#262523] hover:bg-accent dark:hover:bg-[#32302D] text-muted-foreground dark:text-[#A3A19C] hover:text-foreground dark:hover:text-[#E6E4DF] text-[13px] font-medium shadow-sm transition-all duration-300 shrink-0"
              title="Share this chat"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          <button 
            onClick={() => setIsTemporaryChat(!isTemporaryChat)}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border transition-all duration-300 text-[13px] font-medium shadow-sm shrink-0 ${
              isTemporaryChat 
                ? 'bg-primary/10 dark:bg-[#C36A4F]/10 text-primary dark:text-[#C36A4F] border-primary/30 dark:border-[#C36A4F]/30 hover:bg-primary/20 dark:hover:bg-[#C36A4F]/20' 
                : 'bg-card dark:bg-[#262523] text-muted-foreground dark:text-[#A3A19C] border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#32302D] hover:text-foreground dark:hover:text-[#E6E4DF]'
            }`}
            title="Temporary Chat (Messages won't be saved)"
          >
            <EyeOff size={16} className={isTemporaryChat ? 'animate-pulse text-primary dark:text-[#C36A4F]' : ''} />
            <span className="hidden sm:inline">Temporary Chat</span>
          </button>

          <NotificationsDropdown mounted={mounted} />

          {mounted ? (
            <AnimatedThemeToggler 
              theme={resolvedTheme === "dark" ? "dark" : "light"}
              onThemeChange={setTheme}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full hover:bg-accent hover:text-accent-foreground outline-none text-muted-foreground shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full shrink-0" />
          )}
        </div>
      </div>

      {/* Share Dialog Portal */}
      {isShareOpen && activeChatId && (
        <ShareDialog
          chatId={activeChatId}
          isTemporaryChat={isTemporaryChat}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </>
  );
}
