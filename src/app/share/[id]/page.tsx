"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Lock, ArrowRight, MessageSquare, Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/features/chat/components/bubble/MarkdownContent";

interface SharedMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

interface SharedChat {
  _id: string;
  title: string;
  model: string;
  mode: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

function SharedMessageBubble({ message, ownerName }: { message: SharedMessage; ownerName?: string }) {
  const isUser = message.role === "user";

  // Strip <think> blocks from display
  let displayContent = message.content || "";
  displayContent = displayContent.replace(/<think>[\s\S]*?(?:<\/think>|$)/, "").trim();

  if (!displayContent && message.role !== "user") return null;

  return (
    <div className={cn("flex w-full py-4 px-4 md:px-8", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex flex-col gap-1 max-w-[85%] md:max-w-[75%]", isUser ? "items-end" : "items-start w-full")}>
        
        {isUser && (
          <div className="text-xs font-medium text-muted-foreground dark:text-[#8A8985] mb-1 px-1">
            {ownerName || "User"}
          </div>
        )}

        <div className={cn(
          "relative break-words text-sm leading-relaxed", 
          isUser ? "bg-muted/80 dark:bg-[#33312E] text-foreground px-5 py-3 rounded-2xl rounded-tr-sm" : "w-full text-foreground dark:text-[#C8C6C1]"
        )}>
          <MarkdownContent content={displayContent} />
        </div>
      </div>
    </div>
  );
}

export default function SharedChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [messages, setMessages] = useState<SharedMessage[]>([]);
  const [status, setStatus] = useState<"loading" | "found" | "private" | "not_found">("loading");
  const [ownerName, setOwnerName] = useState<string>("User");
  const [isCloning, setIsCloning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/chats/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          setStatus("not_found");
          return;
        }
        const data = await res.json();
        if (!data.chat?.isPublic) {
          setStatus("private");
          return;
        }
        setChat(data.chat);
        setMessages(
          (data.messages || []).filter((m: SharedMessage) =>
            m.role === "user" || m.role === "assistant"
          )
        );
        setOwnerName(data.ownerName || "User");
        setStatus("found");
      })
      .catch(() => setStatus("not_found"));
  }, [id]);

  const handleCloneChat = async () => {
    try {
      setIsCloning(true);
      const res = await fetch(`/api/chats/${id}/clone`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to clone chat");
      const data = await res.json();
      router.push(`/c/${data.newChatId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to continue conversation");
      setIsCloning(false);
    }
  };

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background dark:bg-[#1A1918] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 size={32} className="animate-spin text-[#C36A4F]" />
          <p className="text-sm">Loading shared chat…</p>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (status === "not_found") {
    return (
      <div className="min-h-screen bg-background dark:bg-[#1A1918] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-muted dark:bg-[#2A2928] flex items-center justify-center mx-auto mb-5">
            <MessageSquare size={32} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground dark:text-[#E6E4DF] mb-2">Chat not found</h1>
          <p className="text-muted-foreground dark:text-[#8A8985] text-sm mb-6">
            This shared chat doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-[#C36A4F] hover:bg-primary/90 dark:hover:bg-[#B35E45] text-white rounded-xl font-medium text-sm transition-colors"
          >
            <MessageCircle size={16} />
            Try Drasa AI
          </Link>
        </div>
      </div>
    );
  }

  // ── Private chat ──
  if (status === "private") {
    return (
      <div className="min-h-screen bg-background dark:bg-[#1A1918] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-muted dark:bg-[#2A2928] flex items-center justify-center mx-auto mb-5">
            <Lock size={32} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground dark:text-[#E6E4DF] mb-2">This chat is private</h1>
          <p className="text-muted-foreground dark:text-[#8A8985] text-sm mb-6">
            The owner has made this conversation private. The link is no longer accessible.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-[#C36A4F] hover:bg-primary/90 dark:hover:bg-[#B35E45] text-white rounded-xl font-medium text-sm transition-colors"
          >
            <MessageCircle size={16} />
            Start your own conversation
          </Link>
        </div>
      </div>
    );
  }

  // ── Found: render chat ──
  return (
    <div className="min-h-screen bg-background dark:bg-[#1A1918] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border dark:border-[#2D2C2A] bg-background/80 dark:bg-[#1A1918]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#C36A4F]/10 flex items-center justify-center text-[#C36A4F] font-bold">
              D
            </div>
            <span className="font-semibold text-[14px] text-foreground dark:text-[#E6E4DF]">Drasa AI</span>
          </Link>

          {/* Chat meta */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium shrink-0">
              <Globe size={11} />
              Public
            </div>
            <span className="text-[13px] text-foreground dark:text-[#C8C6C1] font-medium truncate max-w-[200px] sm:max-w-xs">
              {chat?.title || "Shared Chat"}
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={handleCloneChat}
            disabled={isCloning}
            id="shared-chat-cta"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary dark:bg-[#C36A4F] hover:bg-primary/90 dark:hover:bg-[#B35E45] text-white text-[12px] font-medium transition-colors disabled:opacity-50"
          >
            {isCloning ? <Loader2 size={14} className="animate-spin" /> : (
              <>
                <span className="hidden sm:inline">Continue Chat</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-3xl mx-auto w-full py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <MessageSquare size={36} className="mb-3 opacity-40" />
            <p className="text-sm">No messages to display</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((message) => (
              <SharedMessageBubble key={message.id} message={message} ownerName={ownerName} />
            ))}
          </div>
        )}
      </main>

      {/* Footer CTA */}
      <footer className="sticky bottom-0 z-20 border-t border-border dark:border-[#2D2C2A] bg-background/80 dark:bg-[#1A1918]/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground dark:text-[#8A8985]">
            This is a read-only view. Want to continue this conversation?
          </p>
          <button
            onClick={handleCloneChat}
            disabled={isCloning}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary dark:bg-[#C36A4F] hover:bg-primary/90 dark:hover:bg-[#B35E45] text-white text-[13px] font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isCloning ? <Loader2 size={14} className="animate-spin" /> : <MessageCircle size={14} />}
            Continue chatting
          </button>
        </div>
      </footer>
    </div>
  );
}
