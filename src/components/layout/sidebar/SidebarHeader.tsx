"use client";

import React from "react";
import Link from "next/link";
import { Search, PanelLeftClose } from "lucide-react";

interface SidebarHeaderProps {
  visualSidebarOpen: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SidebarHeader({
  visualSidebarOpen,
  isSidebarOpen,
  setSidebarOpen,
  isSearchActive,
  setIsSearchActive,
  searchQuery,
  setSearchQuery
}: SidebarHeaderProps) {
  return (
    <div className={`flex items-center ${!visualSidebarOpen ? 'justify-center' : 'justify-between'} px-4 py-3 min-h-[52px]`}>
      {visualSidebarOpen && !isSearchActive && (
        <Link href="/" className="font-serif text-[17px] tracking-wide font-medium text-foreground dark:text-[#E6E4DF] whitespace-nowrap">
          Drasa AI
        </Link>
      )}
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
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hover:text-foreground dark:hover:text-[#E6E4DF] transition-colors p-1">
          <PanelLeftClose size={18} strokeWidth={2} className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
