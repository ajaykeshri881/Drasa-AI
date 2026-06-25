import { toast } from "sonner";
import { ShieldAlert, AlertTriangle, Key, WifiOff, ServerOff, XCircle } from "lucide-react";
import React from "react";
import { useChatStore } from "@/store/useChatStore";

export function handleChatError(error: any) {
  console.error("Chat Error:", error);
  let errorMessage = error.message || "An unknown error occurred.";
  
  try {
    const parsed = JSON.parse(errorMessage);
    if (parsed.error) errorMessage = parsed.error;
  } catch (e) {}

  const errorString = errorMessage.toLowerCase();

  // 1. Rate Limit / Usage Limits
  if (errorString.includes("rate limit") || errorString.includes("limit") || errorString.includes("too many requests") || errorString.includes("429")) {
    useChatStore.getState().setLimitError({
      title: "Usage Limit Reached",
      message: errorMessage,
      isUpgrade: errorString.includes("upgrade")
    });
    return;
  }

  // 2. Plan Restriction / Free Tier Limits
  if (errorString.includes("restricted") || errorString.includes("upgrade") || errorString.includes("premium feature")) {
    toast.error("Premium Feature", {
      description: errorMessage,
      duration: 6000,
      icon: React.createElement(ShieldAlert, { className: "text-purple-500" }),
      className: "border-purple-500/50 bg-purple-500/10",
      action: {
        label: "Upgrade Plan",
        onClick: () => {
          window.location.href = "/pricing";
        }
      }
    });
    return;
  }

  // 3. API Key Missing
  if (errorString.includes("not configured") || errorString.includes("api key")) {
    toast.error("Configuration Error", {
      description: "An API key is missing. Contact the administrator.",
      duration: 10000,
      icon: React.createElement(Key, { className: "text-red-500" }),
      className: "border-red-500/50 bg-red-500/10",
    });
    return;
  }

  // 4. Network Error
  if (errorString.includes("failed to fetch") || errorString.includes("network error")) {
    toast.error("Connection Lost", {
      description: "Check your internet connection and try again.",
      duration: Infinity,
      icon: React.createElement(WifiOff, { className: "text-gray-400" }),
      action: {
        label: "Dismiss",
        onClick: () => {}
      }
    });
    return;
  }

  // 5. Provider Down / High Demand
  if (errorString.includes("high demand") || errorString.includes("server issue") || errorString.includes("both primary and fallback") || errorString.includes("service unavailable")) {
    useChatStore.getState().setLimitError({
      title: "Server Issue / High Demand",
      message: errorMessage,
      isUpgrade: false
    });
    return;
  }

  // 6. Generic Error
  toast.error("Chat Error", {
    description: errorMessage,
    duration: 5000,
    icon: React.createElement(XCircle, { className: "text-red-500" }),
    className: "border-red-500/50 bg-red-500/10",
  });
}
