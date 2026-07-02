import React from 'react';
import { Loader2, Layout, ExternalLink, Copy, Search, Check } from 'lucide-react';

interface ToolInvocationCardProps {
  tool: any;
  onViewArtifact?: (code: string) => void;
}

export function ToolInvocationCard({ tool, onViewArtifact }: ToolInvocationCardProps) {
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
          Searching the web for &quot;{args?.query || '...'}&quot;
        </div>
      );
    }

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
  
  const isWorking = tool.state === "call" || !('result' in tool);
  return (
    <div key={tool.toolCallId} className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl p-3 max-w-sm flex items-center gap-3 shadow-sm opacity-80">
      <div className="p-2 bg-muted text-muted-foreground dark:bg-[#33312E] rounded-lg flex-shrink-0">
        {isWorking ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-semibold text-foreground dark:text-white truncate">{tool.toolName}</h4>
        <p className="text-[10px] text-muted-foreground dark:text-[#8A8985] truncate">
          {isWorking ? "Using tool..." : "Tool completed"}
        </p>
      </div>
    </div>
  );
}
