"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, MessageSquare, MessagesSquare, Settings, Search, PanelLeftClose, Layout, Zap, LogIn, LogOut, Pin, Trash2, Trash } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Activity, User as UserIcon } from "lucide-react";

export function Sidebar() {
  const { chats, isSidebarOpen, setSidebarOpen, activeChatId, removeChat, togglePin, clearAllChats, loadChats } = useChatStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { setDefaultMode } = useSettingsStore();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [isMobileInitialized, setIsMobileInitialized] = React.useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    setMounted(true);
    if (session?.user?.email) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) setUserData(data.user);
        })
        .catch(err => console.error("Failed to fetch user data in sidebar", err));
    }
    loadChats();
  }, [session, loadChats]);

  // Close sidebar by default on mobile screens and mark as initialized
  React.useEffect(() => {
    if (mounted && !isDesktop) {
      setSidebarOpen(false);
    }
    if (mounted) {
      setIsMobileInitialized(true);
    }
  }, [mounted, isDesktop, setSidebarOpen]);

  const visualSidebarOpen = !mounted
    ? isSidebarOpen
    : ((!isDesktop && !isMobileInitialized) ? false : isSidebarOpen);

  if (!isDesktop && !visualSidebarOpen && mounted) return null;

  const filteredChats = searchQuery
    ? chats.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  const pinnedChats = filteredChats.filter(c => c.isPinned);
  const unpinnedChats = filteredChats.filter(c => !c.isPinned);

  const handleClearMemory = async () => {
    if (!confirm("Are you sure you want to clear all AI memory?")) return;
    try {
      const res = await fetch('/api/memory?id=all', { method: 'DELETE' });
      if (res.ok) {
        toast.success("AI Memory cleared successfully.");
      } else {
        toast.error("Failed to clear memory.");
      }
    } catch (e) {
      toast.error("Error clearing memory.");
    }
  };

  const getSidebarWidthClass = () => {
    if (!mounted) {
      return isSidebarOpen ? "w-0 md:w-[280px]" : "w-0 md:w-[68px]";
    }
    return visualSidebarOpen ? "w-[280px]" : (isDesktop ? "w-[68px]" : "w-0");
  };

  return (
    <>
      {/* Mobile overlay */}
      {mounted && !isDesktop && visualSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 dark:bg-[#1A1918]/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`h-full bg-[#FAFAFA] dark:bg-[#1A1918] border-r border-border dark:border-[#33312E] transition-all duration-300 ease-in-out z-50 fixed md:relative flex flex-col overflow-hidden ${getSidebarWidthClass()}`}
      >
        <div className="flex flex-col h-full w-full overflow-hidden">

          <div className={`flex items-center ${!visualSidebarOpen ? 'justify-center' : 'justify-between'} px-4 py-3 min-h-[52px]`}>
            {visualSidebarOpen && !isSearchActive && <Link href="/" className="font-serif text-[17px] tracking-wide font-medium text-foreground dark:text-[#E6E4DF] whitespace-nowrap">Drasa AI</Link>}
            {visualSidebarOpen && isSearchActive && (
              <input
                type="text"
                autoFocus
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-sm text-foreground dark:text-[#E6E4DF] placeholder:text-muted-foreground mr-2"
              />
            )}
            <div className={`flex items-center gap-2 text-muted-foreground dark:text-[#8A8985] ${!isSidebarOpen ? 'w-full justify-center' : ''}`}>
              {isSidebarOpen && (
                <button
                  onClick={() => {
                    setIsSearchActive(!isSearchActive);
                    if (isSearchActive) setSearchQuery("");
                  }}
                  className={`hover:text-foreground dark:hover:text-[#E6E4DF] transition-colors p-1 ${isSearchActive ? 'text-primary dark:text-[#C36A4F]' : ''}`}
                >
                  <Search size={16} strokeWidth={2.5} />
                </button>
              )}
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hover:text-foreground dark:hover:text-[#E6E4DF] transition-colors p-1"><PanelLeftClose size={18} strokeWidth={2} className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar mt-2 flex flex-col px-3 pb-4">

            <div className="space-y-6 flex-1">
              <div className="space-y-0.5">
                <div onClick={() => {
                  if (pathname === "/") {
                    window.location.href = "/";
                  } else {
                    router.push("/");
                  }
                  if (!isDesktop) setSidebarOpen(false);
                }}>
                  <NavItem icon={<Plus size={16} />} label="New chat" collapsed={!isSidebarOpen} />
                </div>
                <Link href="/chats" onClick={() => { if (!isDesktop) setSidebarOpen(false); }}>
                  <NavItem icon={<MessagesSquare size={16} />} label="All chats" collapsed={!isSidebarOpen} />
                </Link>
              </div>

              <div>
                {isSidebarOpen && <div className="px-3 text-[11px] font-medium text-muted-foreground dark:text-[#73726E] mb-1.5 uppercase tracking-wider">Features</div>}
                <div className="space-y-0.5">
                  <div onClick={() => {
                    setDefaultMode("code");
                    toast.success("Coding Expert mode activated!");
                    if (!isDesktop) setSidebarOpen(false);
                    if (pathname !== "/") router.push("/");
                  }}>
                    <NavItem icon={<Layout size={16} />} label="Coding Expert" collapsed={!isSidebarOpen} />
                  </div>
                  <Link href="/preferences" onClick={() => { if (!isDesktop) setSidebarOpen(false); }}>
                    <NavItem icon={<Settings size={16} />} label="Preferences" collapsed={!isSidebarOpen} />
                  </Link>
                </div>
              </div>

              <div>
                {isSidebarOpen ? (
                  <div className="px-3 text-[11px] font-medium text-muted-foreground dark:text-[#73726E] mb-1.5 uppercase tracking-wider mt-4">
                    {isSearchActive ? 'Search Results' : 'Recent'}
                  </div>
                ) : (
                  <div className="mt-4 border-t border-border/50 dark:border-[#33312E]/50 pt-4" />
                )}
                <div className="space-y-0.5">
                  {filteredChats.length === 0 ? (
                    isSidebarOpen && <div className="px-3 py-4 text-xs text-muted-foreground italic text-center bg-muted/50 dark:bg-[#1A1918]/50 rounded-lg border border-border/30 dark:border-[#2D2C2A]/30">
                      {isSearchActive ? 'No chats found.' : 'No recent chats yet.'}
                    </div>
                  ) : (
                    <>
                      {pinnedChats.length > 0 && (
                        <div className="mb-4">
                          {isSidebarOpen && <div className="px-3 text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wider">Pinned</div>}
                          {pinnedChats.map((chat) => (
                            <RecentItem
                              key={chat.id}
                              chat={chat}
                              isActive={activeChatId === chat.id}
                              collapsed={!isSidebarOpen}
                              onPin={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(chat.id); }}
                              onDelete={(e) => { e.preventDefault(); e.stopPropagation(); removeChat(chat.id); if (pathname === `/c/${chat.id}`) router.push('/'); }}
                            />
                          ))}
                        </div>
                      )}
                      {unpinnedChats.length > 0 && (
                        <div>
                          {isSidebarOpen && pinnedChats.length > 0 && <div className="px-3 text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wider mt-2">Recent</div>}
                          {unpinnedChats.slice(0, 5).map((chat) => (
                            <RecentItem
                              key={chat.id}
                              chat={chat}
                              isActive={activeChatId === chat.id}
                              collapsed={!isSidebarOpen}
                              onPin={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(chat.id); }}
                              onDelete={(e) => { e.preventDefault(); e.stopPropagation(); removeChat(chat.id); if (pathname === `/c/${chat.id}`) router.push('/'); }}
                            />
                          ))}
                          {unpinnedChats.length > 5 && isSidebarOpen && (
                            <Link href="/chats" className="block text-center mt-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50 dark:hover:bg-[#2A2928]/50">
                              See more
                            </Link>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Data Management Section */}
              <div>
                {isSidebarOpen ? (
                  <div className="px-3 text-[11px] font-medium text-muted-foreground dark:text-[#73726E] mb-1.5 uppercase tracking-wider mt-6">
                    Data & Memory
                  </div>
                ) : (
                  <div className="mt-6 border-t border-border/50 dark:border-[#33312E]/50 pt-4" />
                )}
                <div className="space-y-0.5">
                  <Link href="/memory" onClick={() => { if (!isDesktop) setSidebarOpen(false); }}>
                    <NavItem icon={<Zap size={16} />} label="AI Memory" collapsed={!isSidebarOpen} />
                  </Link>
                  <div onClick={handleClearMemory}>
                    <NavItem icon={<Trash size={16} />} label="Clear Memory" collapsed={!isSidebarOpen} />
                  </div>
                  <div onClick={() => { if (confirm("Are you sure you want to delete all chats?")) { clearAllChats(); router.push('/'); } }}>
                    <NavItem icon={<Trash2 size={16} />} label="Clear all chats" collapsed={!isSidebarOpen} />
                  </div>
                </div>
              </div>
            </div>

          </div>

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
                        <div className="text-xs text-muted-foreground break-all">{session.user.email}</div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Plan</span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-primary text-primary-foreground dark:bg-[#C36A4F] dark:text-[#1A1918] uppercase tracking-wider">{userData?.plan || session.user.plan || "Free"}</span>
                      </div>


                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/preferences" className="flex items-center justify-center gap-2 py-2 px-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-colors">
                        <Settings size={14} /> Settings
                      </Link>
                      <button onClick={() => signOut()} className="flex items-center justify-center gap-2 py-2 px-3 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium rounded-lg transition-colors">
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
                          {session.user.plan || "Free"} plan
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
        </div>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3A3937;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4A4947;
        }
      `}</style>
    </>
  );
}

function NavItem({ icon, label, badge, collapsed }: { icon: React.ReactNode; label: string; badge?: string; collapsed?: boolean }) {
  return (
    <div className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between px-3'} py-2 rounded-lg text-foreground/90 dark:text-[#D4D2CD] hover:bg-accent dark:hover:bg-[#2A2928] transition-all duration-200 text-[14px] text-left group border border-transparent hover:border-border/50 dark:hover:border-[#33312E]/50 cursor-pointer active:scale-[0.98]`}>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground dark:text-[#8A8985] group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors duration-300 flex-shrink-0">{icon}</span>
        {!collapsed && <span className="font-medium group-hover:translate-x-0.5 transition-transform duration-200 whitespace-nowrap">{label}</span>}
      </div>
      {!collapsed && badge && (
        <span className="text-[10px] bg-muted dark:bg-[#33312E] text-muted-foreground dark:text-[#8A8985] px-1.5 py-0.5 rounded-md group-hover:bg-primary/20 dark:group-hover:bg-[#C36A4F]/20 group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors">
          {badge}
        </span>
      )}
    </div>
  );
}

function RecentItem({ chat, isActive, collapsed, onPin, onDelete }: { chat: any, isActive?: boolean, collapsed?: boolean, onPin?: (e: any) => void, onDelete?: (e: any) => void }) {
  return (
    <Link href={`/c/${chat.id}`} title={collapsed ? chat.title : undefined}>
      <div className={`w-full flex items-center justify-between group ${collapsed ? 'justify-center px-0' : 'px-3'} py-2 rounded-lg transition-all duration-200 text-[13px] text-left cursor-pointer border ${isActive
          ? 'bg-accent dark:bg-[#2A2928] text-foreground dark:text-[#E6E4DF] border-border dark:border-[#33312E] shadow-sm'
          : 'text-muted-foreground dark:text-[#A3A19C] border-transparent hover:bg-accent/60 dark:hover:bg-[#2A2928]/60 hover:text-foreground dark:hover:text-[#E6E4DF] hover:border-border/50 dark:hover:border-[#33312E]/50'
        }`}>
        <div className={`flex items-center gap-2 overflow-hidden min-w-0 ${collapsed ? 'justify-center w-full' : 'flex-1 pr-2'}`}>
          {collapsed ? <MessageSquare size={16} className={isActive ? "text-foreground dark:text-[#E6E4DF]" : "flex-shrink-0"} /> : <span className="truncate">{chat.title}</span>}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onPin} className={`p-1 rounded-md hover:bg-muted dark:hover:bg-[#33312E] transition-colors ${chat.isPinned ? 'text-primary dark:text-[#C36A4F]' : 'text-muted-foreground'}`}>
              <Pin size={12} className={chat.isPinned ? "fill-current" : ""} />
            </button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
