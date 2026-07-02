"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useAdminStore } from "@/features/admin/store/useAdminStore";

interface NotificationsDropdownProps {
  mounted: boolean;
}

export function NotificationsDropdown({ mounted }: NotificationsDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { activeAlerts, dismissAlert } = useAdminStore();

  const dismissedIds = mounted ? JSON.parse(localStorage.getItem("drasa_dismissed_alerts") || "[]") : [];
  const unreadCount = mounted ? activeAlerts.filter((a: any) => !dismissedIds.includes(a._id)).length : 0;

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="p-1.5 sm:p-2 rounded-lg border border-border dark:border-[#33312E] bg-card dark:bg-[#262523] hover:bg-accent dark:hover:bg-[#32302D] transition-colors relative text-muted-foreground dark:text-[#A3A19C] hover:text-foreground dark:hover:text-[#E6E4DF]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        )}
      </button>
      
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-background dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-border dark:border-[#33312E] flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {activeAlerts.length > 0 && (
              <button 
                onClick={() => {
                  const allIds = activeAlerts.map(a => a._id);
                  localStorage.setItem("drasa_dismissed_alerts", JSON.stringify(allIds));
                  activeAlerts.forEach(a => dismissAlert(a._id));
                  setIsDropdownOpen(false);
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {activeAlerts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              activeAlerts.map(alert => {
                const isRead = dismissedIds.includes(alert._id);
                return (
                  <div key={alert._id} className={`p-3 rounded-lg mb-1 border ${isRead ? 'opacity-60 border-transparent' : 'border-border dark:border-[#33312E] bg-accent/30 dark:bg-[#32302D]/30'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <div className={`w-2 h-2 rounded-full mt-1 ${alert.type === 'emergency' ? 'bg-red-500' : alert.type === 'maintenance' ? 'bg-orange-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    {alert.actionUrl && (
                      <a href={alert.actionUrl} className="text-xs text-primary mt-2 inline-block font-medium hover:underline">
                        {alert.actionText || "View Details"}
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
