"use client";

import React, { useState, useEffect } from "react";
import { Server, Loader2, RefreshCw, RotateCcw, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Timer } from "lucide-react";
import { toast } from "sonner";

interface QueueJob {
  id: string;
  name: string;
  state: string;
  progress: number;
  failedReason?: string;
  timestamp: number;
  finishedOn?: number;
}

interface QueueData {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  recentJobs: QueueJob[];
  error?: string;
}

export default function AdminQueuesPage() {
  const [queueStats, setQueueStats] = useState<Record<string, QueueData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/queues");
      if (res.ok) {
        const data = await res.json();
        setQueueStats(data.queueStats);
      }
    } catch (error) {
      console.error("Failed to fetch queue stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (queueName: string, jobId: string) => {
    setActionLoading(`retry-${jobId}`);
    try {
      const res = await fetch("/api/admin/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", queueName, jobId }),
      });
      if (res.ok) {
        toast.success(`Job ${jobId} retried`);
        fetchStats();
      } else {
        toast.error("Failed to retry job");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClean = async (queueName: string) => {
    if (!window.confirm(`Clean all failed jobs from ${queueName}?`)) return;
    setActionLoading(`clean-${queueName}`);
    try {
      const res = await fetch("/api/admin/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clean", queueName }),
      });
      if (res.ok) {
        toast.success(`Failed jobs cleaned from ${queueName}`);
        fetchStats();
      } else {
        toast.error("Failed to clean queue");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const stateIcon = (state: string) => {
    switch (state) {
      case "completed": return <CheckCircle size={14} className="text-green-500" />;
      case "failed": return <XCircle size={14} className="text-red-500" />;
      case "active": return <Loader2 size={14} className="text-blue-500 animate-spin" />;
      case "waiting": return <Clock size={14} className="text-amber-500" />;
      case "delayed": return <Timer size={14} className="text-purple-500" />;
      default: return <AlertCircle size={14} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">Queue Monitor</h1>
          <p className="text-muted-foreground dark:text-[#8A8985]">Real-time BullMQ queue metrics and job management.</p>
        </div>
        <button
          onClick={() => { setIsLoading(true); fetchStats(); }}
          disabled={isLoading}
          className="p-2.5 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#363532] rounded-xl transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && Object.keys(queueStats).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm">Loading queue statistics...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(queueStats).map(([name, data]) => (
            <div key={name} className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl shadow-sm overflow-hidden">
              {/* Queue Header */}
              <div className="p-6 border-b border-border dark:border-[#33312E]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F]">
                      <Server size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-foreground dark:text-[#E6E4DF]">{name.replace('Queue', ' Queue')}</h3>
                      <p className="text-xs text-muted-foreground dark:text-[#73726E]">Auto-refreshes every 10s</p>
                    </div>
                  </div>
                  {data.failed > 0 && (
                    <button
                      onClick={() => handleClean(name)}
                      disabled={actionLoading === `clean-${name}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={12} /> Clean Failed
                    </button>
                  )}
                </div>

                {data.error ? (
                  <p className="text-sm text-red-500">Error: {data.error}</p>
                ) : (
                  <div className="grid grid-cols-5 gap-4">
                    {[
                      { label: "Waiting", value: data.waiting, color: "text-amber-500" },
                      { label: "Active", value: data.active, color: "text-blue-500" },
                      { label: "Completed", value: data.completed, color: "text-green-500" },
                      { label: "Failed", value: data.failed, color: "text-red-500" },
                      { label: "Delayed", value: data.delayed, color: "text-purple-500" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-3 rounded-xl bg-muted/30 dark:bg-[#1A1918]/50">
                        <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
                        <div className="text-[10px] text-muted-foreground dark:text-[#73726E] uppercase tracking-wider mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Jobs */}
              {data.recentJobs && data.recentJobs.length > 0 && (
                <div className="p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground dark:text-[#8A8985] uppercase tracking-wider mb-3">Recent Jobs</h4>
                  <div className="space-y-2">
                    {data.recentJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 dark:hover:bg-[#363532]/30 transition-colors">
                        <div className="flex items-center gap-3">
                          {stateIcon(job.state)}
                          <div>
                            <span className="text-sm text-foreground/90 dark:text-[#D4D2CD] font-mono">#{job.id}</span>
                            <span className="text-xs text-muted-foreground dark:text-[#73726E] ml-2">{job.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {job.progress > 0 && job.progress < 100 && (
                            <div className="w-20 h-1.5 bg-muted dark:bg-[#33312E] rounded-full overflow-hidden">
                              <div className="h-full bg-primary dark:bg-[#C36A4F] rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                            </div>
                          )}
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            job.state === 'completed' ? 'bg-green-500/10 text-green-500' :
                            job.state === 'failed' ? 'bg-red-500/10 text-red-500' :
                            job.state === 'active' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {job.state}
                          </span>
                          {job.state === 'failed' && (
                            <button
                              onClick={() => handleRetry(name, job.id)}
                              disabled={actionLoading === `retry-${job.id}`}
                              className="p-1 text-muted-foreground hover:text-primary dark:hover:text-[#C36A4F] transition-colors"
                              title="Retry job"
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
