"use client";

import { useChatStore } from "@/features/chat/store/useChatStore";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/overlay/dialog";
import { Button } from "@/components/ui/inputs/button";
import { ShieldAlert, ServerOff } from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalErrorModal() {
  const { limitError, setLimitError } = useChatStore();
  const router = useRouter();

  if (!limitError) return null;

  const isServerDown = limitError.title.includes("Server Issue");

  const handleClose = () => setLimitError(null);

  const handleAction = () => {
    if (limitError.isUpgrade) {
      router.push("/pricing");
    }
    handleClose();
  };

  return (
    <Dialog open={!!limitError} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border border-border dark:border-[#33312E] bg-background dark:bg-[#1A1918]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-serif">
            {isServerDown ? (
              <ServerOff className="w-6 h-6 text-orange-500" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-primary dark:text-[#C36A4F]" />
            )}
            {limitError.title}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground dark:text-[#E6E4DF] pt-4 leading-relaxed">
            {limitError.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3 sm:justify-end">
          <Button variant="outline" onClick={handleClose} className="border-border dark:border-[#33312E]">
            Dismiss
          </Button>
          {limitError.isUpgrade && (
            <Button onClick={handleAction} className="bg-primary hover:bg-primary/90 text-primary-foreground dark:bg-[#C36A4F] dark:text-[#1A1918] dark:hover:bg-[#d67b5f]">
              View Plans
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
