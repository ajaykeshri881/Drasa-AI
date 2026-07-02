"use client";

import React, { useState, useEffect } from "react";
import { Search, Shield, ShieldAlert, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface User {
  _id: string;
  name?: string;
  email: string;
  plan: string;
  role: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, totalCount: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const updateUser = async (userId: string, updates: { plan?: string; role?: string }) => {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...updates } : u));
        toast.success(`User updated successfully`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePlanChange = (userId: string, newPlan: string) => {
    updateUser(userId, { plan: newPlan });
  };

  const handleRoleChange = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (newRole === "admin") {
      if (!window.confirm("Are you sure you want to grant admin access to this user?")) return;
    }
    updateUser(userId, { role: newRole });
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">User Management</h1>
          <p className="text-muted-foreground dark:text-[#8A8985]">View and manage all registered users and their subscriptions.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-[#73726E]" />
          <input 
            type="text" 
            placeholder="Search users by email or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-xl text-sm text-foreground dark:text-[#E6E4DF] placeholder:text-muted-foreground focus:border-primary dark:focus:border-[#4A4946] focus:ring-1 focus:ring-primary dark:focus:ring-[#4A4946] outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-muted-foreground">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-12 text-muted-foreground">
            <p>No users found{searchTerm ? ` matching "${searchTerm}"` : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 dark:bg-[#1A1918] text-muted-foreground dark:text-[#8A8985] uppercase text-[11px] tracking-wider font-semibold border-b border-border dark:border-[#33312E]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 dark:divide-[#33312E]/50">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-accent/50 dark:hover:bg-[#32302D]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground dark:text-[#E6E4DF]">{user.name || "No name"}</span>
                        <span className="text-xs text-muted-foreground dark:text-[#73726E]">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRoleChange(user._id, user.role)}
                        disabled={updatingId === user._id}
                        className="flex items-center gap-1.5 group cursor-pointer hover:bg-accent dark:hover:bg-[#363532] px-2 py-1 rounded-lg transition-colors"
                        title="Click to toggle role"
                      >
                        {user.role === 'admin' ? <ShieldAlert size={14} className="text-primary dark:text-[#C36A4F]" /> : <Shield size={14} className="text-muted-foreground dark:text-[#8A8985]" />}
                        <span className="capitalize text-foreground/90 dark:text-[#D4D2CD]">{user.role}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.plan}
                        onChange={(e) => handlePlanChange(user._id, e.target.value)}
                        disabled={updatingId === user._id}
                        className={`appearance-none cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider border-0 outline-none transition-all ${
                          user.plan === 'ultimate' ? 'bg-amber-500/20 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                          user.plan === 'pro' ? 'bg-primary/20 text-primary dark:bg-[#C36A4F]/20 dark:text-[#ff8d6e]' :
                          'bg-muted text-muted-foreground dark:bg-[#33312E] dark:text-[#A3A19C]'
                        }`}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="ultimate">Ultimate</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground dark:text-[#8A8985]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {updatingId === user._id && (
                        <Loader2 size={16} className="animate-spin text-primary inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && (
          <div className="p-4 border-t border-border dark:border-[#33312E] mt-auto flex items-center justify-between">
            <span className="text-xs text-muted-foreground dark:text-[#73726E]">
              Showing {users.length} of {pagination.totalCount} users (Page {pagination.page} of {pagination.totalPages || 1})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#363532] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#363532] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
