"use client";

import React, { useState, useEffect } from "react";
import { Settings2, Cpu, Loader2, PlusCircle, Pencil, X } from "lucide-react";
import { toast } from "sonner";

interface ModelConfig {
  _id?: string;
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

const defaultModel: ModelConfig = {
  modelId: "",
  name: "",
  provider: "openrouter",
  isPremium: false,
  isActive: true,
  contextWindow: 8192,
  visionSupport: false,
  toolSupport: false,
  description: "",
};

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [formData, setFormData] = useState<ModelConfig>(defaultModel);
  const [isSaving, setIsSaving] = useState(false);

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

  const openCreateModal = () => {
    setEditingModel(null);
    setFormData(defaultModel);
    setIsModalOpen(true);
  };

  const openEditModal = (model: ModelConfig) => {
    setEditingModel(model);
    setFormData(model);
    setIsModalOpen(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const isNew = !editingModel;
    const method = isNew ? "POST" : "PATCH";

    try {
      const res = await fetch("/api/admin/models", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Model ${isNew ? "created" : "updated"} successfully!`);
        setIsModalOpen(false);
        fetchModels();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save model");
      }
    } catch (error) {
      console.error("Save model failed:", error);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">Model Configuration</h1>
          <p className="text-muted-foreground dark:text-[#8A8985]">Manage AI models, routing, and access restrictions.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary dark:bg-[#C36A4F] text-primary-foreground dark:text-[#1A1918] rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity text-sm"
        >
          <PlusCircle size={16} />
          Add Model
        </button>
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
            Click &quot;Add Model&quot; to configure your first AI provider.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {models.map((model) => (
            <div
              key={model.modelId}
              className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-4 min-w-0 cursor-pointer" onClick={() => openEditModal(model)}>
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-foreground dark:text-[#E6E4DF] truncate group-hover:text-primary transition-colors">{model.name}</h3>
                    <Pencil size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                  </div>
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

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card dark:bg-[#1A1918] w-full max-w-lg rounded-2xl shadow-xl border border-border dark:border-[#33312E] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-[#33312E]">
              <h2 className="text-xl font-semibold text-foreground dark:text-white">
                {editingModel ? "Edit Model" : "Add Model"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="model-form" onSubmit={handleSaveModel} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-foreground">Provider</label>
                    <select
                      className="w-full p-2.5 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#262523] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                      disabled={!!editingModel} // Don't change provider of existing models usually
                    >
                      <option value="openrouter">OpenRouter</option>
                      <option value="gemini">Gemini</option>
                    </select>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium text-foreground">Model ID</label>
                    <input
                      required
                      type="text"
                      className="w-full p-2.5 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#262523] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      value={formData.modelId}
                      onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                      disabled={!!editingModel}
                      placeholder="e.g. google/gemini-2.5-pro"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Display Name</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#262523] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Gemini 2.5 Pro"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <input
                    type="text"
                    className="w-full p-2.5 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#262523] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of the model..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Context Window (Tokens)</label>
                  <input
                    required
                    type="number"
                    min={1}
                    className="w-full p-2.5 rounded-xl border border-border dark:border-[#33312E] bg-background dark:bg-[#262523] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={formData.contextWindow}
                    onChange={(e) => setFormData({ ...formData, contextWindow: parseInt(e.target.value) || 8192 })}
                  />
                </div>

                <div className="pt-2 grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-[#33312E] cursor-pointer hover:bg-muted/50 dark:hover:bg-[#262523] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">Premium Only</span>
                      <span className="text-[10px] text-muted-foreground">Require Paid Plan</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-[#33312E] cursor-pointer hover:bg-muted/50 dark:hover:bg-[#262523] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.visionSupport}
                      onChange={(e) => setFormData({ ...formData, visionSupport: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">Vision Support</span>
                      <span className="text-[10px] text-muted-foreground">Can read images</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-[#33312E] cursor-pointer hover:bg-muted/50 dark:hover:bg-[#262523] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.toolSupport}
                      onChange={(e) => setFormData({ ...formData, toolSupport: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">Tool Support</span>
                      <span className="text-[10px] text-muted-foreground">Can use tools</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-[#33312E] cursor-pointer hover:bg-muted/50 dark:hover:bg-[#262523] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">Active Status</span>
                      <span className="text-[10px] text-muted-foreground">Available to users</span>
                    </div>
                  </label>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-border dark:border-[#33312E] flex justify-end gap-3 bg-muted/20 dark:bg-[#262523]/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-muted dark:hover:bg-[#33312E] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="model-form"
                disabled={isSaving}
                className="px-6 py-2 bg-primary dark:bg-[#C36A4F] text-primary-foreground dark:text-[#1A1918] rounded-xl text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSaving ? "Saving..." : "Save Model"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
