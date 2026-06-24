import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatMetadata {
  id: string;
  title: string;
  mode: string;
  updatedAt: Date;
  isPinned?: boolean;
}

interface ChatState {
  chats: ChatMetadata[];
  activeChatId: string | null;
  isSidebarOpen: boolean;
  isTemporaryChat: boolean;
  setChats: (chats: ChatMetadata[]) => void;
  setActiveChatId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setIsTemporaryChat: (isTemporary: boolean) => void;
  addChat: (chat: ChatMetadata) => void;
  removeChat: (id: string) => void;
  clearAllChats: () => void;
  togglePin: (id: string) => void;
  limitError: { title: string; message: string; isUpgrade: boolean } | null;
  setLimitError: (error: { title: string; message: string; isUpgrade: boolean } | null) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
  chats: [],
  activeChatId: null,
  isSidebarOpen: true,
  isTemporaryChat: false,
  setChats: (chats) => set({ chats }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setIsTemporaryChat: (isTemporary) => set({ isTemporaryChat: isTemporary }),
  addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
  removeChat: (id) =>
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== id),
      activeChatId: state.activeChatId === id ? null : state.activeChatId,
    })),
  clearAllChats: () => set({ chats: [], activeChatId: null }),
  togglePin: (id) => set((state) => ({
    chats: state.chats.map((c) => c.id === id ? { ...c, isPinned: !c.isPinned } : c)
  })),
  limitError: null,
  setLimitError: (error) => set({ limitError: error }),
  }),
  {
    name: 'drasa-chat-storage',
    partialize: (state) => ({ 
      chats: state.chats,
      activeChatId: state.activeChatId,
      isSidebarOpen: state.isSidebarOpen,
      isTemporaryChat: state.isTemporaryChat
    }),
  }
));
