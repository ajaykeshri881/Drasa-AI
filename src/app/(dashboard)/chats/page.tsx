"use client";

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { useChatStore } from "@/store/useChatStore";
import Link from 'next/link';
import { MessageSquare, Trash2, Search, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AllChatsPage() {
  const { chats, removeChat, clearAllChats } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(10);

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeChat(id);
    localStorage.removeItem(`drasa_chat_${id}`);
    toast.success("Chat deleted");
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all chats? This cannot be undone.")) {
      chats.forEach(chat => localStorage.removeItem(`drasa_chat_${chat.id}`));
      clearAllChats();
      toast.success("All chats deleted");
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto w-full pt-16 relative z-10 bg-background/50 dark:bg-[#1A1918]/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground dark:text-[#E6E4DF] mb-2">All Chats</h1>
              <p className="text-muted-foreground dark:text-[#8A8985] text-sm">Manage your conversation history</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-[#8A8985]" />
                <input 
                  type="text" 
                  placeholder="Search chats..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-lg text-sm w-full md:w-[240px] focus:outline-none focus:border-primary dark:focus:border-[#C36A4F] transition-colors"
                />
              </div>
              <button 
                onClick={handleClearAll}
                disabled={chats.length === 0}
                className="px-4 py-2 shrink-0 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-transparent dark:border-red-900/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            </div>
          </div>

          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/50 dark:bg-[#2A2928]/50 border border-border/50 dark:border-[#33312E]/50 rounded-2xl mx-4 md:mx-0">
              <MessageSquare size={48} className="text-muted-foreground/30 dark:text-[#8A8985]/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-2">No chats found</h3>
              <p className="text-muted-foreground dark:text-[#8A8985] text-sm text-center max-w-sm">
                {searchQuery ? "Try adjusting your search terms." : "You haven't started any conversations yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full gap-4">
              <div className="grid gap-3 w-full">
                {filteredChats.slice(0, displayCount).map(chat => (
                  <Link 
                    key={chat.id} 
                    href={`/c/${chat.id}`}
                    className="group flex items-center justify-between p-4 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] hover:border-border/80 dark:hover:border-[#4A4946] rounded-xl transition-all duration-200 hover:shadow-sm overflow-hidden"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 dark:bg-[#C36A4F]/10 flex items-center justify-center flex-shrink-0 text-primary dark:text-[#C36A4F]">
                        <MessageSquare size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-foreground dark:text-[#E6E4DF] truncate text-[14px] sm:text-[15px] mb-1 group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors">
                          {chat.title}
                        </h3>
                        <div className="flex items-center gap-3 text-[11px] sm:text-xs text-muted-foreground dark:text-[#8A8985]">
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar size={12} />
                            {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {chat.mode && (
                            <span className="px-2 py-0.5 rounded-md bg-muted dark:bg-[#33312E] capitalize shrink-0">
                              {chat.mode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => handleDelete(e, chat.id)}
                        className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive dark:text-[#8A8985] dark:hover:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete chat"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="p-1.5 sm:p-2 hidden sm:block text-muted-foreground dark:text-[#8A8985]">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
              {displayCount < filteredChats.length && (
                <button
                  onClick={() => setDisplayCount(prev => prev + 10)}
                  className="px-6 py-2.5 mt-2 bg-muted dark:bg-[#33312E] hover:bg-muted/80 dark:hover:bg-[#4A4946] text-foreground dark:text-[#E6E4DF] rounded-xl text-sm font-medium transition-colors"
                >
                  Load more chats ({filteredChats.length - displayCount} remaining)
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
}
