"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, Settings } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/features/chat/store/useChatStore";

interface SidebarFooterProps {
  isSidebarOpen: boolean;
  userData: any; // We'll type this later
}

export function SidebarFooter({ isSidebarOpen, userData }: SidebarFooterProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    // Clear the Zustand store memory
    useChatStore.getState().setChats([]);
    useChatStore.getState().setActiveChatId(null);
    
    // Clear persisted local storage
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("drasa-chat-storage");
    }

    await signOut();
  };

  return (
    <div className="p-4 border-t border-border dark:border-[#33312E] relative">
      {session?.user ? (
        <>
          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && isSidebarOpen && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border dark:border-[#33312E]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-white font-medium text-lg">
                  {session.user.name ? session.user.name.substring(0, 2).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground dark:text-[#E6E4DF] truncate">{session.user.name || "User"}</div>
                  <div className="text-xs text-muted-foreground truncate" title={session.user.email || ""}>{session.user.email}</div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Plan</span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-primary text-primary-foreground dark:bg-[#C36A4F] dark:text-[#1A1918] uppercase tracking-wider">
                    {userData?.plan || (session.user as any).plan || "Free"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/preferences" className="flex items-center justify-center gap-2 py-2 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded-lg transition-colors">
                  <Settings size={14} /> Settings
                </Link>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 py-2 px-3 bg-secondary hover:bg-destructive/10 text-secondary-foreground hover:text-destructive text-xs font-medium rounded-lg transition-colors">
                  <LogOut size={14} /> Log out
                </button>
              </div>
            </div>
          )}

          {/* Profile Toggle Button */}
          <div
            onClick={() => isSidebarOpen ? setIsProfileMenuOpen(!isProfileMenuOpen) : router.push('/preferences')}
            className={`flex items-center ${!isSidebarOpen ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg hover:bg-accent dark:hover:bg-[#2A2928] transition-colors cursor-pointer group border border-transparent dark:hover:border-[#33312E]/50`}
            title={isSidebarOpen ? "View Profile" : "Open Preferences"}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary/60 dark:from-[#C36A4F] dark:to-[#ff8d6e] flex-shrink-0 flex items-center justify-center text-white font-medium text-sm shadow-sm group-hover:shadow-md transition-all">
              {session.user.name ? session.user.name.substring(0, 2).toUpperCase() : "U"}
            </div>
            {isSidebarOpen && (
              <>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[13px] font-medium text-foreground dark:text-[#E6E4DF] truncate">
                    {session.user.name || "User"}
                  </div>
                  <div className="text-[11px] text-muted-foreground dark:text-[#8A8985] capitalize">
                    {(session.user as any).plan || "Free"} plan
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <Link href="/login" className={`flex items-center ${!isSidebarOpen ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg hover:bg-accent dark:hover:bg-[#2A2928] transition-colors cursor-pointer group border border-transparent dark:hover:border-[#33312E]/50`}>
          <div className="w-8 h-8 rounded-full bg-muted dark:bg-[#33312E] flex-shrink-0 flex items-center justify-center text-muted-foreground dark:text-[#8A8985]">
            <LogIn size={16} />
          </div>
          {isSidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <div className="text-[13px] font-medium text-foreground dark:text-[#E6E4DF] truncate">Sign In</div>
              <div className="text-[11px] text-muted-foreground dark:text-[#8A8985]">Sync your chats</div>
            </div>
          )}
        </Link>
      )}
    </div>
  );
}
