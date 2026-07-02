"use client";

import React, { useEffect, useState } from "react";
import { Users, MessageSquare, Zap, Activity, Loader2, TrendingUp, Clock, ArrowUpRight, IndianRupee, Server } from "lucide-react";

interface ServiceStatus {
  name: string;
  status: string;
}

interface QueueStat {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  error?: string;
}

interface DashboardStats {
  totalUsers: number;
  activeProPlans: number;
  messagesToday: number;
  systemErrorRate: string;
  totalRevenue: number;
  totalPayments: number;
  redisStatus: string;
  redisLatency: number;
  queueStats: Record<string, QueueStat>;
  services: ServiceStatus[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">Overview Dashboard</h1>
        <p className="text-muted-foreground dark:text-[#8A8985]">Real-time statistics and performance metrics for Drasa AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard isLoading={isLoading} icon={<Users size={22} />} title="Total Users" value={stats?.totalUsers.toLocaleString() ?? "0"} trend="All time" color="blue" />
        <StatCard isLoading={isLoading} icon={<Zap size={22} />} title="Pro / Ultimate" value={stats?.activeProPlans.toLocaleString() ?? "0"} trend="Paid subscribers" color="orange" />
        <StatCard isLoading={isLoading} icon={<MessageSquare size={22} />} title="Messages Today" value={stats?.messagesToday.toLocaleString() ?? "0"} trend="Usage today" color="green" />
        <StatCard isLoading={isLoading} icon={<IndianRupee size={22} />} title="Total Revenue" value={stats ? `₹${stats.totalRevenue.toLocaleString()}` : "₹0"} trend={`${stats?.totalPayments || 0} payments`} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Queue Monitor Panel */}
        <div className="col-span-2 bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground dark:text-[#E6E4DF]">BullMQ Queue Status</h3>
              <p className="text-xs text-muted-foreground dark:text-[#73726E] mt-0.5">Live job metrics across all queues</p>
            </div>
            <span className="text-[11px] text-muted-foreground dark:text-[#73726E] bg-muted dark:bg-[#33312E] px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <Server size={10} /> Auto-refresh 30s
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : stats?.queueStats ? (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.queueStats).map(([name, stat]) => (
                <div key={name} className="p-4 rounded-xl border border-border/50 dark:border-[#33312E]/50 bg-muted/20 dark:bg-[#1A1918]/50">
                  <h4 className="text-sm font-medium text-foreground/90 dark:text-[#D4D2CD] mb-3">{name.replace('Queue', '')}</h4>
                  {stat.error ? (
                    <p className="text-xs text-red-500">Error fetching stats</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground dark:text-[#73726E]">Waiting</span>
                        <span className="font-mono text-amber-500">{stat.waiting}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground dark:text-[#73726E]">Active</span>
                        <span className="font-mono text-blue-500">{stat.active}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground dark:text-[#73726E]">Completed</span>
                        <span className="font-mono text-green-500">{stat.completed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground dark:text-[#73726E]">Failed</span>
                        <span className="font-mono text-red-500">{stat.failed}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No queue data available</p>
          )}
        </div>

        {/* System Status Panel */}
        <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground dark:text-[#E6E4DF]">System Status</h3>
            <p className="text-xs text-muted-foreground dark:text-[#73726E] mt-0.5">Service health at a glance</p>
          </div>

          <div className="space-y-3 flex-1">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
              </div>
            ) : (
              (stats?.services || []).map(({ name, status }) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50 last:border-0">
                  <span className="text-sm text-foreground/90 dark:text-[#D4D2CD]">{name}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    status === "operational" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                    status === "degraded" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                    status === "down" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                    "bg-muted text-muted-foreground dark:bg-[#33312E]"
                  }`}>
                    {status}
                  </span>
                </div>
              ))
            )}
          </div>

          {stats?.redisLatency !== undefined && stats.redisLatency >= 0 && (
            <div className="text-[11px] text-muted-foreground dark:text-[#73726E] flex items-center gap-1.5 bg-muted/30 dark:bg-[#33312E]/30 px-3 py-1.5 rounded-lg">
              <Activity size={12} />
              Redis latency: {stats.redisLatency}ms
            </div>
          )}

          <div className="text-[11px] text-muted-foreground dark:text-[#73726E] flex items-center gap-1.5">
            <Clock size={12} />
            Error rate: {stats?.systemErrorRate ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, title, value, trend, isLoading, color
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
  isLoading: boolean;
  color: "blue" | "orange" | "green" | "red";
}) {
  const colors = {
    blue:   "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    orange: "bg-primary/10 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F]",
    green:  "bg-green-500/10 text-green-600 dark:text-green-400",
    red:    "bg-red-500/10 text-red-500 dark:text-red-400",
  };

  return (
    <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>{icon}</div>
        <ArrowUpRight size={16} className="text-muted-foreground dark:text-[#73726E] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-2xl font-bold text-foreground dark:text-white mb-1">
        {isLoading ? <Loader2 size={20} className="animate-spin text-muted-foreground" /> : value}
      </div>
      <div className="text-sm font-medium text-muted-foreground dark:text-[#8A8985]">{title}</div>
      <div className="text-xs text-muted-foreground/60 dark:text-[#73726E] mt-1">{trend}</div>
    </div>
  );
}
