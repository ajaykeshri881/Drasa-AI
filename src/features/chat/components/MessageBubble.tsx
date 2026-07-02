import React from "react";
import { Message } from "ai/react";
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
