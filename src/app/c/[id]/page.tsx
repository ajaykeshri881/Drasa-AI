"use client";

import { use } from 'react';
import { useChatSession } from '@/features/chat/hooks/use-chat-session';
import { ChatArea } from "@/features/chat/components/ChatArea";
import { SplitPaneLayout } from "@/components/layout/SplitPaneLayout";
import { WebsitePreview } from "@/features/artifacts/components/WebsitePreview";
import { ChatInputForm } from "@/features/chat/components/ChatInputForm";
import { useSettingsStore } from '@/features/settings/store/useSettingsStore';
import { useChatStore } from '@/features/chat/store/useChatStore';
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
    append,
    setInput
  } = useChatSession({ id: chatId });

  if (!isLoaded) return <Loading />;

  return (
    <>
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
                setInput={setInput}
              />
            </div>
          </div>
        }
      />
    </>
  );
}
