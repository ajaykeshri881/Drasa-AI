import React from "react";
import { Paperclip, Mic, MicOff, Headset } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/feedback/tooltip";

interface InputActionsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  toggleVoiceInput: () => void;
  setIsVoiceModeActive: (active: boolean) => void;
}

export function InputActions({
  fileInputRef,
  isUploading,
  handleFileUpload,
  isRecording,
  toggleVoiceInput,
  setIsVoiceModeActive
}: InputActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.webm"
        onChange={handleFileUpload}
        className="hidden"
        id="file-upload-input"
      />
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`p-1.5 rounded-lg transition-colors ${
            isUploading 
              ? 'text-primary dark:text-[#C36A4F] animate-pulse cursor-wait' 
              : 'text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-accent dark:hover:bg-[#363532]'
          }`}
        >
          <Paperclip size={18} />
        </TooltipTrigger>
        <TooltipContent>{isUploading ? "Uploading..." : "Attach file (PDF, image, doc)"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={toggleVoiceInput}
          className={`p-1.5 rounded-lg transition-colors ${
            isRecording
              ? 'text-red-500 bg-red-500/10 animate-pulse'
              : 'text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-accent dark:hover:bg-[#363532]'
          }`}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </TooltipTrigger>
        <TooltipContent>{isRecording ? "Stop recording" : "Voice dictation"}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          type="button"
          onClick={() => setIsVoiceModeActive(true)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary dark:text-[#8A8985] dark:hover:text-[#C36A4F] hover:bg-primary/10 transition-colors"
        >
          <Headset size={18} />
        </TooltipTrigger>
        <TooltipContent>Start Continuous Voice Mode</TooltipContent>
      </Tooltip>
    </div>
  );
}
