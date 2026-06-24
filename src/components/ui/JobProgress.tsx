"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";

interface JobProgressProps {
  jobId: string;
  queueName?: string;
  title?: string;
  onComplete?: (result: any) => void;
  onDismiss?: () => void;
}

type JobState = "waiting" | "active" | "completed" | "failed" | "delayed" | "unknown";

export function JobProgress({
  jobId,
  queueName = "DocumentQueue",
  title = "Processing...",
  onComplete,
  onDismiss,
}: JobProgressProps) {
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<JobState>("waiting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}?queue=${queueName}`);
        if (!res.ok) return;

        const data = await res.json();
        
        setState(data.state || "unknown");
        setProgress(data.progress || 0);

        if (data.state === "completed") {
          clearInterval(interval);
          if (onComplete) onComplete(data.result);
        } else if (data.state === "failed") {
          clearInterval(interval);
          setError(data.failedReason || "An unknown error occurred.");
        }
      } catch (err) {
        console.error("Failed to poll job status:", err);
      }
    };

    // Initial poll
    pollStatus();

    // Poll every 1.5 seconds while active/waiting
    if (state === "active" || state === "waiting" || state === "delayed") {
      interval = setInterval(pollStatus, 1500);
    }

    return () => clearInterval(interval);
  }, [jobId, queueName, state, onComplete]);

  const cancelJob = async () => {
    try {
      await fetch(`/api/jobs/${jobId}?queue=${queueName}`, { method: "DELETE" });
      if (onDismiss) onDismiss();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-sm bg-card border border-border dark:border-[#33312E] rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {state === "active" || state === "waiting" ? (
            <Loader2 size={16} className="animate-spin text-primary" />
          ) : state === "completed" ? (
            <CheckCircle2 size={16} className="text-green-500" />
          ) : state === "failed" ? (
            <XCircle size={16} className="text-red-500" />
          ) : null}
          <h4 className="text-sm font-medium text-foreground dark:text-[#E6E4DF]">
            {state === "completed" ? "Completed" : state === "failed" ? "Failed" : title}
          </h4>
        </div>
        
        {(state === "active" || state === "waiting" || state === "failed" || state === "completed") && (
          <button 
            onClick={state === "active" || state === "waiting" ? cancelJob : onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-muted dark:bg-[#33312E] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              state === "failed" ? "bg-red-500" : state === "completed" ? "bg-green-500" : "bg-primary"
            }`}
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {state === "waiting" ? "Queued..." : 
             state === "active" ? `Processing (${progress}%)` : 
             state === "failed" ? error || "Failed" : "Done"}
          </span>
          {state === "active" && <span>{progress}%</span>}
        </div>
      </div>
    </div>
  );
}
