import { useState, useEffect } from 'react';
import { useChat, Message } from 'ai/react';
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { toast } from 'sonner';
import { handleChatError } from '@/lib/errors/chat-error-handler';
import { useSession } from "next-auth/react";

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
  }, [id, setActiveChatId, isTemporaryChat]);



  const { data: session } = useSession();
  const [fallbackCount, setFallbackCount] = useState(0);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, stop, append, setMessages, reload } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages: loadedInitialMessages,
    body: {
      mode: defaultMode,
      provider: defaultModelId === 'gemini-3.5-flash' || defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
      modelId: defaultModelId,
      chatId,
      isTemporaryChat,
    },
    onResponse: () => {
      // Handled in useEffect
    },
    onError: (error) => {
      let errorMessage = error.message || "";
      try {
        const parsed = JSON.parse(errorMessage);
        errorMessage = parsed.details || parsed.error || errorMessage;
      } catch (e) {}

      const errorString = errorMessage.toLowerCase();
      const isProxyRateLimit = errorString.includes("too many requests. please try again later") && !errorString.includes("primary:");
      
      // Auto-fallback mechanism
      if (
        (errorString.includes("high demand") || 
         errorString.includes("both primary and fallback") || 
         errorString.includes("service unavailable") ||
         errorString.includes("model provider server issue") ||
         errorString.includes("model provider rate limit") ||
         errorString.includes("too many requests") ||
         errorString.includes("429")) && 
         !isProxyRateLimit &&
         fallbackCount === 0
      ) {
        const isGemini = defaultModelId.includes('gemini');
        const fallbackProvider = isGemini ? "openrouter" : "gemini";
        const fallbackModelId = isGemini ? "openai/gpt-oss-120b:free" : "gemini-3.5-flash";
        const fallbackName = isGemini ? "GPT-OSS" : "Gemini";
        
        const userPlan = session?.user?.plan || "free";
        const isPremium = userPlan !== "free";
        
        const toastMsg = isPremium 
          ? `High demand on current engine. Auto-switched to ${fallbackName}.`
          : "Model is busy. Automatically retrying with a fallback model...";
          
        toast.info(toastMsg, { duration: 5000 });
        setFallbackCount(1);
        
        // Update the UI model selector to reflect the change
        useSettingsStore.getState().setDefaultModelId(fallbackModelId);
        
        setTimeout(() => {
          reload({
            body: {
              mode: defaultMode,
              provider: fallbackProvider,
              modelId: fallbackModelId,
              chatId,
              isTemporaryChat,
            }
          });
        }, 1500);
        
        return;
      }

      setFallbackCount(0); // Reset on other errors
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
        
        // If we are on the root page, update the URL without a full reload
        // so that refreshing the page keeps them in this chat.
        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          window.history.replaceState({}, '', `/c/${chatId}`);
        }
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
