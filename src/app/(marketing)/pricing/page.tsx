import React from "react";
import { Check } from "lucide-react";
import { CheckoutButton } from "@/components/payments/CheckoutButton";
import { MainLayout } from "@/components/layout/MainLayout";
import { auth } from "@/lib/auth/auth";
import Link from "next/link";

export const metadata = {
  title: "Pricing | Drasa AI",
};

export default async function PricingPage() {
  const session = await auth();
  const currentPlan = session?.user?.plan || "free";
  
  return (
    <MainLayout>
      <div className="min-h-screen bg-background dark:bg-[#1A1918] py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-serif text-foreground dark:text-white mb-6 tracking-tight">Simple, transparent pricing</h1>
            <p className="text-lg text-muted-foreground dark:text-[#8A8985]">
              Unlock the full power of Drasa AI with premium models like Gemini 1.5 Pro and GPT-4o, higher usage limits, and unlimited Website generation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-card dark:bg-[#1F1E1D] border border-border dark:border-[#33312E] rounded-3xl p-8 shadow-sm flex flex-col">
              <h3 className="text-xl font-medium text-foreground dark:text-[#E6E4DF] mb-2">Free</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-semibold text-foreground dark:text-white">₹0</span>
                <span className="text-muted-foreground dark:text-[#73726E]">/month</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-[#8A8985] mb-8">Perfect for casually trying out the platform.</p>
              
              {currentPlan === "free" ? (
                <div className="w-full py-3 px-4 bg-secondary dark:bg-[#3A3935] text-secondary-foreground dark:text-[#8A8985] text-center rounded-xl font-medium mb-8 cursor-not-allowed">
                  Current Plan
                </div>
              ) : (
                <div className="w-full py-3 px-4 bg-secondary dark:bg-[#3A3935] text-secondary-foreground dark:text-[#8A8985] text-center rounded-xl font-medium mb-8 cursor-not-allowed">
                  Included
                </div>
              )}

              <div className="space-y-4 flex-1">
                <FeatureItem text="Basic open-source models" />
                <FeatureItem text="20 messages per day" />
                <FeatureItem text="3 file uploads per day" />
                <FeatureItem text="4 website generations per month" />
              </div>
            </div>


            {/* Starter Plan */}
            <div className="bg-card dark:bg-[#1F1E1D] border border-border dark:border-[#33312E] rounded-3xl p-6 shadow-sm flex flex-col">
              <h3 className="text-xl font-medium text-foreground dark:text-[#E6E4DF] mb-2">Starter</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-semibold text-foreground dark:text-white">₹199</span>
                <span className="text-muted-foreground dark:text-[#73726E]">/month</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-[#8A8985] mb-8">Everything you need for serious daily usage.</p>
              
              {currentPlan === "starter" ? (
                <Link href="/preferences" className="w-full py-3 px-4 bg-secondary dark:bg-white/10 text-secondary-foreground dark:text-white text-center hover:bg-secondary/80 dark:hover:bg-white/20 rounded-xl font-medium mb-8 transition-colors block">
                  Manage Subscription
                </Link>
              ) : (
                <CheckoutButton 
                  planId="starter" 
                  planName="Starter" 
                  amount={199}
                  className="w-full py-3 px-4 bg-secondary dark:bg-white/10 hover:bg-secondary/80 dark:hover:bg-white/20 text-secondary-foreground dark:text-white rounded-xl font-medium mb-8 transition-colors"
                >
                  Get Starter
                </CheckoutButton>
              )}

              <div className="space-y-4 flex-1">
                <FeatureItem text="Basic open-source models" />
                <FeatureItem text="50 messages per day" />
                <FeatureItem text="10 file uploads per day" />
                <FeatureItem text="10 website generations per month" />
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-card dark:bg-[#262523] border-2 border-primary dark:border-[#C36A4F] rounded-3xl p-8 shadow-xl relative flex flex-col transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary dark:bg-[#C36A4F] text-white text-xs font-bold uppercase tracking-wider rounded-full">
                Most Popular
              </div>
              <h3 className="text-xl font-medium text-foreground dark:text-[#E6E4DF] mb-2">Pro</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-semibold text-foreground dark:text-white">₹399</span>
                <span className="text-muted-foreground dark:text-[#73726E]">/month</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-[#8A8985] mb-8">Premium models and higher limits for professionals.</p>
              
              {currentPlan === "pro" ? (
                <Link href="/preferences" className="w-full py-3 px-4 bg-primary hover:bg-primary/90 dark:bg-[#C36A4F] dark:hover:bg-[#C36A4F]/90 text-primary-foreground dark:text-[#1A1918] text-center rounded-xl font-medium mb-8 transition-colors shadow-sm block">
                  Manage Subscription
                </Link>
              ) : (
                <CheckoutButton 
                  planId="pro" 
                  planName="Pro" 
                  amount={399}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/90 dark:bg-[#C36A4F] dark:hover:bg-[#C36A4F]/90 text-primary-foreground dark:text-[#1A1918] rounded-xl font-medium mb-8 transition-colors shadow-sm"
                >
                  Upgrade to Pro
                </CheckoutButton>
              )}

              <div className="space-y-4 flex-1">
                <FeatureItem text="Access to Gemini 1.5 Pro & Flash" />
                <FeatureItem text="Access to GPT-4o & Claude 3.5" />
                <FeatureItem text="200 messages per day" />
                <FeatureItem text="20 file uploads per day" />
                <FeatureItem text="20 website generations per month" />
              </div>
            </div>

            {/* Ultimate Plan */}
            <div className="bg-card dark:bg-[#1F1E1D] border border-border dark:border-[#33312E] rounded-3xl p-8 shadow-sm flex flex-col">
              <h3 className="text-xl font-medium text-foreground dark:text-[#E6E4DF] mb-2">Ultimate</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-semibold text-foreground dark:text-white">₹999</span>
                <span className="text-muted-foreground dark:text-[#73726E]">/month</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-[#8A8985] mb-8">Unlimited power for power users.</p>
              
              {currentPlan === "ultimate" ? (
                <Link href="/preferences" className="w-full py-3 px-4 bg-foreground dark:bg-[#E6E4DF] hover:bg-foreground/90 dark:hover:bg-white text-background dark:text-[#1A1918] text-center rounded-xl font-medium mb-8 transition-colors shadow-sm block">
                  Manage Subscription
                </Link>
              ) : (
                <CheckoutButton 
                  planId="ultimate" 
                  planName="Ultimate" 
                  amount={999}
                  className="w-full py-3 px-4 bg-foreground dark:bg-[#E6E4DF] hover:bg-foreground/90 dark:hover:bg-white text-background dark:text-[#1A1918] rounded-xl font-medium mb-8 transition-colors shadow-sm"
                >
                  Upgrade to Ultimate
                </CheckoutButton>
              )}

              <div className="space-y-4 flex-1">
                <FeatureItem text="Highest priority routing" />
                <FeatureItem text="Unlimited messages" />
                <FeatureItem text="100 file uploads per day" />
                <FeatureItem text="100 website generations per month" />
                <FeatureItem text="Long-context memory processing" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-1 bg-primary/10 dark:bg-[#C36A4F]/20 text-primary dark:text-[#C36A4F] rounded-full flex-shrink-0">
        <Check size={12} strokeWidth={3} />
      </div>
      <span className="text-sm text-foreground/80 dark:text-[#D4D2CD]">{text}</span>
    </div>
  );
}
