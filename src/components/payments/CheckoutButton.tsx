"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface CheckoutButtonProps {
  planId: "starter" | "pro" | "ultimate";
  planName: string;
  amount: number;
  className?: string;
  children?: React.ReactNode;
}

export function CheckoutButton({ planId, planName, amount, className, children }: CheckoutButtonProps) {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPay, setIsAutoPay] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsLoading(true);

    try {
      // 1. Load the script
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setIsLoading(false);
        return;
      }

      // 2. Create the Order on our backend
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, amount, autoPay: isAutoPay }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        toast.error(orderData.error || "Failed to create order");
        setIsLoading(false);
        return;
      }

      // 3. Initialize Razorpay Checkout
      const options: any = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Drasa AI",
        description: `Upgrade to ${planName} Plan`,
        image: "/favicon.ico", // Using app favicon as logo
        handler: async function (response: any) {
          // 4. Verify payment on our backend
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            toast.success(`Payment successful! You are now a ${planName} user!`);
            if (session) {
              await update({ plan: planId });
            }
            window.location.href = "/"; // Redirect back to chat
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: orderData.user?.name || "",
          email: orderData.user?.email || "",
        },
        theme: {
          color: "#C36A4F", // Match Drasa AI primary color
        },
      };

      if (orderData.isSubscription) {
        options.subscription_id = orderData.id;
      } else {
        options.order_id = orderData.id;
      }

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error("Checkout flow failed:", error);
      toast.error("Something went wrong during checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full mb-8">
      <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground dark:text-[#8A8985] cursor-pointer">
        <input 
          type="checkbox" 
          checked={isAutoPay} 
          onChange={(e) => setIsAutoPay(e.target.checked)} 
          className="rounded border-border accent-primary cursor-pointer w-4 h-4" 
        />
        Auto-pay (Recurring Monthly)
      </label>
      <button 
        onClick={handlePayment} 
        disabled={isLoading}
        className={className}
      >
        {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (children || "Upgrade Now")}
      </button>
    </div>
  );
}
