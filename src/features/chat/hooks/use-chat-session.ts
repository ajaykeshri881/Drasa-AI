'use client';

import { useState, useEffect, useMemo } from 'react';
import { useChat, Chat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';

import { useSettingsStore } from '@/features/settings/store/useSettingsStore';
import { useChatStore } from '@/features/chat/store/useChatStore';
import { toast } from 'sonner';
import { handleChatError } from '@/lib/errors/chat-error-handler';
import { useSession } from "next-auth/react";
import { useNetworkStatus } from '@/hooks/use-network-status';

interface UseChatSessionProps {
  id?: string;
  initialMessages?: UIMessage[];
}

export function useChatSession({ id, initialMessages = [] }: UseChatSessionProps = {}) {
  const { defaultMode, defaultModelId, customInstructions, isCustomInstructionsEnabled } = useSettingsStore();
  const { isTemporaryChat, chats, addChat, setActiveChatId, queueUnsyncedChat, syncOfflineChats, unsyncedChats } = useChatStore();
  const { isOffline } = useNetworkStatus();
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

  const [loadedInitialMessages, setLoadedInitialMessages] = useState<UIMessage[]>(initialMessages);

  // Input state managed locally (v7 Chat class doesn't own input)
  const [input, setInput] = useState('');

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

  // useChat handles UIMessageStream correctly and resets status natively
  const { messages, status, sendMessage: originalAppend, stop: originalStop, setMessages } = useChat({
    id: chatId,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        mode: defaultMode,
        provider: "gemini",
        modelId: defaultModelId,
        chatId,
        isTemporaryChat,
        isOffline,
        customInstructions: isCustomInstructionsEnabled ? customInstructions : undefined,
      },
    }),
    onError: (error: Error) => {
      let errorMessage = error.message || "";
      try {
        const parsed = JSON.parse(errorMessage);
        errorMessage = parsed.details || parsed.error || errorMessage;
      } catch (e) { }

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
          errorString.includes("forbidden") ||
          errorString.includes("not found") ||
          errorString.includes("not supported") ||
          errorString.includes("not exist") ||
          errorString.includes("403") ||
          errorString.includes("bad request") ||
          errorString.includes("400") ||
          errorString.includes("429")) &&
        !isProxyRateLimit
      ) {
        if (fallbackCount < 2) {
          let fallbackModelId = "gemini-3.1-flash-lite";
          let fallbackName = "Standard";

          if (defaultModelId === 'gemini-3.5-flash') {
            fallbackModelId = 'gemini-3.1-flash-lite';
            fallbackName = 'Standard';
          } else if (defaultModelId === 'gemini-3.1-flash-lite') {
            fallbackModelId = 'gemini-3.5-flash';
            fallbackName = 'Advance';
          } else {
            fallbackModelId = 'gemini-3.1-flash-lite';
            fallbackName = 'Standard';
          }

          const isUnavailable = errorString.includes("not found") || errorString.includes("not supported") || errorString.includes("not exist") || errorString.includes("forbidden") || errorString.includes("403") || errorString.includes("bad request") || errorString.includes("400");
          const toastMsg = isUnavailable
            ? `Model temporarily unavailable. Auto-switched to ${fallbackName} model.`
            : `High demand on current model. Auto-switched to ${fallbackName} model.`;

          toast.info(toastMsg, { duration: 5000 });
          setFallbackCount(prev => prev + 1);

          // Update the UI model selector to reflect the change
          useSettingsStore.getState().setDefaultModelId(fallbackModelId);
          return;
        } else {
          // Total failure (exhausted all models)
          setFallbackCount(0);

          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            parts: [{ type: 'text', text: "We are currently experiencing exceptionally high demand across all our AI models, and we apologize for the interruption. An automated alert has already been dispatched and we are working actively to resolve this. For further assistance, please contact us at ajaykeshriofficial@gmail.com." }],
          } as UIMessage]);

          // Call API to create system alert for admins
          fetch('/api/admin/alerts/system', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: "System Critical: All AI Models Failed",
              message: "All fallback models were exhausted due to rate limits or high demand.",
              type: "emergency",
              priority: "critical"
            })
          }).catch(console.error);

          return;
        }
      }

      setFallbackCount(0); // Reset on other errors
      handleChatError(error);
    },
  });

  // Load existing messages when fetched from DB
  useEffect(() => {
    if (isLoaded && loadedInitialMessages.length > 0 && messages.length === 0) {
      setMessages(loadedInitialMessages);
    }
  }, [isLoaded, loadedInitialMessages, setMessages, messages.length]);

  const stop = () => {
    setIsPolling(false);
    originalStop();
  };

  // Derive isLoading and other helpers from status
  const isLoading = status === 'streaming' || status === 'submitted';

  // Check offline constraints
  const checkOfflineConstraints = () => {
    if (isOffline && !defaultModelId.startsWith('ollama/')) {
      if (window.innerWidth < 768) {
        toast.error("Please connect to a network. Ollama models are not available on mobile devices, use a laptop/PC for offline local models.");
      } else {
        toast.error("You are offline. Switch to Ollama if set up. (You can set up Ollama models to use locally).");
      }
      return false;
    }
    return true;
  };

  // Append helper: send a new user message
  const append = async (message: { role: 'user'; content: string; experimental_attachments?: any[] }, options?: { body?: Record<string, any> }) => {
    if (!checkOfflineConstraints()) return null;
    const text = typeof message.content === 'string' ? message.content : '';
    await originalAppend({
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      parts: [{ type: 'text', text }],
      ...(message.experimental_attachments ? { experimental_attachments: message.experimental_attachments } : {}),
    } as any, options);
    return null;
  };

  // Submit handler
  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!checkOfflineConstraints()) return;
    const text = input.trim();
    setInput('');
    originalAppend({ id: crypto.randomUUID(), role: 'user', content: text, parts: [{ type: 'text', text }] } as any);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

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

  // Handle offline queue and sync
  useEffect(() => {
    if (!isOffline && Object.keys(unsyncedChats).length > 0) {
      syncOfflineChats();
    }
  }, [isOffline, unsyncedChats, syncOfflineChats]);

  // Watch for generate_website tool invocations and save to local storage
  useEffect(() => {
    if (!isLoaded || messages.length === 0) return;

    // Queue for offline sync if offline
    if (isOffline && !isTemporaryChat) {
      queueUnsyncedChat(chatId, {
        title: chats.find(c => c.id === chatId)?.title || 'Offline Chat',
        mode: defaultMode,
        modelId: defaultModelId,
        messages: messages
      });
    }

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

        if (typeof window !== 'undefined' && window.location.pathname === '/') {
          window.history.replaceState({}, '', `/c/${chatId}`);
        }
      }

      // Once we have a response from the AI (length >= 2), generate a smart title
      if (existing && existing.title === 'New Chat' && messages.length >= 2) {
        const { setChats } = useChatStore.getState();

        setChats(chats.map(c => c.id === chatId ? { ...c, title: 'Generating...' } : c));

        const firstUserMsg = messages[0];
        const firstUserText = (firstUserMsg as any)?.parts?.find((p: any) => p.type === 'text')?.text || (firstUserMsg as any)?.content || '';

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
              setChats(useChatStore.getState().chats.map(c =>
                c.id === chatId ? { ...c, title: firstUserText.slice(0, 30) } : c
              ));
            }
          }).catch(() => {
            setChats(useChatStore.getState().chats.map(c =>
              c.id === chatId ? { ...c, title: firstUserText.slice(0, 30) } : c
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
