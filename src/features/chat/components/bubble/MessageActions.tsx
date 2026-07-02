import React from "react";
import { Volume2, Square, Share2 } from "lucide-react";
import { useTTS } from "../../hooks/use-tts";

interface MessageActionsProps {
  onShare?: () => void;
  displayContent: string;
}

export function MessageActions({ onShare, displayContent }: MessageActionsProps) {
  const { isPlaying, handleTTS } = useTTS(displayContent);

  if (!onShare && !displayContent) return null;

  return (
    <div className="flex items-center justify-end w-full gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onShare && (
        <button
          onClick={onShare}
          className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-[#363532]"
          title="Share this chat (publicly visible)"
        >
          <Share2 size={14} />
        </button>
      )}
      {displayContent && (
        <button 
          onClick={handleTTS}
          className={`p-1.5 rounded-md transition-colors ${isPlaying ? 'text-primary dark:text-[#C36A4F] bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-[#363532]'}`}
          title={isPlaying ? "Stop speaking" : "Read aloud"}
        >
          {isPlaying ? <Square size={14} className="fill-current" /> : <Volume2 size={14} />}
        </button>
      )}
    </div>
  );
}
