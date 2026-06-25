import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#1A1918] text-foreground dark:text-[#E6E4DF] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-4xl font-serif font-medium mb-8">Privacy Policy</h1>
        
        <div className="prose dark:prose-invert max-w-none text-muted-foreground">
          <p className="mb-6">Last updated: June 2026</p>
          
          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4">
            We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.
          </p>

          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="mb-4">
            We may use the information we collect about you to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Provide, maintain, and improve our Services, including, for example, to facilitate payments, send receipts, provide products and services you request, develop new features, provide customer support to Users, develop safety features, authenticate users, and send product updates and administrative messages.</li>
            <li>Perform internal operations, including, for example, to prevent fraud and abuse of our Services.</li>
            <li>Personalize and improve the Services, including to provide or recommend features, content, social connections, referrals, and advertisements.</li>
          </ul>

          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">3. Data Security</h2>
          <p className="mb-4">
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
          </p>

          <h2 className="text-xl text-foreground font-semibold mt-8 mb-4">4. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this Privacy Policy, please contact us at privacy@drasa.ai.
          </p>
        </div>
      </div>
    </div>
  );
}
