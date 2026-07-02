"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/inputs/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex max-w-md flex-col items-center gap-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-8 shadow-lg backdrop-blur-sm">
        <div className="rounded-full bg-destructive/20 p-3">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>
        <Button 
          onClick={() => reset()}
          className="w-full sm:w-auto"
          variant="default"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
