import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1A1918] text-foreground dark:text-[#E6E4DF] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-4xl font-serif font-medium mb-8">Terms of Service</h1>
        
        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
          <p className="mb-6">Last updated: June 2026</p>
          
          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing or using the Drasa AI platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily access the materials (information or software) on Drasa AI&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
          </p>
          
          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">3. AI Generations & Output</h2>
          <p className="mb-4">
            You are entirely responsible for the content you generate using Drasa AI. We do not claim ownership over the text, images, or code generated. However, you agree not to use the service to generate illegal, harmful, or abusive material.
          </p>

          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">4. Limitations</h2>
          <p className="mb-4">
            In no event shall Drasa AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Drasa AI&apos;s website.
          </p>

          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">5. Revisions</h2>
          <p className="mb-4">
            Drasa AI may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}
