"use client";

import React, { useState } from 'react';
import { useChatSession } from '@/hooks/use-chat-session';
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatArea } from "@/components/chat/ChatArea";
import { SplitPaneLayout } from "@/components/layout/SplitPaneLayout";
import { WebsitePreview } from "@/components/artifacts/WebsitePreview";
import { ChatInputForm } from "@/components/chat/ChatInputForm";
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { AI_MODES } from '@/lib/ai/prompts/modes';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function Home() {
  useEffect(() => {
    useChatStore.getState().setActiveChatId(null);
  }, []);
  const { defaultMode, defaultModelId, setDefaultMode, enterToSend } = useSettingsStore();
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    isArtifactOpen,
    setIsArtifactOpen,
    artifactCode,
    setArtifactCode,
    handleSuggestionClick,
    append
  } = useChatSession();

  return (
    <MainLayout>
      <SplitPaneLayout
        isArtifactActive={isArtifactOpen}
        onClosePreview={() => setIsArtifactOpen(false)}
        previewPanel={
          <WebsitePreview 
            code={artifactCode || "<div class='flex h-full items-center justify-center text-gray-500'>Generating website...</div>"} 
            onClose={() => setIsArtifactOpen(false)} 
          />
        }
        chatPanel={
          <div className="flex-1 flex flex-col h-full relative">
            {/* Chat Area & Empty State */}
            <ChatArea 
              messages={messages} 
              isLoading={isLoading} 
              onSuggestionClick={handleSuggestionClick} 
              onViewArtifact={(code) => {
                setArtifactCode(code);
                setIsArtifactOpen(true);
              }}
            />

            {/* Input Form Area */}
            <div className="w-full bg-transparent pt-2 pb-4 z-20">
              <ChatInputForm 
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                messages={messages}
                append={append}
              />
            </div>
          </div>
        }
      />
    </MainLayout>
  );
}
