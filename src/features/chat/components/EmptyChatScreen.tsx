import React, { useEffect, useState, useRef } from "react";
import { Terminal, Layout, MessageSquare, Image as ImageIcon, Zap, Search, EyeOff, Lightbulb } from "lucide-react";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/features/chat/store/useChatStore";

const ALL_SUGGESTIONS = [
  { mode: "code", icon: <Terminal size={16} />, title: "Help me code", description: "Write a React component with Tailwind", prompt: "Write a React component using Tailwind CSS that displays a user profile card." },
  { mode: "code", icon: <Terminal size={16} />, title: "Debug an error", description: "Fix a tricky TypeScript issue", prompt: "Help me debug a TypeScript error: 'Object is of type unknown'." },
  { mode: "vision", icon: <ImageIcon size={16} />, title: "Analyze UI", description: "Find improvements in a dashboard", prompt: "What are some common UX improvements for a dense data dashboard?" },
  { mode: "reasoning", icon: <Lightbulb size={16} />, title: "Explain a concept", description: "Quantum computing for a 5 year old", prompt: "Explain the concept of quantum computing as if I am 5 years old." },
  { mode: "web", icon: <Search size={16} />, title: "Research a topic", description: "Latest Next.js 15 features", prompt: "What are the key new features introduced in Next.js?" },
  { mode: "auto", icon: <Layout size={16} />, title: "Brainstorm ideas", description: "For a new AI SaaS", prompt: "Brainstorm 5 unique features for a new AI SaaS landing page focused on developers." }
];

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

interface EmptyChatScreenProps {
  onSuggestionClick?: (suggestion: string) => void;
}

export function EmptyChatScreen({ onSuggestionClick }: EmptyChatScreenProps) {
  const { data: session } = useSession();
  const { chats, isTemporaryChat } = useChatStore();
  const [greeting, setGreeting] = useState("Hello");
  const [suggestions, setSuggestions] = useState<typeof ALL_SUGGESTIONS>([]);
  const hasInitializedSuggestions = useRef(false);

  useEffect(() => {
    if (hasInitializedSuggestions.current && suggestions.length > 0) return;

    try {
      if (!chats || chats.length === 0) {
        setSuggestions([...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 4));
        return;
      }

      const modeCounts = chats.reduce((acc: Record<string, number>, chat: any) => {
        if (chat?.mode) {
          acc[chat.mode] = (acc[chat.mode] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const modes = Object.keys(modeCounts);
      if (modes.length === 0) {
        if (suggestions.length === 0) {
          setSuggestions([...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 4));
        }
        return;
      }

      const favoriteMode = modes.reduce((a, b) => modeCounts[a] > modeCounts[b] ? a : b);

      const shuffled = [...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random());
      const favoriteSuggestions = shuffled.filter(s => s.mode === favoriteMode);
      const otherSuggestions = shuffled.filter(s => s.mode !== favoriteMode);

      const selected = [...favoriteSuggestions.slice(0, 2), ...otherSuggestions].slice(0, 4);
      setSuggestions(selected.sort(() => 0.5 - Math.random()));
      hasInitializedSuggestions.current = true;
    } catch (error) {
      if (suggestions.length === 0) {
        setSuggestions([...ALL_SUGGESTIONS].sort(() => 0.5 - Math.random()).slice(0, 4));
      }
      hasInitializedSuggestions.current = true;
    }
  }, [chats]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good morning");
    else if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17 && hour < 21) setGreeting("Good evening");
    else setGreeting("Good night");
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-[10vh] relative z-10 h-full mt-14">
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 dark:bg-[#C36A4F]/5 rounded-full blur-[100px] pointer-events-none animate-pulse" 
        style={{ animationDuration: '4s' }}
      ></div>

      {isTemporaryChat && (
        <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-[#C36A4F]/10 border border-primary/30 dark:border-[#C36A4F]/30 text-primary dark:text-[#C36A4F] text-[12px] font-medium shadow-sm z-20 whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-300">
          <EyeOff size={13} className="animate-pulse" />
          Temporary Chat — messages won&apos;t be saved & memory is off
        </div>
      )}

      <h1 className="text-4xl md:text-[44px] font-serif text-foreground dark:text-[#E6E4DF] mb-8 flex items-center justify-center gap-3 tracking-tight drop-shadow-sm">
        {greeting}{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ""}
      </h1>

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
