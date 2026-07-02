import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionSectionProps {
  userData: any;
  setUserData: (data: any) => void;
  updateSession: (data: any) => Promise<any>;
}

export function SubscriptionSection({ userData, setUserData, updateSession }: SubscriptionSectionProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!userData || userData.plan === 'free') return null;

  const handleCancelSubscription = async () => {
    if (window.confirm("Are you sure you want to cancel your subscription and turn off Auto-pay? You will be immediately downgraded to the Free plan.")) {
      setIsCancelling(true);
      try {
        const res = await fetch("/api/payments/cancel", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          toast.success("Subscription cancelled successfully.");
          setUserData({ ...userData, plan: "free", razorpaySubscriptionId: null });
          await updateSession({ user: { plan: "free" } });
        } else {
          toast.error(data.error || "Failed to cancel subscription");
        }
      } catch (err) {
        toast.error("An error occurred while cancelling.");
      } finally {
        setIsCancelling(false);
      }
    }
  };

  return (
    <section className="bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground dark:text-[#E6E4DF] flex items-center gap-2">
          <Shield size={18} className="text-primary dark:text-[#C36A4F]" />
          Subscription Management
        </h2>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
          <div>
            <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Current Plan</div>
            <div className="text-xs text-muted-foreground dark:text-[#8A8985] uppercase tracking-wider">{userData.plan}</div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
          <div>
            <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Status</div>
            <div className="text-xs font-medium">
              {userData.planExpiryDate && new Date(userData.planExpiryDate) < new Date() ? (
                <span className="text-destructive">Expired</span>
              ) : (
                <span className="text-green-500">Active</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-border/50 dark:border-[#33312E]/50">
          <div>
            <div className="font-medium text-foreground dark:text-[#E6E4DF] mb-1">Next Billing / Expiry Date</div>
            <div className="text-xs text-muted-foreground dark:text-[#8A8985]">
              {userData.planExpiryDate 
                ? new Date(userData.planExpiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                : "Lifetime / N/A"}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-2 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => window.location.href = '/upgrade'}
            className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border dark:border-[#33312E] text-foreground text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Renew or Change Plan
          </button>
          <button 
            onClick={handleCancelSubscription}
            disabled={isCancelling}
            className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 border border-transparent dark:border-red-900/30 text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isCancelling ? "Cancelling..." : "Cancel Subscription"}
          </button>
        </div>
      </div>
    </section>
  );
}
