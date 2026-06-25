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
    if (id) {
      const saved = localStorage.getItem(`drasa_chat_${id}`);
      if (saved) {
        try {
          setLoadedInitialMessages(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved chat messages", e);
        }
      } else {
        toast.error("Chat not found!");
      }
      setActiveChatId(id);
    }
    setIsLoaded(true);
  }, [id, setActiveChatId]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, stop, append } = useChat({
    api: '/api/chat',
    id: chatId,
    initialMessages: loadedInitialMessages,
    body: {
      mode: defaultMode,
      provider: defaultModelId === 'gemini-2.5-flash' || defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
      modelId: defaultModelId,
      chatId,
    },
    onResponse: () => {
      // Handled in useEffect
    },
    onError: (error) => {
      handleChatError(error);
    }
  });

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
      try {
        localStorage.setItem(`drasa_chat_${chatId}`, JSON.stringify(messages));
        
        const existing = chats.find(c => c.id === chatId);
        if (!existing) {
          addChat({
            id: chatId,
            title: messages[0]?.content.slice(0, 30) + (messages[0]?.content.length > 30 ? '...' : '') || 'New Chat',
            mode: defaultMode,
            updatedAt: new Date()
          });
        }
      } catch (e) {
        console.error("Failed to save chat", e);
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
    isLoading,
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
