import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "ai/react";
import { Sparkles, User, Layout, Loader2, Copy, Check, Search, ExternalLink, Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronRight, ChevronDown } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  onViewArtifact?: (code: string) => void;
  activeSponsor?: any;
  showSponsorHighlights?: boolean;
}

export function MessageBubble({ message, onViewArtifact, activeSponsor, showSponsorHighlights }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Collect tool invocations from parts (new AI SDK API) with fallback to legacy property
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

  const [isThinkingOpen, setIsThinkingOpen] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Auto cancel TTS if component unmounts
  React.useEffect(() => {
    return () => {
      if (isPlaying) window.speechSynthesis.cancel();
    };
  }, [isPlaying]);

  const handleTTS = () => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech is not supported in your browser.");
      return;
    }
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Basic markdown stripping for cleaner speech
    const plainText = displayContent.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    // Prefer Indian English voice
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang === 'en-IN')
        || voices.find(v => v.lang.startsWith('en-IN'))
        || voices.find(v => v.lang.startsWith('en'));
      if (indianVoice) utterance.voice = indianVoice;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    };

    setIsPlaying(true);
    // Voices may not be loaded immediately on first call
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        setVoiceAndSpeak();
      };
    }
  };

  return (
    <div
      className={cn(
        "flex w-full px-4 md:px-8 py-6 gap-4 md:gap-6",
        "bg-transparent"
      )}
    >
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-foreground text-background dark:bg-[#3D3B38] flex items-center justify-center dark:text-[#E6E4DF]">
            <User size={18} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#C36A4F]">
            <Sparkles size={24} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Author Name and Actions */}
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-sm text-foreground dark:text-[#E6E4DF]">
            {isUser ? "You" : "Drasa AI"}
          </div>
          {!isUser && displayContent && (
            <button 
              onClick={handleTTS}
              className={`p-1.5 rounded-md transition-colors ${isPlaying ? 'text-primary dark:text-[#C36A4F] bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-[#363532]'}`}
              title={isPlaying ? "Stop speaking" : "Read aloud"}
            >
              {isPlaying ? <Square size={14} className="fill-current" /> : <Volume2 size={14} />}
            </button>
          )}
        </div>
        
        {/* Thinking Content */}
        {thinkingContent && (
          <div className="mb-4 mt-1 border border-border/60 dark:border-[#33312E] bg-muted/20 dark:bg-[#262523]/50 rounded-xl overflow-hidden transition-all duration-300">
            <button 
              onClick={() => setIsThinkingOpen(!isThinkingOpen)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground dark:text-[#A3A19C] dark:hover:text-[#E6E4DF] transition-colors"
            >
              {isThinkingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="flex items-center gap-2">
                <Sparkles size={12} className="text-primary/70 dark:text-[#C36A4F]/70" />
                Thinking Process
              </span>
            </button>
            
            {activeSponsor && showSponsorHighlights !== false && (
              <div className="px-4 py-2 border-t border-border/30 dark:border-[#33312E]/50 bg-gradient-to-r from-primary/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-[#C36A4F] bg-primary/10 dark:bg-[#C36A4F]/20 px-1.5 py-0.5 rounded shrink-0">
                    Sponsor
                  </span>
                  <span className="text-xs font-medium text-foreground dark:text-[#E6E4DF] shrink-0">{activeSponsor.title}</span>
                  <span className="text-xs text-muted-foreground dark:text-[#8A8985] sm:ml-0.5">{activeSponsor.description && `- ${activeSponsor.description}`}</span>
                </div>
                {activeSponsor.linkUrl && (
                  <a 
                    href={activeSponsor.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[11px] font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 shrink-0"
                  >
                    {activeSponsor.linkText || "Learn More"} <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}

            {isThinkingOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-border/30 dark:border-[#33312E]/50">
                <div className="prose dark:prose-invert max-w-none text-[13px] leading-relaxed text-muted-foreground dark:text-[#A3A19C] italic">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {thinkingContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Markdown Content */}
        {displayContent && (
          <div className="prose dark:prose-invert max-w-none text-[15px] leading-relaxed text-foreground/90 dark:text-[#D4D2CD] prose-p:leading-relaxed mb-4">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }: any) {
                  // react-markdown v10+: detect inline vs block by presence of language class
                  const match = /language-(\w+)/.exec(className || '');
                  const isBlock = Boolean(match);
                  
                  if (isBlock) {
                    const codeString = String(children).replace(/\n$/, '');
                    return (
                      <CodeBlock match={match} codeString={codeString} className={className} props={props}>
                        {children}
                      </CodeBlock>
                    );
                  }
                  return (
                    <code className="bg-muted dark:bg-[#262523] px-1.5 py-0.5 rounded-md text-[13px] font-mono border border-border/50 dark:border-[#33312E]/50 text-foreground dark:text-[#E6E4DF]" {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool Invocations — sourced from message.parts (AI SDK v3.4+) */}
        {toolInvocations.length > 0 && (
          <div className="space-y-3 mt-2">
            {toolInvocations.map((tool: any) => {
              if (tool.toolName === "generate_website") {
                const isGenerating = tool.state === "call" || !('result' in tool);
                return (
                  <div key={tool.toolCallId} className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl p-4 max-w-sm flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-primary/10 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F] rounded-lg flex-shrink-0">
                        {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Layout size={24} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-foreground dark:text-white truncate">Website Builder</h4>
                        <p className="text-xs text-muted-foreground dark:text-[#8A8985] truncate">
                          {isGenerating ? "Generating code..." : "Website generated."}
                        </p>
                      </div>
                    </div>
                    {!isGenerating && tool.args && 'html' in tool.args && onViewArtifact && (
                      <div className="flex items-center gap-2 mt-1">
                        <button 
                          onClick={() => onViewArtifact(tool.args.html)}
                          className="flex-1 py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary dark:text-[#C36A4F] dark:bg-[#C36A4F]/10 dark:hover:bg-[#C36A4F]/20 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} /> View Live Website
                        </button>
                        <a
                          href={`data:text/html;charset=utf-8,${encodeURIComponent(tool.args.html)}`}
                          download="index.html"
                          className="py-2 px-3 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground dark:bg-[#33312E] dark:hover:bg-[#403E3B] text-sm font-medium rounded-lg transition-colors flex items-center justify-center"
                          title="Download HTML"
                        >
                          <Copy size={16} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              }
              if (tool.toolName === "internet_search") {
                const isSearching = tool.state === "call" || !('result' in tool);
                const args = tool.args as { query?: string };
                
                if (isSearching) {
                  return (
                    <div key={tool.toolCallId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[11px] font-medium mt-1">
                      <Loader2 size={12} className="animate-spin" />
                      Searching the web for "{args?.query || '...'}"
                    </div>
                  );
                }

                // Ensure we have results
                const results = Array.isArray(tool.result) ? tool.result : [];
                
                return (
                  <div key={tool.toolCallId} className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl p-3 max-w-md flex flex-col gap-2 shadow-sm my-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md flex-shrink-0">
                          <Search size={14} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-semibold text-foreground dark:text-white truncate">Searched {results.length} sites</h4>
                        </div>
                      </div>
                    </div>
                    {results.length > 0 && (
                      <div className="border-t border-border/50 dark:border-[#33312E]/50 pt-2 mt-1">
                        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {results.map((r: any, idx: number) => (
                            <a 
                              key={idx} 
                              href={r.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-[11px] hover:bg-muted/50 dark:hover:bg-[#32302D]/50 p-1 rounded-md transition-colors group"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0" />
                              <span className="text-foreground dark:text-[#E6E4DF] truncate max-w-[200px]">{r.title}</span>
                              <span className="text-muted-foreground dark:text-[#8A8985] truncate flex-1 group-hover:text-blue-500 transition-colors">- {new URL(r.url).hostname.replace('www.', '')}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              if (tool.toolName === "store_memory") {
                const isWorking = tool.state === "call" || !('result' in tool);
                return (
                  <div key={tool.toolCallId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F] border border-primary/20 dark:border-[#C36A4F]/30 rounded-full text-[11px] font-medium mt-1">
                    {isWorking ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {isWorking ? "Updating memory..." : "Memory updated"}
                  </div>
                );
              }
              // Generic fallback for any other tool
              const isWorking = tool.state === "call" || !('result' in tool);
              return (
                <div key={tool.toolCallId} className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl p-3 max-w-sm flex items-center gap-3 shadow-sm opacity-80">
                  <div className="p-2 bg-muted text-muted-foreground dark:bg-[#33312E] rounded-lg flex-shrink-0">
                    {isWorking ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-foreground dark:text-white truncate">{tool.toolName}</h4>
                    <p className="text-[10px] text-muted-foreground dark:text-[#8A8985] truncate">
                      {isWorking ? "Using tool..." : "Tool completed"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CodeBlock({ match, codeString, className, children, props }: any) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-4 border border-border dark:border-[#33312E] shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/80 dark:bg-[#262523] border-b border-border dark:border-[#33312E]">
        <span className="text-[12px] font-medium text-muted-foreground dark:text-[#8A8985] font-mono lowercase">{match ? match[1] : 'text'}</span>
        <button 
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] transition-colors p-1.5 rounded-md hover:bg-background dark:hover:bg-[#32302D] flex items-center gap-1.5"
          title="Copy code"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          <span className={`text-[11px] font-medium transition-opacity ${copied ? 'opacity-100 text-green-500' : 'opacity-0 group-hover:opacity-100'}`}>
            {copied ? 'Copied!' : 'Copy'}
          </span>
        </button>
      </div>
      <div className="p-4 bg-card dark:bg-[#1A1918] overflow-x-auto text-[13px] font-mono leading-relaxed custom-scrollbar">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}
