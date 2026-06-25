"use client";

import React, { useRef, useEffect, useState } from "react";
import { Message } from "ai/react";
import { MessageBubble } from "./MessageBubble";
import { Sparkles, Terminal, Layout, MessageSquare, Image as ImageIcon, Zap, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/useChatStore";
import { toast } from "sonner";

const ALL_SUGGESTIONS = [
  { mode: "code", icon: <Terminal size={16} />, title: "Help me code", description: "Write a React component with Tailwind", prompt: "Write a React component using Tailwind CSS that displays a user profile card." },
  { mode: "code", icon: <Terminal size={16} />, title: "Debug an error", description: "Fix a tricky TypeScript issue", prompt: "Help me debug a TypeScript error: 'Object is of type unknown'." },
  { mode: "vision", icon: <ImageIcon size={16} />, title: "Analyze UI", description: "Find improvements in a dashboard", prompt: "What are some common UX improvements for a dense data dashboard?" },
  { mode: "reasoning", icon: <Sparkles size={16} />, title: "Explain a concept", description: "Quantum computing for a 5 year old", prompt: "Explain the concept of quantum computing as if I am 5 years old." },
  { mode: "web", icon: <Search size={16} />, title: "Research a topic", description: "Latest Next.js 15 features", prompt: "What are the key new features introduced in Next.js?" },
  { mode: "auto", icon: <Layout size={16} />, title: "Brainstorm ideas", description: "For a new AI SaaS", prompt: "Brainstorm 5 unique features for a new AI SaaS landing page focused on developers." }
];

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  onViewArtifact?: (code: string) => void;
}

