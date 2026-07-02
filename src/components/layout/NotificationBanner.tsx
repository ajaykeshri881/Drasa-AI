"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Bell, Info, ShieldAlert, X } from "lucide-react";
import { useAdminStore, AdminAlert } from "@/features/admin/store/useAdminStore";

export function NotificationBanner() {
  const { activeAlerts, dismissAlert } = useAdminStore();
  const [alertsToShow, setAlertsToShow] = useState<AdminAlert[]>([]);

  useEffect(() => {
    // Only show alerts that haven't been dismissed by the user locally
    const dismissedIds = JSON.parse(localStorage.getItem("drasa_dismissed_alerts") || "[]");
    
    // Banner only shows the highest priority emergency/maintenance/warning alert, 
    // or info if no higher priority ones exist. (Limit to 1 to save space).
    const unDismissed = activeAlerts.filter(a => !dismissedIds.includes(a._id));
    
    if (unDismissed.length > 0) {
      // Prioritize: emergency > maintenance > warning > info/announcement
      const sorted = [...unDismissed].sort((a, b) => {
        const pMap: Record<string, number> = { emergency: 4, maintenance: 3, warning: 2, announcement: 1, info: 0 };
        return (pMap[b.type] || 0) - (pMap[a.type] || 0);
      });
      setAlertsToShow([sorted[0]]);
    } else {
      setAlertsToShow([]);
    }
  }, [activeAlerts]);

  const handleDismiss = (id: string) => {
    // Dismiss in store
    dismissAlert(id);
    
    // Persist to local storage
    const dismissedIds = JSON.parse(localStorage.getItem("drasa_dismissed_alerts") || "[]");
    localStorage.setItem("drasa_dismissed_alerts", JSON.stringify([...dismissedIds, id]));
  };

  if (alertsToShow.length === 0) return null;

  const alert = alertsToShow[0];

  const getStyle = (type: string) => {
    switch (type) {
      case "emergency": return "bg-red-500/90 text-white border-b border-red-600";
      case "maintenance": return "bg-orange-500/90 text-white border-b border-orange-600";
      case "warning": return "bg-amber-500/90 text-white border-b border-amber-600";
      case "announcement": return "bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white border-b border-purple-600";
      case "info":
      default: return "bg-blue-500/90 text-white border-b border-blue-600";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "emergency": return <ShieldAlert size={18} />;
      case "maintenance": return <AlertTriangle size={18} />;
      case "warning": return <AlertCircle size={18} />;
      case "info": return <Info size={18} />;
      case "announcement": return <Bell size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-between backdrop-blur-md z-50 ${getStyle(alert.type)}`}>
      <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
        <div className="flex-shrink-0 animate-pulse">
          {getIcon(alert.type)}
        </div>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
          <div className="font-medium">
            <span className="font-bold mr-2">{alert.title}</span>
            {alert.message}
          </div>
          {alert.actionUrl && (
            <a 
              href={alert.actionUrl} 
              className="mt-1 sm:mt-0 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-semibold transition-colors w-fit"
            >
              {alert.actionText || "Learn More"}
            </a>
          )}
        </div>
        <button 
          onClick={() => handleDismiss(alert._id)}
          className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0 ml-2"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
