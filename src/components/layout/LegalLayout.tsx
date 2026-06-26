import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalLayout({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="w-full max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to App
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-8">{title}</h1>
        <div className="prose dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
