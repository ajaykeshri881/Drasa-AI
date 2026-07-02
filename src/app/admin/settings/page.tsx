"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";

interface SystemConfig {
  defaultFallbackModelId: string;
  defaultVisionModelId: string;
  systemPromptBase: string;
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    defaultFallbackModelId: "",
    defaultVisionModelId: "",
    systemPromptBase: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function fetchConfig() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
      toast.error("Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success("System settings updated successfully!");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="text-sm">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F] rounded-xl">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">System Settings</h1>
          <p className="text-muted-foreground dark:text-[#8A8985]">Configure global AI behavior, fallbacks, and prompts.</p>
        </div>
      </div>

      <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 md:p-8 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground dark:text-[#E6E4DF]">
              Default Fallback Model ID
            </label>
            <p className="text-xs text-muted-foreground dark:text-[#8A8985]">
              Used automatically if the primary AI provider experiences an outage. (e.g. meta-llama/llama-3.3-70b-instruct:free)
            </p>
            <input
              type="text"
              name="defaultFallbackModelId"
              value={config.defaultFallbackModelId}
              onChange={handleChange}
              placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free"
              className="w-full p-3 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#1A1918] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground dark:text-[#E6E4DF]">
              Default Vision Model ID
            </label>
            <p className="text-xs text-muted-foreground dark:text-[#8A8985]">
              Used as fallback if the user attaches an image and the primary model fails. (e.g. nvidia/nemotron-nano-12b-v2-vl:free)
            </p>
            <input
              type="text"
              name="defaultVisionModelId"
              value={config.defaultVisionModelId}
              onChange={handleChange}
              placeholder="e.g. nvidia/nemotron-nano-12b-v2-vl:free"
              className="w-full p-3 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#1A1918] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground dark:text-[#E6E4DF]">
              Global System Prompt Addendum
            </label>
            <p className="text-xs text-muted-foreground dark:text-[#8A8985]">
              These instructions are appended to every AI request across all modes. Useful for tone or length enforcement.
            </p>
            <textarea
              name="systemPromptBase"
              value={config.systemPromptBase}
              onChange={handleChange}
              rows={4}
              placeholder="Keep responses short..."
              className="w-full p-3 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#1A1918] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y min-h-[100px]"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-primary dark:bg-[#C36A4F] text-primary-foreground dark:text-[#1A1918] rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isSaving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
