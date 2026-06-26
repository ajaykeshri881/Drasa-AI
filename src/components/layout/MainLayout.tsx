"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NotificationBanner } from "./NotificationBanner";
import { useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { setActiveAlerts } = useAdminStore();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts');
        if (res.ok) {
          const data = await res.json();
          setActiveAlerts(data.alerts);
        }
      } catch (e) {
        console.error("Failed to fetch alerts", e);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // Poll every 5 mins
    return () => clearInterval(interval);
  }, [setActiveAlerts]);

  return (
    <div className="flex h-[100dvh] w-full bg-background dark:bg-[#1A1918] text-foreground dark:text-[#E6E4DF] font-sans overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 flex flex-col relative h-full bg-background dark:bg-[#1A1918] transition-all duration-300">
        <NotificationBanner />
        <Header />
        {children}
      </main>
    </div>
  );
}
