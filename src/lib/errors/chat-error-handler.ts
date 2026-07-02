import { toast } from "sonner";
import { ShieldAlert, AlertTriangle, Key, WifiOff, ServerOff, XCircle } from "lucide-react";
import React from "react";
import { useChatStore } from "@/features/chat/store/useChatStore";

export function handleChatError(error: any) {
  console.error("Chat Error:", error);
  let errorMessage = error.message || "An unknown error occurred.";
  
  try {
    const parsed = JSON.parse(errorMessage);
    // If backend provided details, use them as the primary error message to preserve fallback context
    if (parsed.details) {
      errorMessage = parsed.details;
    } else if (parsed.error) {
      errorMessage = parsed.error;
    }
  } catch (e) {}

  const errorString = errorMessage.toLowerCase();

  // 1. Model Provider Server Issue
  if (errorString.includes("model provider server issue")) {
    useChatStore.getState().setLimitError({
      title: "Provider Server Issue",
      message: "The AI model provider's servers are currently experiencing issues. Please try again later.",
      isUpgrade: false
    });
    return;
  }

  // 2. Provider Down / High Demand
  if (errorString.includes("high demand") || errorString.includes("both primary and fallback") || errorString.includes("service unavailable")) {
    useChatStore.getState().setLimitError({
      title: "High Demand",
      message: "We are currently experiencing high demand. Please wait a moment and try again.",
      isUpgrade: false
    });
    return;
  }

  // 3. Provider Rate Limit / Quota Exceeded
  if (errorString.includes("model provider rate limit") || errorString.includes("quota exceeded") || errorString.includes("insufficient quota") || errorString.includes("generativelanguage")) {
    useChatStore.getState().setLimitError({
      title: "Provider Limit Reached",
      message: "The AI model provider has reached its rate limit or quota. Please try again later or try a different model.",
      isUpgrade: false
    });
    return;
  }
  
  // 4. Server Rate Limit (Upstash / too many requests from user to our API)
  if (errorString.includes("too many requests. please try again later") && !errorString.includes("primary:")) {
    useChatStore.getState().setLimitError({
      title: "Slow Down",
      message: "You are sending too many requests. Please wait a moment before sending another message.",
      isUpgrade: false
    });
    return;
  }

  // 5. User Usage Limits (Token limits, Plan limits in Drasa AI)
  if (errorString.includes("limit") || errorString.includes("reached your")) {
    useChatStore.getState().setLimitError({
      title: "Usage Limit Reached",
      message: errorMessage,
      isUpgrade: errorString.includes("upgrade") || errorString.includes("premium")
    });
    return;
  }

  // 4. Plan Restriction / Free Tier Limits
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

  // 5. API Key Missing
  if (errorString.includes("not configured") || errorString.includes("api key")) {
    toast.error("Configuration Error", {
      description: "An API key is missing. Contact the administrator.",
      duration: 10000,
      icon: React.createElement(Key, { className: "text-red-500" }),
      className: "border-red-500/50 bg-red-500/10",
    });
    return;
  }

  // 6. Network Error
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


  // 7. Generic Error
  toast.error("Chat Error", {
    description: errorMessage,
    duration: 5000,
    icon: React.createElement(XCircle, { className: "text-red-500" }),
    className: "border-red-500/50 bg-red-500/10",
  });
}
