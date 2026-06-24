"use client";

import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Check, Sparkles, Shield, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Script from "next/script";
import { useRouter } from "next/navigation";

const PRICING_TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfect for casual users testing the waters.",
    features: [
      "2K tokens/day",
      "25K tokens/month",
      "Basic AI Models",
      "Standard Web Search",
      "Real-time Voice Mode",
      "Coding Expert Mode",
    ],
    icon: <Shield size={24} />,
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20"
  },
  {
    id: "starter",
    name: "Starter",
    price: 199,
    description: "For hobbyists needing a bit more power.",
    features: [
      "5K tokens/day",
      "150K tokens/month",
      "Basic AI Models",
      "Standard Web Search",
      "Real-time Voice Mode",
    ],
    icon: <Sparkles size={24} />,
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20"
  },
  {
    id: "pro",
    name: "Pro",
    price: 399,
    description: "For professionals needing reliable usage.",
    features: [
      "30K tokens/day",
      "750K tokens/month",
      "Premium Models",
      "Advanced Coding Expert Mode",
      "Real-time Voice Mode",
    ],
    icon: <Sparkles size={24} />,
    color: "text-primary dark:text-[#C36A4F]",
    bg: "bg-primary/10 dark:bg-[#C36A4F]/10 border-primary/30 dark:border-[#C36A4F]/30"
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 999,
    description: "For power users who demand the best.",
    features: [
      "100K tokens/day",
      "2M tokens/month",
      "All Premium & Experimental Models",
      "Priority API Access",
      "Real-time Voice Mode",
      "Advanced Coding Expert Mode",
    ],
    icon: <Sparkles size={24} />,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20"
  }
];

