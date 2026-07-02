import React, { useState } from 'react';
import { Shield, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useChatStore } from "@/features/chat/store/useChatStore";

interface DataPrivacySectionProps {
  userData: any;
  setUserData: (data: any) => void;
}

export function DataPrivacySection({ userData, setUserData }: DataPrivacySectionProps) {
  const { clearAllChats } = useChatStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to delete all local data? This includes your chats and preferences. This action cannot be undone.")) {
      clearAllChats();
      localStorage.clear();
      toast.success("All local data has been cleared.");
      window.location.href = "/";
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
  );
}
