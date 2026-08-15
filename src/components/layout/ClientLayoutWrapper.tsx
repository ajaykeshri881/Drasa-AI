"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "./MainLayout";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff } from "lucide-react";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const { isOffline } = useNetworkStatus();
  
  const noLayoutPaths = [
    "/login",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/refund",
    "/disclaimer",
    "/share",
    "/ollama",
  ];
  
  const isNoLayoutPage = pathname.startsWith("/admin") || pathname.startsWith("/share") || noLayoutPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
  
  const offlineBanner = isOffline ? (
    <div className="w-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-b border-yellow-500/20 px-4 py-2 flex items-center justify-center gap-2 text-sm z-[100]">
      <WifiOff className="w-4 h-4" />
      <span><strong>Offline Mode:</strong> Memory and cloud saving paused. Local models available.</span>
    </div>
  ) : null;

  if (isNoLayoutPage) {
    return (
      <>
        {offlineBanner}
        {children}
        <PwaInstallPrompt />
      </>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {offlineBanner}
      <MainLayout>{children}</MainLayout>
      <PwaInstallPrompt />
    </div>
  );
}