export default function UpgradePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isAutoPay, setIsAutoPay] = useState(false);

  const handleUpgrade = async (tier: typeof PRICING_TIERS[0]) => {
    if (!session) {
      toast.error("Please sign in to upgrade your plan.");
      router.push("/login");
      return;
    }

    if (tier.id === "free") return;

    setIsProcessing(tier.id);
    try {
      // 1. Create order on our backend
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: tier.price, planId: tier.id, autoPay: isAutoPay })
      });
      
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Initialize Razorpay Checkout
      const options: any = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YourKeyId",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Drasa AI",
        description: `Upgrade to ${tier.name} Plan`,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on our backend
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: tier.id
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              toast.success(`Successfully upgraded to ${tier.name} Plan!`);
              // Update session
              await update({ plan: tier.id });
              router.push("/preferences");
            } else {
              throw new Error(verifyData.error);
            }
          } catch (e: any) {
            toast.error(e.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: session.user.name || "",
          email: session.user.email || "",
        },
        theme: {
          color: "#C36A4F",
        }
      };

      if (orderData.isSubscription) {
        options.subscription_id = orderData.id;
      } else {
        options.order_id = orderData.id;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment.");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <MainLayout>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="beforeInteractive" />
      <div className="flex-1 overflow-y-auto w-full pt-16 relative z-10 bg-background/50 dark:bg-[#1A1918]/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 pb-20">
          <div className="text-center mb-16 relative">
            <div className="absolute left-1/2 -top-10 -translate-x-1/2 w-64 h-64 bg-primary/20 dark:bg-[#C36A4F]/20 blur-[100px] rounded-full pointer-events-none" />
            <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 dark:from-[#E6E4DF] dark:to-[#8A8985]">
              Upgrade your Drasa AI
            </h1>
            <p className="text-muted-foreground dark:text-[#8A8985] text-lg max-w-2xl mx-auto">
              Supercharge your productivity with higher limits, premium models, and priority access to cutting-edge features.
            </p>
          </div>

          <div className="flex justify-center mb-10">
            <label className="flex items-center gap-3 text-sm font-medium text-muted-foreground dark:text-[#E6E4DF] bg-card dark:bg-[#2A2928]/60 backdrop-blur-xl border rounded-full py-2 px-6 shadow-sm cursor-pointer hover:bg-muted/50 dark:hover:bg-[#33312E] transition-colors">
              <input 
                type="checkbox" 
                checked={isAutoPay} 
                onChange={(e) => setIsAutoPay(e.target.checked)} 
                className="rounded border-border accent-primary cursor-pointer w-4 h-4" 
              />
              Enable Auto-pay (Recurring Monthly)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`flex flex-col h-full relative bg-card dark:bg-[#2A2928]/60 backdrop-blur-xl border rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 group overflow-hidden ${
                  tier.id === "pro" 
                    ? "border-primary/50 dark:border-[#C36A4F]/50 shadow-[0_0_30px_-10px_rgba(195,106,79,0.3)] md:scale-[1.02] z-10" 
                    : tier.id === "ultimate"
                    ? "border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_20px_-10px_rgba(245,158,11,0.2)]"
                    : "border-border/50 dark:border-[#33312E]/50 hover:border-foreground/20 dark:hover:border-[#E6E4DF]/20 hover:shadow-lg"
                }`}
              >
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${
                  tier.id === "pro" ? "from-primary/10 to-transparent dark:from-[#C36A4F]/10" : 
                  tier.id === "ultimate" ? "from-amber-500/10 to-transparent" : 
                  "from-foreground/5 to-transparent dark:from-[#E6E4DF]/5"
                } pointer-events-none`} />

                {session?.user?.plan === tier.id ? (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
                    <div className="px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-b-lg shadow-sm">
                      Current Plan
                    </div>
                  </div>
                ) : tier.id === "pro" && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
                    <div className="px-3 py-1 bg-gradient-to-r from-primary to-[#ff8d6e] dark:from-[#C36A4F] dark:to-[#ff8d6e] text-white dark:text-[#1A1918] text-[10px] font-extrabold uppercase tracking-widest rounded-b-lg shadow-sm">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${tier.bg} ${tier.color}`}>
                    {tier.icon}
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-1 ${
                    tier.id === "ultimate" ? "bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500" : "text-foreground dark:text-[#E6E4DF]"
                  }`}>{tier.name}</h3>
                  <p className="text-xs text-muted-foreground dark:text-[#8A8985] mb-6 h-8 leading-relaxed">{tier.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-foreground dark:text-[#E6E4DF]">
                        {tier.price === 0 ? "Free" : `₹${tier.price}`}
                      </span>
                      {tier.price > 0 && <span className="text-muted-foreground dark:text-[#8A8985] text-xs mb-1 font-medium">/ month</span>}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3 mb-8">
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 group/feature">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex flex-shrink-0 items-center justify-center transition-colors shadow-sm ${
                          tier.id === "pro" ? "bg-primary text-primary-foreground dark:bg-[#C36A4F] dark:text-[#1A1918]" :
                          tier.id === "ultimate" ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white" :
                          "bg-green-500 text-white dark:bg-green-600 dark:text-white"
                        }`}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                        <span className="text-[13px] md:text-sm font-medium text-foreground/80 dark:text-[#D4D2CD] group-hover/feature:text-foreground dark:group-hover/feature:text-white transition-colors leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (session?.user?.plan === tier.id && tier.id !== "free") {
                        window.location.href = '/preferences';
                      } else {
                        handleUpgrade(tier);
                      }
                    }}
                    disabled={isProcessing === tier.id || (session?.user?.plan === tier.id && tier.id === "free")}
                    className={`mt-auto w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden ${
                      session?.user?.plan === tier.id && tier.id !== "free"
                        ? "bg-secondary dark:bg-white/10 text-secondary-foreground dark:text-white border border-transparent hover:bg-secondary/80 dark:hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]"
                        : session?.user?.plan === tier.id && tier.id === "free"
                        ? "bg-secondary dark:bg-[#3A3935] text-secondary-foreground dark:text-[#8A8985] cursor-not-allowed border border-transparent"
                        : tier.id === "pro"
                        ? "bg-primary text-primary-foreground dark:bg-[#C36A4F] dark:text-[#1A1918] hover:shadow-[0_0_20px_rgba(195,106,79,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                        : tier.id === "ultimate"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98] border-none"
                        : "bg-secondary dark:bg-white/10 text-secondary-foreground dark:text-white border border-transparent hover:bg-secondary/80 dark:hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {isProcessing === tier.id ? (
                      <><Loader2 size={18} className="animate-spin" /> Processing...</>
                    ) : session?.user?.plan === tier.id ? (
                      tier.id !== "free" ? "Manage Subscription" : "Current Plan"
                    ) : tier.id === "free" ? (
                      "Included"
                    ) : (
                      "Upgrade Now"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
