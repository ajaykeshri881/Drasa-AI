"use client";

import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Brain, Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryItem {
  _id: string;
  content: string;
  category: "preference" | "fact" | "rule" | "project_context";
  createdAt: string;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMemory, setNewMemory] = useState("");
  const [category, setCategory] = useState<MemoryItem['category']>("preference");

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setMemories(data);
      } else if (res.status === 401) {
        toast.error("You must be logged in to use AI Memory.");
      } else {
        toast.error("Failed to load memories");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while fetching memories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMemory, category })
      });

      if (res.ok) {
        toast.success("Memory added successfully!");
        setNewMemory("");
        fetchMemories();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add memory");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!window.confirm("Are you sure you want to forget this memory?")) return;

    try {
      const res = await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Memory forgotten!");
        setMemories(prev => prev.filter(m => m._id !== id));
      } else {
        toast.error("Failed to delete memory");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const categories = [
    { id: "preference", label: "Preferences" },
    { id: "rule", label: "Custom Rules" },
    { id: "fact", label: "Facts about you" },
    { id: "project_context", label: "Project Context" }
  ];

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto w-full pt-16 relative z-10 bg-background/50 dark:bg-[#1A1918]/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 pb-20">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif font-medium text-foreground dark:text-[#E6E4DF] mb-2 flex items-center gap-3">
                <Brain size={28} className="text-primary dark:text-[#C36A4F]" />
                AI Memory
              </h1>
              <p className="text-muted-foreground dark:text-[#8A8985] text-sm">Manage what Drasa AI remembers about you across all chats.</p>
            </div>
            <button 
              onClick={fetchMemories}
              disabled={isLoading}
              className="p-2 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#363532] rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
              title="Refresh memories"
            >
              <RefreshCw size={18} className={`text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Add Memory Form */}
            <div className="lg:col-span-1">
              <div className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-5 shadow-sm sticky top-24">
                <h2 className="text-base font-medium text-foreground dark:text-[#E6E4DF] mb-4">Teach Drasa AI</h2>
                <form onSubmit={handleAddMemory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground dark:text-[#8A8985] mb-1.5 uppercase tracking-wider">Category</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-background dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary dark:focus:border-[#C36A4F]"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground dark:text-[#8A8985] mb-1.5 uppercase tracking-wider">Memory</label>
                    <textarea 
                      value={newMemory}
                      onChange={(e) => setNewMemory(e.target.value)}
                      placeholder="e.g., I prefer Tailwind CSS over standard CSS."
                      className="w-full bg-background dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary dark:focus:border-[#C36A4F] min-h-[100px] resize-y"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmitting || !newMemory.trim()}
                    className="w-full py-2.5 bg-primary dark:bg-[#C36A4F] text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    {isSubmitting ? "Adding..." : "Add Memory"}
                  </button>
                </form>
              </div>
            </div>

            {/* Memories List */}
            <div className="lg:col-span-2 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={24} className="animate-spin text-muted-foreground" />
                </div>
              ) : memories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card/50 dark:bg-[#2A2928]/50 border border-border/50 dark:border-[#33312E]/50 rounded-2xl">
                  <Brain size={48} className="text-muted-foreground/30 dark:text-[#8A8985]/30 mb-4" />
                  <h3 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] mb-2">Blank Slate</h3>
                  <p className="text-muted-foreground dark:text-[#8A8985] text-sm text-center max-w-sm">
                    Drasa AI hasn&apos;t learned anything specific about you yet. Try adding a custom rule or preference!
                  </p>
                </div>
              ) : (
                categories.map(cat => {
                  const items = memories.filter(m => m.category === cat.id);
                  if (items.length === 0) return null;

                  return (
                    <div key={cat.id} className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-5 shadow-sm">
                      <h3 className="text-sm font-medium text-foreground dark:text-[#E6E4DF] mb-4 flex items-center justify-between">
                        {cat.label}
                        <span className="text-xs bg-muted dark:bg-[#33312E] px-2 py-0.5 rounded-full text-muted-foreground">
                          {items.length}
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {items.map(memory => (
                          <div key={memory._id} className="group flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-accent/50 dark:hover:bg-[#363532]/50 border border-transparent hover:border-border/50 transition-all">
                            <p className="text-sm text-muted-foreground dark:text-[#A3A19C] leading-relaxed">
                              {memory.content}
                            </p>
                            <button 
                              onClick={() => handleDeleteMemory(memory._id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive dark:text-[#8A8985] dark:hover:text-red-400 hover:bg-destructive/10 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                              title="Delete memory"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
