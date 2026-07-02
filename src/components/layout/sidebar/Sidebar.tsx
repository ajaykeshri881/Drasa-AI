"use client";

import React, { useEffect, useState } from "react";
import { useChatStore } from "@/features/chat/store/useChatStore";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSession } from "next-auth/react";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav, SidebarDataNav } from "./SidebarNav";
import { SidebarChatList } from "./SidebarChatList";
import { SidebarFooter } from "./SidebarFooter";

export function Sidebar() {
  const { chats, isSidebarOpen, setSidebarOpen, activeChatId, removeChat, togglePin, clearAllChats, loadChats } = useChatStore();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { data: session } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobileInitialized, setIsMobileInitialized] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
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
  useEffect(() => {
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
          <SidebarHeader 
            visualSidebarOpen={visualSidebarOpen}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isSearchActive={isSearchActive}
            setIsSearchActive={setIsSearchActive}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          <div className="flex-1 overflow-y-auto custom-scrollbar mt-2 flex flex-col px-3 pb-4">
            <div className="space-y-6 flex-1">
              <SidebarNav 
                isSidebarOpen={isSidebarOpen} 
                isDesktop={isDesktop} 
                setSidebarOpen={setSidebarOpen}
                clearAllChats={clearAllChats}
              />
              
              <SidebarChatList 
                isSidebarOpen={isSidebarOpen}
                isSearchActive={isSearchActive}
                filteredChats={filteredChats}
                activeChatId={activeChatId}
                togglePin={togglePin}
                removeChat={removeChat}
              />
              
              <SidebarDataNav
                isSidebarOpen={isSidebarOpen} 
                isDesktop={isDesktop} 
                setSidebarOpen={setSidebarOpen}
                clearAllChats={clearAllChats}
              />
            </div>
          </div>

          <SidebarFooter 
            isSidebarOpen={isSidebarOpen} 
            userData={userData}
          />
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
