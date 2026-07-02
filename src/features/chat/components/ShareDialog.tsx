"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Lock,
  Copy,
  Check,
  X,
  Share2,
  ExternalLink,
  Loader2,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useChatStore } from "@/features/chat/store/useChatStore";

interface ShareDialogProps {
  chatId: string;
  isTemporaryChat: boolean;
  onClose: () => void;
}

export function ShareDialog({ chatId, isTemporaryChat, onClose }: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const { chats, setChats } = useChatStore();

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${chatId}`
      : `/share/${chatId}`;

  // Fetch current sharing state on mount
  useEffect(() => {
    if (isTemporaryChat) {
      setIsLoading(false);
      return;
    }
    fetch(`/api/chats/${chatId}`)
      .then((r) => r.json())
      .then((data) => {
        setIsPublic(data?.chat?.isPublic ?? false);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [chatId, isTemporaryChat]);

  const handleToggle = useCallback(async () => {
    if (isToggling || isTemporaryChat) return;
    setIsToggling(true);
    const next = !isPublic;
    // Optimistic update
    setIsPublic(next);

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: next }),
      });

      if (!res.ok) {
        // Revert on failure
        setIsPublic(!next);
        toast.error("Failed to update sharing settings.");
      } else {
        const data = await res.json();
        setIsPublic(data.isPublic);

        // Sync isPublic back into the chat store so sidebar/list badges update
        setChats(chats.map(c => c.id === chatId ? { ...c, isPublic: data.isPublic } : c));

        toast.success(data.isPublic ? "Chat is now public" : "Chat is now private");
      }
    } catch {
      setIsPublic(!next);
      toast.error("Network error. Please try again.");
    } finally {
      setIsToggling(false);
    }
  }, [chatId, isPublic, isToggling, isTemporaryChat, chats, setChats]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [shareUrl]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-md bg-card dark:bg-[#1E1C1A] border border-border dark:border-[#33312E] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border dark:border-[#2D2C2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-[#C36A4F]/10 flex items-center justify-center text-primary dark:text-[#C36A4F]">
              <Share2 size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-foreground dark:text-[#E6E4DF]">Share Chat</h2>
              <p className="text-[11px] text-muted-foreground dark:text-[#8A8985]">Control who can view this conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-[#2A2928] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Temporary chat warning */}
          {isTemporaryChat ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <EyeOff size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Temporary chats cannot be shared</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Temporary chats are not saved. Start a regular chat to share it.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Public notice banner — shown when currently private (about to be made public) */}
              {!isPublic && !isLoading && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/8 border border-blue-500/20 dark:border-blue-500/15">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                  <p className="text-[12px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    <span className="font-semibold">Heads up:</span> Enabling sharing will make this chat{" "}
                    <span className="font-semibold">publicly visible</span> to anyone with the link — including people who are not signed in.
                  </p>
                </div>
              )}

              {/* Toggle Section */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 dark:bg-[#252321] border border-border/50 dark:border-[#2D2C2A]">
                <div className="flex items-center gap-3">
                  {isLoading ? (
                    <div className="w-9 h-9 rounded-full bg-muted dark:bg-[#33312E] flex items-center justify-center">
                      <Loader2 size={16} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : isPublic ? (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Globe size={18} />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted dark:bg-[#33312E] flex items-center justify-center text-muted-foreground">
                      <Lock size={18} />
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-semibold text-foreground dark:text-[#E6E4DF]">
                      {isLoading ? "Loading..." : isPublic ? "Public — Anyone with the link" : "Private — Only you"}
                    </p>
                    <p className="text-[11px] text-muted-foreground dark:text-[#8A8985] mt-0.5">
                      {isPublic
                        ? "Anyone with the link can view this chat"
                        : "Only you can access this chat"}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={handleToggle}
                  disabled={isLoading || isToggling}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPublic
                      ? "bg-emerald-500"
                      : "bg-muted dark:bg-[#33312E]"
                  }`}
                  role="switch"
                  aria-checked={isPublic}
                  id="share-toggle"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPublic ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                  {isToggling && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Loader2 size={12} className="animate-spin text-white" />
                    </span>
                  )}
                </button>
              </div>

              {/* Share URL box — visible when public */}
              <div
                className={`transition-all duration-300 ${
                  isPublic ? "opacity-100 max-h-48" : "opacity-0 max-h-0 overflow-hidden"
                }`}
              >
                {isPublic && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-muted-foreground dark:text-[#8A8985] uppercase tracking-wider">
                      Share link
                    </p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/60 dark:bg-[#252321] border border-border dark:border-[#33312E] group">
                      <Globe size={14} className="text-emerald-500 flex-shrink-0" />
                      <span className="flex-1 text-[12px] text-foreground dark:text-[#C8C6C1] font-mono truncate">
                        {shareUrl}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={handleCopy}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background dark:hover:bg-[#1A1918] transition-colors"
                          title="Copy link"
                          id="copy-share-link"
                        >
                          {copied ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background dark:hover:bg-[#1A1918] transition-colors"
                          title="Open in new tab"
                          id="open-share-link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>

                    {/* Make private note */}
                    <p className="text-[11px] text-muted-foreground dark:text-[#8A8985]">
                      Viewers see the conversation read-only.{" "}
                      <button
                        onClick={handleToggle}
                        disabled={isToggling}
                        className="underline underline-offset-2 hover:text-foreground dark:hover:text-[#E6E4DF] transition-colors disabled:opacity-50"
                      >
                        Make private
                      </button>{" "}
                      anytime to revoke access.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5">
          {!isTemporaryChat && isPublic ? (
            <button
              onClick={handleCopy}
              id="share-copy-btn"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary dark:bg-[#C36A4F] hover:bg-primary/90 dark:hover:bg-[#B35E45] text-white font-medium text-sm transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted dark:bg-[#252321] hover:bg-muted/80 dark:hover:bg-[#2D2B29] text-foreground dark:text-[#E6E4DF] font-medium text-sm transition-colors border border-border dark:border-[#33312E]"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
