"use client";

import React from "react";
import Link from "next/link";
import { NavItemProps } from "@/types/sidebar";
import { Plus, MessagesSquare, Settings, Layout, Zap, Trash, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSettingsStore } from "@/features/settings/store/useSettingsStore";
import { toast } from "sonner";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/overlay/dialog";

export function NavItem({ icon, label, badge, collapsed }: NavItemProps) {
  return (
    <div className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between px-3'} py-2 rounded-lg text-foreground/90 dark:text-[#D4D2CD] hover:bg-accent dark:hover:bg-[#2A2928] transition-all duration-200 text-[14px] text-left group border border-transparent hover:border-border/50 dark:hover:border-[#33312E]/50 cursor-pointer active:scale-[0.98]`}>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground dark:text-[#8A8985] group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors duration-300 flex-shrink-0">{icon}</span>
        {!collapsed && <span className="font-medium group-hover:translate-x-0.5 transition-transform duration-200 whitespace-nowrap">{label}</span>}
      </div>
      {!collapsed && badge && (
        <span className="text-[10px] bg-muted dark:bg-[#33312E] text-muted-foreground dark:text-[#8A8985] px-1.5 py-0.5 rounded-md group-hover:bg-primary/20 dark:group-hover:bg-[#C36A4F]/20 group-hover:text-primary dark:group-hover:text-[#C36A4F] transition-colors">
          {badge}
        </span>
      )}
    </div>
  );
}

interface SidebarNavProps {
  isSidebarOpen: boolean;
  isDesktop: boolean;
  setSidebarOpen: (open: boolean) => void;
  clearAllChats: () => void;
}

export function SidebarNav({ isSidebarOpen, isDesktop, setSidebarOpen, clearAllChats }: SidebarNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setDefaultMode } = useSettingsStore();

  const handleClearMemory = async () => {
    try {
      const res = await fetch('/api/memory?id=all', { method: 'DELETE' });
      if (res.ok) {
        toast.success("AI Memory cleared successfully.");
      } else {
        toast.error("Failed to clear memory.");
      }
    } catch (e) {
      toast.error("Error clearing memory.");
    }
  };

  return (
    <div className="space-y-6 flex-1">
      <div className="space-y-0.5">
        <div onClick={() => {
          if (pathname === "/") {
            window.location.href = "/";
          } else {
            router.push("/");
          }
          if (!isDesktop) setSidebarOpen(false);
        }}>
          <NavItem icon={<Plus size={16} />} label="New chat" collapsed={!isSidebarOpen} />
        </div>
        <Link href="/chats" onClick={() => { if (!isDesktop) setSidebarOpen(false); }}>
          <NavItem icon={<MessagesSquare size={16} />} label="All chats" collapsed={!isSidebarOpen} />
        </Link>
      </div>

      <div>
        {isSidebarOpen && <div className="px-3 text-[11px] font-medium text-muted-foreground dark:text-[#73726E] mb-1.5 uppercase tracking-wider">Features</div>}
        <div className="space-y-0.5">
          <div onClick={() => {
            setDefaultMode("code");
            toast.success("Coding Expert mode activated!");
            if (!isDesktop) setSidebarOpen(false);
            if (pathname !== "/") router.push("/");
          }}>
            <NavItem icon={<Layout size={16} />} label="Coding Expert" collapsed={!isSidebarOpen} />
          </div>
          <Link href="/preferences" onClick={() => { if (!isDesktop) setSidebarOpen(false); }}>
            <NavItem icon={<Settings size={16} />} label="Preferences" collapsed={!isSidebarOpen} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SidebarDataNav({ isSidebarOpen, isDesktop, setSidebarOpen, clearAllChats }: SidebarNavProps) {
  const router = useRouter();

  const handleClearMemory = async () => {
    try {
      const res = await fetch('/api/memory?id=all', { method: 'DELETE' });
      if (res.ok) {
        toast.success("AI Memory cleared successfully.");
      } else {
        toast.error("Failed to clear memory.");
      }
    } catch (e) {
      toast.error("Error clearing memory.");
    }
  };

  return (
    <div>
      {isSidebarOpen ? (
        <div className="px-3 text-[11px] font-medium text-muted-foreground dark:text-[#73726E] mb-1.5 uppercase tracking-wider mt-6">
          Data & Memory
        </div>
      ) : (
        <div className="mt-6 border-t border-border/50 dark:border-[#33312E]/50 pt-4" />
      )}
      <div className="space-y-0.5">
        <Link href="/memory" onClick={() => { if (!isDesktop) setSidebarOpen(false); }}>
          <NavItem icon={<Zap size={16} />} label="AI Memory" collapsed={!isSidebarOpen} />
        </Link>
        
        <Dialog>
          <DialogTrigger render={<button className="w-full text-left appearance-none outline-none" />}>
            <NavItem icon={<Trash size={16} />} label="Clear Memory" collapsed={!isSidebarOpen} />
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Clear AI Memory</DialogTitle>
            <DialogDescription>Are you sure you want to clear all AI memory?</DialogDescription>
            <DialogFooter>
              <DialogClose className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</DialogClose>
              <DialogClose onClick={handleClearMemory} className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90">Clear</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger render={<button className="w-full text-left appearance-none outline-none" />}>
            <NavItem icon={<Trash2 size={16} />} label="Clear all chats" collapsed={!isSidebarOpen} />
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Clear All Chats</DialogTitle>
            <DialogDescription>Are you sure you want to delete all chats? This action cannot be undone.</DialogDescription>
            <DialogFooter>
              <DialogClose className="px-4 py-2 border rounded-lg hover:bg-muted">Cancel</DialogClose>
              <DialogClose onClick={() => { clearAllChats(); router.push('/'); }} className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90">Clear</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
