"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Loader2, Edit, Trash2, Megaphone, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface SponsorHighlight {
  _id: string;
  title: string;
  description: string;
  linkText?: string;
  linkUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminSponsorsPage() {
  const [sponsors, setSponsors] = useState<SponsorHighlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    linkText: "",
    linkUrl: "",
    isActive: true,
  });

  const fetchSponsors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/sponsors");
      if (res.ok) {
        const data = await res.json();
        setSponsors(data);
      } else {
        toast.error("Failed to load sponsors");
      }
    } catch (error) {
      toast.error("Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const openModal = (sponsor?: SponsorHighlight) => {
    if (sponsor) {
      setEditingId(sponsor._id);
      setFormData({
        title: sponsor.title,
        description: sponsor.description,
        linkText: sponsor.linkText || "",
        linkUrl: sponsor.linkUrl || "",
        isActive: sponsor.isActive,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        description: "",
        linkText: "",
        linkUrl: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = "/api/admin/sponsors";
      const method = editingId ? "PATCH" : "POST";
      const payload = editingId ? { id: editingId, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`Sponsor highlight ${editingId ? "updated" : "created"}`);
        setIsModalOpen(false);
        fetchSponsors();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save sponsor highlight");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sponsor highlight?")) return;
    try {
      const res = await fetch(`/api/admin/sponsors?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Sponsor highlight deleted");
        setSponsors(sponsors.filter(s => s._id !== id));
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const toggleActive = async (sponsor: SponsorHighlight) => {
    try {
      const res = await fetch("/api/admin/sponsors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sponsor._id, isActive: !sponsor.isActive }),
      });
      if (res.ok) {
        setSponsors(sponsors.map(s => s._id === sponsor._id ? { ...s, isActive: !s.isActive } : s));
        toast.success(`Sponsor ${!sponsor.isActive ? "activated" : "deactivated"}`);
      }
    } catch (error) {
      toast.error("Failed to toggle status");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">Sponsor Highlights</h1>
          <p className="text-muted-foreground dark:text-[#8A8985]">Manage promotional or sponsor banners shown during the AI thinking phase.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-[#C36A4F] dark:hover:bg-[#a65740] dark:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <PlusCircle size={16} /> Add Highlight
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="animate-spin mb-4" size={32} />
          <p className="text-sm">Loading sponsor highlights...</p>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border border-dashed border-border dark:border-[#33312E] rounded-2xl bg-muted/10">
          <Megaphone size={40} className="mb-4 opacity-30" />
          <p className="text-sm font-medium mb-1">No sponsor highlights found</p>
          <p className="text-xs text-center max-w-xs opacity-70">
            Create a highlight to display messages to users while the AI generates responses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor._id}
              className={`bg-card dark:bg-[#262523]/50 border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${sponsor.isActive ? 'border-primary/30 dark:border-[#C36A4F]/30' : 'border-border dark:border-[#33312E] opacity-75'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${sponsor.isActive ? 'bg-primary/10 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F]' : 'bg-muted text-muted-foreground'}`}>
                    <Megaphone size={16} />
                  </div>
                  <h3 className="font-medium text-foreground dark:text-[#E6E4DF]">{sponsor.title}</h3>
                </div>
                <button
                  onClick={() => toggleActive(sponsor)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    sponsor.isActive ? "bg-primary dark:bg-[#C36A4F]" : "bg-muted dark:bg-[#33312E]"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      sponsor.isActive ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{sponsor.description}</p>
              
              {sponsor.linkUrl && (
                <div className="flex items-center gap-2 text-xs text-blue-500 mb-4 truncate">
                  <LinkIcon size={12} />
                  <a href={sponsor.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                    {sponsor.linkText || sponsor.linkUrl}
                  </a>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-auto pt-3 border-t border-border/50 dark:border-[#33312E]/50">
                <button onClick={() => openModal(sponsor)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(sponsor._id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border dark:border-[#33312E]">
              <h2 className="text-xl font-semibold">{editingId ? "Edit Sponsor Highlight" : "New Sponsor Highlight"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-muted dark:bg-[#262523] border border-border dark:border-[#33312E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Special Offer from Partner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-muted dark:bg-[#262523] border border-border dark:border-[#33312E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Short engaging description for the users..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Link Text (Optional)</label>
                  <input
                    type="text"
                    value={formData.linkText}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    className="w-full bg-muted dark:bg-[#262523] border border-border dark:border-[#33312E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Learn More"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Link URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full bg-muted dark:bg-[#262523] border border-border dark:border-[#33312E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary/20"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active Immediately</label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-border dark:border-[#33312E]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-[#C36A4F] dark:hover:bg-[#a65740] rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save Highlight"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
