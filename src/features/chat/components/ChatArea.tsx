"use client";

import React, { useRef, useEffect, useState } from "react";
import { Message } from "ai/react";
import { MessageBubble } from "./MessageBubble";
import { EyeOff, Share2, Globe } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/features/chat/store/useChatStore";
import { toast } from "sonner";
import { EmptyChatScreen } from "./EmptyChatScreen";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { ShareDialog } from "./ShareDialog";

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onViewArtifact?: (code: string) => void;
}

export function ChatArea({ messages, isLoading, onSuggestionClick, onViewArtifact }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { isTemporaryChat, activeChatId, chats } = useChatStore();
  
  const [hasWarned80, setHasWarned80] = useState(false);
  const [hasWarned90, setHasWarned90] = useState(false);
  const [activeSponsor, setActiveSponsor] = useState<any>(null);
  const [showSponsorHighlights, setShowSponsorHighlights] = useState<boolean>(true);
  const [isThinkingLong, setIsThinkingLong] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Derive current share state from store (updates after loadChats)
  const activeChat = chats.find(c => c.id === activeChatId);
  const isCurrentlyPublic = activeChat?.isPublic ?? false;

  // Only show share UI when there are messages, user is logged in, and chat is not temporary
  const canShare = messages.length > 0 && !isTemporaryChat && !!activeChatId;

  useEffect(() => {
    fetch('/api/sponsors/active')
      .then(res => res.json())
      .then(data => {
        if (data.sponsor) setActiveSponsor(data.sponsor);
      })
      .catch(err => console.error("Failed to fetch active sponsor:", err));
  }, []);

  useEffect(() => {
    if (!isLoading && session?.user?.email) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data?.user?.usage) {
            const usage = data.user.usage;
            const plan = data.user.plan;
            const limits = {
              free: { monthly: 25000 },
              pro: { monthly: 750000 },
              ultimate: { monthly: 2000000 }
            }[plan as string] || { monthly: 25000 };

            const monthlyPercent = ((usage.tokensUsedThisMonth || 0) / limits.monthly) * 100;
            const highestPercent = monthlyPercent;

            if (highestPercent >= 90 && !hasWarned90) {
              toast.warning("Usage Warning: You have reached 90% of your token limit.", { duration: 8000 });
              setHasWarned90(true);
            } else if (highestPercent >= 80 && !hasWarned80) {
              toast.info("Usage Warning: You have reached 80% of your token limit.", { duration: 5000 });
              setHasWarned80(true);
            }
          }

          if (data?.user?.plan === 'pro' || data?.user?.plan === 'ultimate') {
            setShowSponsorHighlights(data.user.preferences?.showSponsorHighlights ?? false);
          } else {
            setShowSponsorHighlights(true);
          }
        })
        .catch(err => console.error("Failed to check usage or preferences:", err));
    }
  }, [isLoading, session]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      setIsThinkingLong(false);
      timeout = setTimeout(() => {
        setIsThinkingLong(true);
      }, 3000);
    } else {
      setIsThinkingLong(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 150;

      if (isScrolledToBottom) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "auto",
        });
      }
    }
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyChatScreen onSuggestionClick={onSuggestionClick} />;
  }

  let loadingText = "Thinking";
  let showLoadingIndicator = isLoading;
  
  if (isLoading && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant') {
      if (lastMsg.content) {
        showLoadingIndicator = false;
      } else {
        const toolParts = (lastMsg as any).parts
          ?.filter((p: any) => p.type === "tool-invocation")
          .map((p: any) => p.toolInvocation) ??
          (lastMsg as any).toolInvocations ?? [];

        if (toolParts.length > 0) {
          const currentTool = toolParts[toolParts.length - 1];
          if (currentTool.toolName === "internet_search") loadingText = "Searching the web";
          else if (currentTool.toolName === "generate_website") loadingText = "Generating website";
          else loadingText = "Using tool";
        }
      }
    }
  }

  return (
    <>
      <div 
        className="flex-1 overflow-y-auto pb-4 custom-scrollbar w-full pt-16 relative z-10" 
        ref={scrollRef}
      >
        {/* Sticky top badges row */}
        {isTemporaryChat && (
          <div className="sticky top-0 z-20 flex justify-center pt-1 pb-2 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-[#C36A4F]/10 border border-primary/30 dark:border-[#C36A4F]/30 text-primary dark:text-[#C36A4F] text-[11px] font-medium shadow-sm backdrop-blur-sm pointer-events-auto">
              <EyeOff size={11} className="animate-pulse" />
              Temporary — not saved
            </div>
          </div>
        )}
        
        <div className="flex flex-col w-full max-w-3xl mx-auto px-4">
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message} 
              onViewArtifact={onViewArtifact} 
              activeSponsor={activeSponsor}
              showSponsorHighlights={showSponsorHighlights}
              onShare={canShare ? () => setIsShareOpen(true) : undefined}
            />
          ))}
          {showLoadingIndicator && (
            <ThinkingIndicator 
              loadingText={loadingText}
              showSponsorHighlights={showSponsorHighlights}
              activeSponsor={activeSponsor}
              isThinkingLong={isThinkingLong}
            />
          )}
        </div>
      </div>

      {/* Share Dialog */}
      {isShareOpen && activeChatId && (
        <ShareDialog
          chatId={activeChatId}
          isTemporaryChat={isTemporaryChat}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </>
  );
}
