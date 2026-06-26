"use client";

import { use } from 'react';
import { useChatSession } from '@/hooks/use-chat-session';
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatArea } from "@/components/chat/ChatArea";
import { SplitPaneLayout } from "@/components/layout/SplitPaneLayout";
import { WebsitePreview } from "@/components/artifacts/WebsitePreview";
import { ChatInputForm } from "@/components/chat/ChatInputForm";
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';
import { AI_MODES } from '@/lib/ai/prompts/modes';
import { toast } from 'sonner';
import Loading from '@/app/loading';

export default function ChatHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: chatId } = use(params);
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
    isLoaded,
    append
  } = useChatSession({ id: chatId });

  if (!isLoaded) return <Loading />;

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
            <ChatArea 
              messages={messages} 
              isLoading={isLoading} 
              onSuggestionClick={handleSuggestionClick} 
              onViewArtifact={(code) => {
                setArtifactCode(code);
                setIsArtifactOpen(true);
              }}
            />

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
