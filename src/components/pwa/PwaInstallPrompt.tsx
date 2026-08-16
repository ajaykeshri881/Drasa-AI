"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/inputs/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [isReady, setIsReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can install the PWA
      setIsReady(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if it's already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsReady(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsReady(false);
  };

  const handleDismiss = () => {
    setIsReady(false);
  };

  if (!isReady) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 rounded-lg border bg-background p-4 shadow-lg sm:bottom-8 sm:right-8 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Download className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Install Drasa AI</h3>
            <p className="text-xs text-muted-foreground">Add to your home screen for offline access and a better experience.</p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <Button variant="outline" size="sm" className="w-full" onClick={handleDismiss}>
          Not now
        </Button>
        <Button size="sm" className="w-full" onClick={handleInstallClick}>
          Install App
        </Button>
      </div>
    </div>
  );
}
