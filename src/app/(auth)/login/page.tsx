"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#1A1918] p-4">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="font-serif text-3xl font-medium text-foreground dark:text-[#E6E4DF] mb-8">
          Drasa AI
        </Link>

        {/* Login Box */}
        <div className="w-full bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-3xl p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-center text-foreground dark:text-white mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-center text-muted-foreground dark:text-[#8A8985] mb-8">
            Sign in to continue to Drasa AI
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-foreground dark:bg-white text-background dark:text-black py-3 rounded-xl font-medium hover:bg-foreground/90 dark:hover:bg-gray-100 transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-8 text-center text-xs text-muted-foreground dark:text-[#73726E]">
            By continuing, you agree to Drasa AI&apos;s{" "}
            <Link href="/terms" className="underline hover:text-foreground dark:hover:text-[#D4D2CD]">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-foreground dark:hover:text-[#D4D2CD]">Privacy Policy</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
