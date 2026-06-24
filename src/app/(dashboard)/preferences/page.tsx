"use client";

import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useChatStore } from "@/store/useChatStore";
import { AI_MODES } from "@/lib/ai/prompts/modes";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Download, Trash2, Shield, Keyboard, Zap, Sparkles, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export default function PreferencesPage() {
  const { defaultMode, setDefaultMode, enterToSend, setEnterToSend } = useSettingsStore();
  const { clearAllChats } = useChatStore();
  const { theme, setTheme } = useTheme();
  const { data: session, update } = useSession();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  React.useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) setUserData(data.user);
        })
        .catch(err => console.error("Failed to fetch user data", err));
    }
  }, [session]);

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to delete all local data? This includes your chats and preferences. This action cannot be undone.")) {
      clearAllChats();
      localStorage.clear();
      toast.success("All local data has been cleared.");
      window.location.href = "/";
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm("Are you sure you want to cancel your subscription and turn off Auto-pay? You will be immediately downgraded to the Free plan.")) {
      setIsCancelling(true);
      try {
        const res = await fetch("/api/payments/cancel", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          toast.success("Subscription cancelled successfully.");
          setUserData({ ...userData, plan: "free", razorpaySubscriptionId: null });
          if (session) {
            await update({ ...session, user: { ...session.user, plan: "free" } });
          }
        } else {
          toast.error(data.error || "Failed to cancel subscription");
        }
      } catch (err) {
        toast.error("An error occurred while cancelling.");
      } finally {
        setIsCancelling(false);
      }
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const chats = useChatStore.getState().chats;
      const fullData = chats.map(chat => {
        const history = localStorage.getItem(`drasa_chat_${chat.id}`);
        return {
          ...chat,
          messages: history ? JSON.parse(history) : []
        };
      });

      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drasa-ai-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully!");
    } catch (e) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto w-full pt-16 relative z-10 bg-background/50 dark:bg-[#1A1918]/50">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-20">
          
          <div className="mb-10">
            <h1 className="text-3xl font-serif font-medium text-foreground dark:text-[#E6E4DF] mb-2 flex items-center gap-3">
              <SettingsIcon size={28} className="text-primary dark:text-[#C36A4F]" />
              Preferences
            </h1>
            <p className="text-muted-foreground dark:text-[#8A8985] text-sm">Customize your Drasa AI experience</p>
          </div>

          <div className="space-y-8">
            {/* Usage & Limits Section */}
            {userData && (
              <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] flex items-center gap-2">
                    <Activity size={18} className="text-primary dark:text-[#C36A4F]" />
                    Usage & Limits
                  </h2>
                  <div className="text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary dark:text-[#C36A4F] uppercase tracking-wider">
                    {userData.plan} Plan
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Monthly Tokens */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground dark:text-[#E6E4DF] font-medium">Monthly Tokens</span>
                      <span className="text-muted-foreground dark:text-[#8A8985]">
                        {((userData.usage?.tokensUsedThisMonth || 0) / 1000).toFixed(1)}k / {userData.plan === 'ultimate' ? '2M' : userData.plan === 'pro' ? '750k' : userData.plan === 'starter' ? '150k' : '25k'}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted dark:bg-[#1A1918] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary dark:bg-[#C36A4F] transition-all duration-500 ease-out rounded-full"
                        style={{ 
                          width: `${Math.min(100, ((userData.usage?.tokensUsedThisMonth || 0) / (userData.plan === 'ultimate' ? 2000000 : userData.plan === 'pro' ? 750000 : userData.plan === 'starter' ? 150000 : 25000)) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground dark:text-[#8A8985] text-right">
                      {Math.round(Math.min(100, ((userData.usage?.tokensUsedThisMonth || 0) / (userData.plan === 'ultimate' ? 2000000 : userData.plan === 'pro' ? 750000 : userData.plan === 'starter' ? 150000 : 25000)) * 100))}% used this month
                    </div>
                  </div>

                  {/* Daily Tokens */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground dark:text-[#E6E4DF] font-medium">Daily Tokens</span>
                      <span className="text-muted-foreground dark:text-[#8A8985]">
                        {((userData.usage?.tokensUsedToday || 0) / 1000).toFixed(1)}k / {userData.plan === 'ultimate' ? '100k' : userData.plan === 'pro' ? '30k' : userData.plan === 'starter' ? '5k' : '2k'}
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-muted dark:bg-[#1A1918] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500 ease-out rounded-full"
                        style={{ 
                          width: `${Math.min(100, ((userData.usage?.tokensUsedToday || 0) / (userData.plan === 'ultimate' ? 100000 : userData.plan === 'pro' ? 30000 : userData.plan === 'starter' ? 5000 : 2000)) * 100)}%` 
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground dark:text-[#8A8985] text-right">
                      {Math.round(Math.min(100, ((userData.usage?.tokensUsedToday || 0) / (userData.plan === 'ultimate' ? 100000 : userData.plan === 'pro' ? 30000 : userData.plan === 'starter' ? 5000 : 2000)) * 100))}% used today
                    </div>
                  </div>
                </div>

                {userData.plan !== 'ultimate' && (
                  <div className="mt-6 pt-5 border-t border-border/50 dark:border-[#33312E]/50">
                    <div className="bg-gradient-to-r from-primary/10 to-transparent dark:from-[#C36A4F]/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-primary dark:text-[#C36A4F] text-sm">Need more limits?</h4>
                        <p className="text-xs text-muted-foreground dark:text-[#8A8985] mt-0.5">Upgrade your plan for higher daily allowances and premium models.</p>
                      </div>
                      <button 
                        onClick={() => window.location.href = '/upgrade'}
                        className="px-4 py-2 bg-primary text-primary-foreground dark:bg-[#C36A4F] dark:text-[#1A1918] text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Subscription Management Section */}
            {userData && userData.plan !== 'free' && (
              <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] flex items-center gap-2">
                    <Shield size={18} className="text-primary dark:text-[#C36A4F]" />
                    Subscription Management
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
                    <div>
                      <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Current Plan</div>
                      <div className="text-xs text-muted-foreground dark:text-[#8A8985] uppercase tracking-wider">{userData.plan}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
                    <div>
                      <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Status</div>
                      <div className="text-xs font-medium">
                        {userData.planExpiryDate && new Date(userData.planExpiryDate) < new Date() ? (
                          <span className="text-destructive">Expired</span>
                        ) : (
                          <span className="text-green-500">Active</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
                    <div>
                      <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Next Billing / Expiry Date</div>
                      <div className="text-xs text-muted-foreground dark:text-[#8A8985]">
                        {userData.planExpiryDate 
                          ? new Date(userData.planExpiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                          : "Lifetime / N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => window.location.href = '/upgrade'}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border dark:border-[#33312E] text-foreground text-sm font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Renew or Change Plan
                    </button>
                    <button 
                      onClick={handleCancelSubscription}
                      disabled={isCancelling}
                      className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-transparent dark:border-red-900/30 text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Appearance Section */}
            <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center gap-2">
                <Sun size={18} className="text-muted-foreground dark:text-[#8A8985]" />
                Appearance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'light', icon: <Sun size={20} />, label: 'Light' },
                  { id: 'dark', icon: <Moon size={20} />, label: 'Dark' },
                  { id: 'system', icon: <Monitor size={20} />, label: 'System' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === t.id 
                        ? 'border-primary dark:border-[#C36A4F] bg-primary/5 dark:bg-[#C36A4F]/10 text-primary dark:text-[#C36A4F]' 
                        : 'border-border dark:border-[#33312E] text-muted-foreground hover:border-border/80 hover:bg-accent/50 dark:hover:bg-[#363532]/50'
                    }`}
                  >
                    {t.icon}
                    <span className="font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* AI Behavior Section */}
            <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-muted-foreground dark:text-[#8A8985]" />
                AI Behavior
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground dark:text-[#E6E4DF] mb-2">Default AI Mode</label>
                  <p className="text-xs text-muted-foreground dark:text-[#8A8985] mb-4">Choose the mode Drasa AI will use when starting a new chat.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(AI_MODES).map(([id, mode]) => (
                      <button
                        key={id}
                        onClick={() => setDefaultMode(id as any)}
                        className={`flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left ${
                          defaultMode === id 
                            ? 'border-primary dark:border-[#C36A4F] bg-primary/5 dark:bg-[#C36A4F]/10' 
                            : 'border-border dark:border-[#33312E] hover:bg-accent/50 dark:hover:bg-[#363532]/50'
                        }`}
                      >
                        <span className={`font-medium mb-1 ${defaultMode === id ? 'text-primary dark:text-[#C36A4F]' : 'text-foreground dark:text-[#E6E4DF]'}`}>
                          {mode.name}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-[#8A8985] line-clamp-2">
                          {mode.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Input Settings Section */}
            <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center gap-2">
                <Keyboard size={18} className="text-muted-foreground dark:text-[#8A8985]" />
                Input Settings
              </h2>
              
              <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
                <div>
                  <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Enter to Send</div>
                  <div className="text-xs text-muted-foreground dark:text-[#8A8985]">Press Enter to send message, Shift+Enter for new line</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={enterToSend} onChange={(e) => setEnterToSend(e.target.checked)} />
                  <div className="w-11 h-6 bg-muted dark:bg-[#33312E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-[#C36A4F]"></div>
                </label>
              </div>
            </section>

            {/* Data & Privacy Section */}
            <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center gap-2">
                <Shield size={18} className="text-muted-foreground dark:text-[#8A8985]" />
                Data & Privacy
              </h2>
              
              <div className="space-y-4">
                {(userData?.plan === 'pro' || userData?.plan === 'ultimate') && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
                    <div>
                      <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Show Sponsor Highlights</div>
                      <div className="text-xs text-muted-foreground dark:text-[#8A8985] max-w-sm">Display promotional community messages during the AI thinking phase. As a premium user, you can turn this off.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={userData?.preferences?.showSponsorHighlights || false} 
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          // Update local state for immediate feedback
                          setUserData({ ...userData, preferences: { ...userData.preferences, showSponsorHighlights: checked } });
                          try {
                            const res = await fetch('/api/user/me', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ preferences: { showSponsorHighlights: checked } })
                            });
                            if (!res.ok) throw new Error('Failed to update');
                            toast.success("Preferences updated");
                          } catch (error) {
                            toast.error("Failed to update preferences");
                            // Revert local state
                            setUserData({ ...userData, preferences: { ...userData.preferences, showSponsorHighlights: !checked } });
                          }
                        }} 
                      />
                      <div className="w-11 h-6 bg-muted dark:bg-[#33312E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-[#C36A4F]"></div>
                    </label>
                  </div>
                )}
              
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/30 dark:bg-[#1A1918]/30 rounded-xl border border-border/50 dark:border-[#33312E]/50 gap-4">
                  <div>
                    <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Export Data</div>
                    <div className="text-xs text-muted-foreground dark:text-[#8A8985]">Download all your chats and preferences as a JSON file.</div>
                  </div>
                  <button 
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="flex-shrink-0 px-4 py-2 bg-foreground text-background dark:bg-[#E6E4DF] dark:text-[#1A1918] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download size={16} />
                    {isExporting ? "Exporting..." : "Export"}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-destructive/5 dark:bg-red-900/10 rounded-xl border border-destructive/20 dark:border-red-900/30 gap-4">
                  <div>
                    <div className="font-medium text-destructive dark:text-red-400 mb-1">Clear Local Data</div>
                    <div className="text-xs text-muted-foreground dark:text-[#8A8985]">Permanently delete all chats and reset settings on this device.</div>
                  </div>
                  <button 
                    onClick={handleClearData}
                    className="flex-shrink-0 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-transparent dark:border-red-900/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Clear Data
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
