"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "./MainLayout";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  
  const noLayoutPaths = [
    "/login",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/refund",
    "/disclaimer",
    "/share",
  ];
  
  const isNoLayoutPage = pathname.startsWith("/admin") || pathname.startsWith("/share") || noLayoutPaths.some(path => pathname === path || pathname.startsWith(path + "/"));
  
  if (isNoLayoutPage) {
    return <>{children}</>;
  }
  
  return <MainLayout>{children}</MainLayout>;
}
