"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Pin, Trash2, Globe } from "lucide-react";
import { RecentItemProps } from "@/types/sidebar";
import { usePathname, useRouter } from "next/navigation";

export function RecentItem({ chat, isActive, collapsed, onPin, onDelete }: RecentItemProps) {
  return (
    <Link href={`/c/${chat.id}`} title={collapsed ? chat.title : undefined}>
      <div
        className={`w-full flex items-center justify-between group ${
          collapsed ? "justify-center px-0" : "px-3"
        } py-2 rounded-lg transition-all duration-200 text-[13px] text-left cursor-pointer border ${
          isActive
            ? "bg-accent dark:bg-[#2A2928] text-foreground dark:text-[#E6E4DF] border-border dark:border-[#33312E] shadow-sm"
            : "text-muted-foreground dark:text-[#A3A19C] border-transparent hover:bg-accent/60 dark:hover:bg-[#2A2928]/60 hover:text-foreground dark:hover:text-[#E6E4DF] hover:border-border/50 dark:hover:border-[#33312E]/50"
        }`}
      >
        {/* Collapsed: show globe icon for public chats, otherwise chat icon */}
        {collapsed ? (
          <div className="relative flex items-center justify-center w-full">
            {chat.isPublic ? (
              <Globe
                size={16}
                className="text-emerald-500"
              />
            ) : (
              <MessageSquare
                size={16}
                className={isActive ? "text-foreground dark:text-[#E6E4DF]" : "flex-shrink-0"}
              />
            )}
          </div>
        ) : (
          <>
            {/* Expanded: title + public badge */}
            <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1 pr-2">
              {/* Public globe indicator dot */}
              {chat.isPublic && (
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center"
                  title="This chat is public — shared with anyone who has the link"
                >
                  <Globe size={11} className="text-emerald-500" />
                </div>
              )}
              <span className="truncate flex-1">{chat.title}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={onPin}
                className={`p-1 rounded-md hover:bg-muted dark:hover:bg-[#33312E] transition-colors ${
                  chat.isPinned ? "text-primary dark:text-[#C36A4F]" : "text-muted-foreground"
                }`}
                title={chat.isPinned ? "Unpin" : "Pin"}
              >
                <Pin size={12} className={chat.isPinned ? "fill-current" : ""} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

interface SidebarChatListProps {
  isSidebarOpen: boolean;
  isSearchActive: boolean;
  filteredChats: any[];
  activeChatId?: string | null;
  togglePin: (id: string) => void;
  removeChat: (id: string) => void;
}

export function SidebarChatList({
  isSidebarOpen,
  isSearchActive,
  filteredChats,
  activeChatId,
  togglePin,
  removeChat,
}: SidebarChatListProps) {
  const pathname = usePathname();
  const router = useRouter();

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const unpinnedChats = filteredChats.filter((c) => !c.isPinned);

  // Count public chats to show a summary line
  const publicCount = filteredChats.filter((c) => c.isPublic).length;

  return (
    <div>
      {/* Section header */}
      {isSidebarOpen ? (
        <div className="flex items-center justify-between px-3 mb-1.5 mt-4">
          <span className="text-[11px] font-medium text-muted-foreground dark:text-[#73726E] uppercase tracking-wider">
            {isSearchActive ? "Search Results" : "Recent"}
          </span>
          {publicCount > 0 && !isSearchActive && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              title={`${publicCount} chat${publicCount > 1 ? "s are" : " is"} publicly shared`}
            >
              <Globe size={9} />
              {publicCount} public
            </span>
          )}
        </div>
      ) : (
        <div className="mt-4 border-t border-border/50 dark:border-[#33312E]/50 pt-4" />
      )}

      <div className="space-y-0.5">
        {filteredChats.length === 0 ? (
          isSidebarOpen && (
            <div className="px-3 py-4 text-xs text-muted-foreground italic text-center bg-muted/50 dark:bg-[#1A1918]/50 rounded-lg border border-border/30 dark:border-[#2D2C2A]/30">
              {isSearchActive ? "No chats found." : "No recent chats yet."}
            </div>
          )
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <div className="mb-4">
                {isSidebarOpen && (
                  <div className="px-3 text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wider">
                    Pinned
                  </div>
                )}
                {pinnedChats.map((chat) => (
                  <RecentItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChatId === chat.id}
                    collapsed={!isSidebarOpen}
                    onPin={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin(chat.id);
                    }}
                    onDelete={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeChat(chat.id);
                      if (pathname === `/c/${chat.id}`) router.push("/");
                    }}
                  />
                ))}
              </div>
            )}

            {unpinnedChats.length > 0 && (
              <div>
                {isSidebarOpen && pinnedChats.length > 0 && (
                  <div className="px-3 text-[10px] font-medium text-muted-foreground/70 mb-1 uppercase tracking-wider mt-2">
                    Recent
                  </div>
                )}
                {unpinnedChats.slice(0, 5).map((chat) => (
                  <RecentItem
                    key={chat.id}
                    chat={chat}
                    isActive={activeChatId === chat.id}
                    collapsed={!isSidebarOpen}
                    onPin={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      togglePin(chat.id);
                    }}
                    onDelete={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeChat(chat.id);
                      if (pathname === `/c/${chat.id}`) router.push("/");
                    }}
                  />
                ))}
                {unpinnedChats.length > 5 && isSidebarOpen && (
                  <Link
                    href="/chats"
                    className="block text-center mt-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50 dark:hover:bg-[#2A2928]/50"
                  >
                    See more
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
