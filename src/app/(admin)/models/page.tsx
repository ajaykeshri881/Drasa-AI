"use client";

import React, { useState, useEffect } from "react";
import { Settings2, Cpu, Zap, Activity, Loader2, PlusCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ModelConfig {
  _id: string;
  modelId: string;
  name: string;
  provider: "openrouter" | "gemini";
  isPremium: boolean;
  isActive: boolean;
  contextWindow: number;
  visionSupport: boolean;
  toolSupport: boolean;
  description?: string;
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/models");
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      } else {
        toast.error("Failed to load model configs");
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      toast.error("Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const toggleModel = async (model: ModelConfig) => {
    setTogglingId(model.modelId);
    try {
      const res = await fetch("/api/admin/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: model.modelId, isActive: !model.isActive }),
      });

      if (res.ok) {
        setModels((prev) =>
          prev.map((m) => (m.modelId === model.modelId ? { ...m, isActive: !m.isActive } : m))
        );
        toast.success(`${model.name} ${!model.isActive ? "activated" : "deactivated"}`);
      } else {
        toast.error("Failed to update model status");
      }
    } catch (error) {
      console.error("Toggle failed:", error);
      toast.error("An error occurred");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">Model Configuration</h1>
          <p className="text-muted-foreground dark:text-[#8A8985]">Manage AI models, routing, and access restrictions.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm">Loading model configurations...</p>
        </div>
      ) : models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border dark:border-[#33312E] rounded-2xl bg-muted/10">
          <Cpu size={40} className="mb-4 opacity-30" />
          <p className="text-sm font-medium mb-1">No model configs found</p>
          <p className="text-xs text-center max-w-xs opacity-70">
            Add model configurations to the database via the API to manage them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {models.map((model) => (
            <div
              key={model.modelId}
              className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`p-3 rounded-xl flex-shrink-0 ${
                    model.isPremium
                      ? "bg-primary/10 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F]"
                      : "bg-muted text-muted-foreground dark:bg-[#33312E] dark:text-[#8A8985]"
                  }`}
                >
                  {model.provider === "openrouter" ? <Settings2 size={20} /> : <Cpu size={20} />}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-foreground dark:text-[#E6E4DF] truncate">{model.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground dark:text-[#73726E] capitalize">{model.provider}</span>
                    <span className="w-1 h-1 rounded-full bg-border dark:bg-[#33312E]"></span>
                    <span
                      className={`text-[10px] uppercase font-semibold tracking-wider ${
                        model.isPremium ? "text-primary dark:text-[#C36A4F]" : "text-blue-500"
                      }`}
                    >
                      {model.isPremium ? "pro" : "free"}
                    </span>
                    {model.visionSupport && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border dark:bg-[#33312E]"></span>
                        <span className="text-[10px] text-muted-foreground dark:text-[#73726E]">vision</span>
                      </>
                    )}
                    {model.toolSupport && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border dark:bg-[#33312E]"></span>
                        <span className="text-[10px] text-muted-foreground dark:text-[#73726E]">tools</span>
                      </>
                    )}
                  </div>
                  {model.description && (
                    <p className="text-[11px] text-muted-foreground dark:text-[#73726E] mt-1 truncate">{model.description}</p>
                  )}
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => toggleModel(model)}
                disabled={togglingId === model.modelId}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-[#1A1918] flex-shrink-0 ml-4 ${
                  model.isActive ? "bg-primary dark:bg-[#C36A4F]" : "bg-muted dark:bg-[#33312E]"
                }`}
                aria-label={model.isActive ? "Deactivate model" : "Activate model"}
              >
                {togglingId === model.modelId ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={12} className="animate-spin text-white" />
                  </span>
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      model.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