export function ChatArea({ messages, isLoading, onSuggestionClick, onViewArtifact }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const { chats } = useChatStore();
  const [greeting, setGreeting] = useState("Hello");
  const [suggestions, setSuggestions] = useState<typeof ALL_SUGGESTIONS>([]);
  const [hasWarned80, setHasWarned80] = useState(false);
  const [hasWarned90, setHasWarned90] = useState(false);
  const [activeSponsor, setActiveSponsor] = useState<any>(null);
  const [showSponsorHighlights, setShowSponsorHighlights] = useState<boolean>(true);
  const [isThinkingLong, setIsThinkingLong] = useState(false);

  useEffect(() => {
    // Fetch active sponsor
    fetch('/api/sponsors/active')
      .then(res => res.json())
      .then(data => {
        if (data.sponsor) setActiveSponsor(data.sponsor);
      })
      .catch(err => console.error("Failed to fetch active sponsor:", err));
  }, []);

  useEffect(() => {
    if (!isLoading && session?.user?.email) {
      // Check limits after message finishes
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data?.user?.usage) {
            const usage = data.user.usage;
            const plan = data.user.plan;
            const limits = {
              free: { daily: 2000, monthly: 25000 },
              starter: { daily: 5000, monthly: 150000 },
              pro: { daily: 30000, monthly: 750000 },
              ultimate: { daily: 100000, monthly: 2000000 },
              premium: { daily: 100000, monthly: 2000000 }
            }[plan as string] || { daily: 2000, monthly: 25000 };

            const dailyPercent = (usage.tokensUsedToday / limits.daily) * 100;
            const monthlyPercent = (usage.tokensUsedThisMonth / limits.monthly) * 100;
            const highestPercent = Math.max(dailyPercent, monthlyPercent);

            if (highestPercent >= 90 && !hasWarned90) {
              toast.warning("Usage Warning: You have reached 90% of your token limit.", { duration: 8000 });
              setHasWarned90(true);
            } else if (highestPercent >= 80 && !hasWarned80) {
              toast.info("Usage Warning: You have reached 80% of your token limit.", { duration: 5000 });
              setHasWarned80(true);
            }
          }

          // Check sponsor visibility preference
          if (data?.user?.plan === 'pro' || data?.user?.plan === 'ultimate') {
            setShowSponsorHighlights(data.user.preferences?.showSponsorHighlights ?? false);
          } else {
            // Free and starter users always see it if enabled globally
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
    try {
      if (!chats || chats.length === 0) {
        // Fallback for no history
        setSuggestions([...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 4));
        return;
      }

      // 1. Determine favorite mode from chat history
      const modeCounts = chats.reduce((acc, chat) => {
        if (chat?.mode) {
          acc[chat.mode] = (acc[chat.mode] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const modes = Object.keys(modeCounts);
      if (modes.length === 0) {
        setSuggestions([...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 4));
        return;
      }

      const favoriteMode = modes.reduce((a, b) => modeCounts[a] > modeCounts[b] ? a : b);

      // 2. Shuffle and pick suggestions (prioritize favorite mode)
      const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
      const favoriteSuggestions = shuffled.filter(s => s.mode === favoriteMode);
      const otherSuggestions = shuffled.filter(s => s.mode !== favoriteMode);

      // Pick up to 2 from favorite, fill rest with others to get exactly 4
      const selected = [...favoriteSuggestions.slice(0, 2), ...otherSuggestions].slice(0, 4);
      
      // Shuffle final 4 so the favorite ones aren't always first
      setSuggestions(selected.sort(() => 0.5 - Math.random()));
    } catch (error) {
      // Ultimate fallback if any issue occurs
      console.warn("Could not calculate suggestion preferences, falling back to random:", error);
      setSuggestions([...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 4));
    }
  }, [chats]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good evening");
    else setGreeting("Good night");
  }, []);

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
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-[10vh] relative z-10 h-full mt-14">
        {/* Ambient background glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-[#C36A4F]/5 rounded-full blur-[100px] pointer-events-none animate-pulse" 
          style={{ animationDuration: '4s' }}
        ></div>

        <h1 className="text-4xl md:text-[44px] font-serif text-foreground dark:text-[#E6E4DF] mb-8 flex items-center justify-center gap-3 tracking-tight drop-shadow-sm">
          <Sparkles size={32} className="text-primary dark:text-[#C36A4F] animate-pulse" style={{ animationDuration: '3s' }} />
          {greeting}, {session?.user?.name ? session.user.name.split(' ')[0] : "there"}
        </h1>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 w-full max-w-[600px] px-4">
          {suggestions.map((s, i) => (
            <SuggestionCard 
              key={i}
              icon={s.icon} 
              title={s.title} 
              description={s.description}
              onClick={() => onSuggestionClick?.(s.prompt)} 
            />
          ))}
        </div>
      </div>
    );
  }

  let loadingText = "Thinking...";
  let showLoadingIndicator = isLoading;
  
  if (isLoading && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant') {
      if (lastMsg.content) {
        // If it already has text, hide the standalone loading indicator
        showLoadingIndicator = false;
      } else {
        // Check parts (new SDK API) first, fall back to legacy toolInvocations
        const toolParts = (lastMsg as any).parts
          ?.filter((p: any) => p.type === "tool-invocation")
          .map((p: any) => p.toolInvocation) ??
          (lastMsg as any).toolInvocations ?? [];

        if (toolParts.length > 0) {
          const currentTool = toolParts[toolParts.length - 1];
          if (currentTool.toolName === "internet_search") loadingText = "Searching the web...";
          else if (currentTool.toolName === "generate_website") loadingText = "Generating website...";
          else loadingText = "Using tool...";
        }
      }
    }
  }

  return (
    <div 
      className="flex-1 overflow-y-auto pb-4 custom-scrollbar w-full pt-16 relative z-10" 
      ref={scrollRef}
    >
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onViewArtifact={onViewArtifact} 
            activeSponsor={activeSponsor}
            showSponsorHighlights={showSponsorHighlights}
          />
        ))}
        {showLoadingIndicator && (
          <div className="flex w-full px-4 md:px-8 py-6 gap-4 md:gap-6 bg-muted/30 dark:bg-[#1A1918]">
             <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary dark:text-[#C36A4F]">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-muted-foreground dark:text-[#8A8985] italic tracking-wide">
                  {loadingText}
                </span>
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground dark:bg-[#8A8985] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground dark:bg-[#8A8985] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-muted-foreground dark:bg-[#8A8985] rounded-full animate-bounce"></span>
                </span>
              </div>
              
              {showSponsorHighlights && activeSponsor && isThinkingLong && (
                <div className="ml-auto flex items-start sm:items-center border border-border dark:border-[#33312E] bg-background dark:bg-[#262523] rounded-lg px-3 py-2 gap-2 shadow-sm animate-in fade-in zoom-in duration-300 w-full md:w-auto md:max-w-[70%]">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider flex-shrink-0 mt-0.5 sm:mt-0">Partner</span>
                  <div className="hidden sm:block h-3 w-px bg-border mx-1 flex-shrink-0"></div>
                  {activeSponsor.linkUrl ? (
                    <a href={activeSponsor.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary dark:text-[#C36A4F] hover:underline flex items-start sm:items-center gap-1.5 flex-wrap">
                      <span className="shrink-0">{activeSponsor.title}</span> 
                      <span className="text-[11px] text-muted-foreground font-normal sm:ml-0.5">{activeSponsor.description && `- ${activeSponsor.description}`}</span>
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-foreground dark:text-[#E6E4DF] flex items-start sm:items-center gap-1.5 flex-wrap">
                      <span className="shrink-0">{activeSponsor.title}</span> 
                      <span className="text-[11px] text-muted-foreground font-normal sm:ml-0.5">{activeSponsor.description && `- ${activeSponsor.description}`}</span>
                    </span>
                  )}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function SuggestionCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-start text-left p-4 bg-card dark:bg-[#262523]/80 hover:bg-accent dark:hover:bg-[#32302D] rounded-xl border border-border dark:border-[#33312E] transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
    >
      <div className="flex items-center gap-2 text-foreground dark:text-[#E6E4DF] font-medium text-[14px] mb-1 group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors">
        <span className="text-muted-foreground dark:text-[#8A8985] group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors">{icon}</span>
        {title}
      </div>
      <div className="text-[12px] text-muted-foreground dark:text-[#8A8985] line-clamp-1">
        {description}
      </div>
    </button>
  );
}
