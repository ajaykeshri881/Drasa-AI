import React from "react";
import { Message } from "ai/react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThinkingBlock } from "./bubble/ThinkingBlock";
import { MarkdownContent } from "./bubble/MarkdownContent";
import { ToolInvocationCard } from "./bubble/ToolInvocationCard";
import { MessageActions } from "./bubble/MessageActions";

interface MessageBubbleProps {
  message: Message;
  onViewArtifact?: (code: string) => void;
  activeSponsor?: any;
  showSponsorHighlights?: boolean;
  onShare?: () => void;
}

export function MessageBubble({ message, onViewArtifact, activeSponsor, showSponsorHighlights, onShare }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const toolInvocations =
    (message as any).parts
      ?.filter((p: any) => p.type === "tool-invocation")
      .map((p: any) => p.toolInvocation) ??
    (message as any).toolInvocations ??
    [];

  let displayContent = message.content || "";
  let thinkingContent = "";
  
  const thinkMatch = displayContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    displayContent = displayContent.replace(/<think>([\s\S]*?)(?:<\/think>|$)/, '').trim();
  }

  return (
    <div className={cn("flex w-full py-4 px-4 md:px-0", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex flex-col gap-1", isUser ? "items-end max-w-[85%] md:max-w-[75%]" : "items-start w-full")}>
        
        {/* Action Buttons for AI */}
        {!isUser && (
          <MessageActions onShare={onShare} displayContent={displayContent} />
        )}

        {/* Message Content */}
        <div className={cn(
          "relative break-words", 
          isUser ? "bg-muted/80 dark:bg-[#33312E] text-foreground px-5 py-3 rounded-2xl rounded-tr-sm" : "w-full text-foreground"
        )}>
          <ThinkingBlock 
            thinkingContent={thinkingContent} 
            activeSponsor={activeSponsor} 
            showSponsorHighlights={showSponsorHighlights} 
          />

          {message.experimental_attachments && message.experimental_attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.experimental_attachments.map((attachment, index) => (
                <div key={index} className="relative flex items-center gap-2 bg-background/50 dark:bg-[#2A2928]/50 border border-border/30 dark:border-[#33312E] rounded-xl px-3 py-1.5 text-xs overflow-hidden">
                  {attachment.contentType?.startsWith("image/") ? (
                    <Image src={attachment.url} alt={attachment.name || "Image"} width={40} height={40} className="w-10 h-10 rounded object-cover z-10" />
                  ) : (
                    <FileText size={16} className="text-primary dark:text-[#C36A4F] z-10" />
                  )}
                  <div className="flex flex-col z-10">
                    <span className="text-foreground/80 dark:text-[#D4D2CD] max-w-[150px] truncate font-medium">
                      {attachment.name || "Attachment"}
                    </span>
                    {attachment.contentType && (
                      <span className="text-[10px] text-muted-foreground uppercase opacity-70">
                        {attachment.contentType.split('/')[1] || "FILE"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        <MarkdownContent content={displayContent} />

        {toolInvocations.length > 0 && (
          <div className="space-y-3 mt-2">
            {toolInvocations.map((tool: any) => (
              <ToolInvocationCard 
                key={tool.toolCallId} 
                tool={tool} 
                onViewArtifact={onViewArtifact} 
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
