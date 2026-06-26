import { useState, useEffect } from 'react';
import { useChat, Message } from 'ai/react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { toast } from 'sonner';
import { handleChatError } from '@/lib/errors/chat-error-handler';

interface UseChatSessionProps {
  id?: string;
  initialMessages?: Message[];
}

export function useChatSession({ id, initialMessages = [] }: UseChatSessionProps = {}) {
  const { defaultMode, defaultModelId } = useSettingsStore();
  const { isTemporaryChat, chats, addChat, setActiveChatId } = useChatStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [artifactCode, setArtifactCode] = useState("");

  const [chatId] = useState(() => {
    if (id) return id;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(7);
  });

  const [loadedInitialMessages, setLoadedInitialMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    async function loadChat() {
      if (id) {
        try {
          const res = await fetch(`/api/chats/${id}`);
          if (res.ok) {
            const data = await res.json();
            setLoadedInitialMessages(data.messages || []);
            if (data.chat?.status === "generating") {
              setIsPolling(true);
            }
          } else {
            const currentChats = useChatStore.getState().chats;
            const existsLocally = currentChats.some(c => c.id === id);
            if (!existsLocally) {
              toast.error("Chat not found!");
            }
          }
        } catch (e) {
          console.error("Failed to fetch saved chat messages", e);
        }
        setActiveChatId(id);
      }
      setIsLoaded(true);
    }
    loadChat();
  }, [id, setActiveChatId]);



  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, stop, append, setMessages } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages: loadedInitialMessages,
    body: {
      mode: defaultMode,
      provider: defaultModelId === 'gemini-2.5-flash' || defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
      modelId: defaultModelId,
      chatId,
      isTemporaryChat,
    },
    onResponse: () => {
      // Handled in useEffect
    },
    onError: (error) => {
      handleChatError(error);
    },
    fetch: async (url, options) => {
      // Remove signal to prevent aborting the stream when unmounting (background generation)
      const { signal, ...rest } = options || {};
      return fetch(url, rest);
    }
  });

  useEffect(() => {
    if (!isPolling || !id) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages) {
            setMessages(data.messages);
          }
          if (data.chat?.status !== "generating") {
            setIsPolling(false);
          }
        }
      } catch (e) {
        console.error("Failed to poll chat:", e);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isPolling, id, setMessages]);

  // Watch for generate_website tool invocations and save to local storage
  useEffect(() => {
    if (!isLoaded || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      const toolParts = (lastMessage as any).parts
        ?.filter((p: any) => p.type === 'tool-invocation')
        .map((p: any) => p.toolInvocation) ??
        (lastMessage as any).toolInvocations ?? [];

      const websiteTool = toolParts.find((t: any) => t.toolName === 'generate_website');
      if (websiteTool && websiteTool.args?.html) {
        setIsArtifactOpen(true);
        setArtifactCode(websiteTool.args.html);
      }
    }

    if (!isTemporaryChat) {
      const existing = chats.find(c => c.id === chatId);
      
      if (!existing && messages.length > 0) {
        addChat({
          id: chatId,
          title: 'New Chat',
          mode: defaultMode,
          updatedAt: new Date()
        });
      }
      
      // Once we have a response from the AI (length >= 2), generate a smart title
      if (existing && existing.title === 'New Chat' && messages.length >= 2) {
        const { setChats } = useChatStore.getState();
        
        // Optimistically update to prevent multiple calls
        setChats(chats.map(c => c.id === chatId ? { ...c, title: 'Generating...' } : c));
        
        fetch('/api/chat/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messages.slice(0, 2), chatId })
        })
        .then(res => res.json())
        .then(data => {
          if (data.title) {
            setChats(useChatStore.getState().chats.map(c => 
              c.id === chatId ? { ...c, title: data.title } : c
            ));
          } else {
            // Fallback to the first message if AI fails
            setChats(useChatStore.getState().chats.map(c => 
              c.id === chatId ? { ...c, title: messages[0]?.content.slice(0, 30) } : c
            ));
          }
        }).catch(() => {
           // Fallback to the first message if API fails
           setChats(useChatStore.getState().chats.map(c => 
             c.id === chatId ? { ...c, title: messages[0]?.content.slice(0, 30) } : c
           ));
        });
      }
    }
  }, [messages, chatId, defaultMode, isLoaded, isTemporaryChat, chats, addChat]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return {
    chatId,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isLoading || isPolling,
    setInput,
    stop,
    append,
    isArtifactOpen,
    setIsArtifactOpen,
    artifactCode,
    setArtifactCode,
    handleSuggestionClick,
    isLoaded
  };
}
