"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Send, History, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface AlertData {
  _id: string;
  type: string;
  priority: string;
  message: string;
  isActive: boolean;
  targetPlans: string[];
  createdAt: string;
  createdBy: {
    name?: string;
    email: string;
  };
}

export default function AdminAlertsPage() {
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical">("info");
  const [targetPlans, setTargetPlans] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity, message, targetPlans: targetPlans.length > 0 ? targetPlans : undefined }),
      });

      if (res.ok) {
        toast.success(`Broadcast sent: [${severity.toUpperCase()}]`);
        setMessage("");
        setTargetPlans([]);
        fetchAlerts(); // Refresh list
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send broadcast");
      }
    } catch (error) {
      console.error("Broadcast failed:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (alertId: string) => {
    try {
      const res = await fetch(`/api/admin/alerts?id=${alertId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Alert deactivated");
        setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, isActive: false } : a));
      } else {
        toast.error("Failed to deactivate alert");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const togglePlanTarget = (plan: string) => {
    setTargetPlans(prev => prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">System Broadcasts</h1>
        <p className="text-muted-foreground dark:text-[#8A8985]">Send emergency alerts or system maintenance notifications to all active users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border dark:border-[#33312E]">
            <AlertTriangle className="text-primary dark:text-[#C36A4F]" size={20} />
            <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF]">New Broadcast</h2>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground/90 dark:text-[#D4D2CD] mb-2">Severity Level</label>
              <div className="grid grid-cols-3 gap-3">
                {(['info', 'warning', 'critical'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium capitalize border transition-all ${
                      severity === sev 
                        ? sev === 'critical' ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400' 
                        : sev === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
                        : 'bg-transparent border-border dark:border-[#33312E] text-muted-foreground dark:text-[#73726E] hover:border-border/80 dark:hover:border-[#4A4946]'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/90 dark:text-[#D4D2CD] mb-2">Target Plans <span className="text-xs text-muted-foreground">(leave empty for all)</span></label>
              <div className="flex gap-2">
                {['free', 'pro', 'ultimate'].map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => togglePlanTarget(plan)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                      targetPlans.includes(plan)
                        ? 'bg-primary/10 border-primary/50 text-primary dark:bg-[#C36A4F]/10 dark:border-[#C36A4F]/50 dark:text-[#C36A4F]'
                        : 'bg-transparent border-border dark:border-[#33312E] text-muted-foreground dark:text-[#73726E]'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/90 dark:text-[#D4D2CD] mb-2">Message</label>
              <textarea 
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g., We are experiencing degraded performance on the OpenAI API. Please use Gemini temporarily."
                className="w-full p-3 bg-card dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-xl text-sm text-foreground dark:text-[#E6E4DF] placeholder:text-muted-foreground focus:border-primary dark:focus:border-[#4A4946] focus:ring-1 focus:ring-primary dark:focus:ring-[#4A4946] outline-none transition-all resize-none"
              />
            </div>

            <button 
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="w-full py-3 px-4 bg-primary dark:bg-[#C36A4F] hover:bg-primary/90 dark:hover:bg-[#B35A3F] disabled:bg-muted dark:disabled:bg-[#33312E] disabled:text-muted-foreground dark:disabled:text-[#73726E] text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Broadcast Now</>}
            </button>
          </form>
        </div>

        <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border dark:border-[#33312E]">
            <History className="text-muted-foreground dark:text-[#8A8985]" size={20} />
            <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF]">Recent Broadcasts</h2>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent broadcasts
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert._id} className={`p-4 rounded-xl border ${alert.isActive ? 'border-border/50 dark:border-[#33312E]/50 bg-muted/20 dark:bg-[#1A1918]/50' : 'border-border/30 dark:border-[#33312E]/30 bg-muted/10 dark:bg-[#1A1918]/30 opacity-60'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        alert.priority === 'critical' ? 'text-red-600 dark:text-red-400 bg-red-500/10' :
                        alert.priority === 'high' || alert.priority === 'medium' ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                        'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                      }`}>
                        {alert.priority}
                      </span>
                      {!alert.isActive && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">inactive</span>
                      )}
                      {alert.targetPlans && alert.targetPlans.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          → {alert.targetPlans.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground dark:text-[#73726E]">
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>
                      {alert.isActive && (
                        <button
                          onClick={() => handleDeactivate(alert._id)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors rounded"
                          title="Deactivate alert"
                        >
                          <XCircle size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/90 dark:text-[#D4D2CD] mb-2">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 text-right">By {alert.createdBy?.name || alert.createdBy?.email || 'Unknown'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
