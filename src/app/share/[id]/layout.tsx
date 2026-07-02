import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Chat — Drasa AI",
  description: "View a shared conversation from Drasa AI",
  openGraph: {
    title: "Shared Chat — Drasa AI",
    description: "View this AI conversation shared with you from Drasa AI",
    siteName: "Drasa AI",
  },
};

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
