import React, { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Zap, Square } from "lucide-react";
import { Message } from "ai/react";
import { VoiceModeOverlay } from "./VoiceModeOverlay";
import { useSettingsStore } from "@/features/settings/store/useSettingsStore";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { AttachmentPreview } from "./AttachmentPreview";
import { ModeSelector } from "./ModeSelector";
import { ModelSelector } from "./ModelSelector";
import { InputActions } from "./InputActions";

interface UploadedFile {
  url: string;
  name: string;
  type: "image" | "file" | "audio";
  mimeType: string;
  size: number;
  id?: string;
  progress?: number;
}

interface ModelConfig {
  modelId: string;
  name: string;
  provider: string;
  isPremium: boolean;
  visionSupport?: boolean;
}

interface ChatInputFormProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, options?: any) => void;
  isLoading: boolean;
  stop: () => void;
  messages: Message[];
  append: (message: any, options?: any) => Promise<string | null | undefined>;
  setInput?: (input: string) => void;
}

export function ChatInputForm({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  messages,
  append,
  setInput
}: ChatInputFormProps) {
  const { defaultMode, setDefaultMode, defaultModelId, setDefaultModelId, enterToSend } = useSettingsStore();
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { data: session } = useSession();
  
  const [availableModels, setAvailableModels] = useState<ModelConfig[]>([]);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAvailableModels(data);
      })
      .catch(err => console.error("Failed to fetch models", err));
  }, []);

  const userPlan = session?.user?.plan || "free";
  
  const visibleModels = availableModels;

  const getModelLabel = (id: string) => {
    const m = availableModels.find(m => m.modelId === id);
    if (!m) return "AI Engine";
    
    if (m.isPremium) {
      const premiumModels = availableModels.filter(model => model.isPremium);
      const index = premiumModels.findIndex(model => model.modelId === id);
      return index === 0 ? "Advanced AI Engine" : `Advanced AI Engine ${index + 1}`;
    } else {
      const standardModels = availableModels.filter(model => !model.isPremium);
      const index = standardModels.findIndex(model => model.modelId === id);
      return index === 0 ? "Standard AI Engine" : `Standard AI Engine ${index + 1}`;
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const submitMessage = (overrideInput?: string) => {
    const textToSubmit = overrideInput !== undefined ? overrideInput : input.trim();
    if (textToSubmit && !isLoading) {
      const attachments = attachedFiles.map(f => ({
        url: f.url,
        contentType: f.mimeType,
        name: f.name
      }));

      append({
        role: 'user',
        content: textToSubmit,
        experimental_attachments: attachments.length > 0 ? attachments : undefined
      }, {
        data: {
          mode: defaultMode,
          provider: defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
          modelId: defaultModelId,
          hasAttachments: attachedFiles.length > 0,
          attachments: attachedFiles,
        }
      });
      
      setAttachedFiles([]);
      if (setInput) {
        setInput("");
      } else {
        const syntheticEvent = { target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>;
        handleInputChange(syntheticEvent);
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && enterToSend) {
      e.preventDefault();
      submitMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let allSuccessful = true;
    
    for (const file of Array.from(files)) {
      const tempId = Math.random().toString(36).substring(7);
      const tempUrl = URL.createObjectURL(file);
      const isImage = file.type.startsWith("image/");
      
      const tempFile: UploadedFile = {
        url: tempUrl,
        name: file.name,
        type: isImage ? "image" : file.type.startsWith("audio/") ? "audio" : "file",
        mimeType: file.type,
        size: file.size,
        id: tempId,
        progress: 0
      };
      
      setAttachedFiles(prev => [...prev, tempFile]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", "/api/upload", true);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setAttachedFiles(prev => prev.map(f => 
                f.id === tempId ? { ...f, progress: percentComplete } : f
              ));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const data = JSON.parse(xhr.responseText);
              setAttachedFiles(prev => prev.map(f => 
                f.id === tempId ? { ...data.file, id: tempId, progress: 100 } : f
              ));
              toast.success(`${file.name} attached`);
              resolve(data);
            } else {
              let errorMsg = `Failed to upload ${file.name}`;
              try {
                const errData = JSON.parse(xhr.responseText);
                errorMsg = errData.error || errorMsg;
              } catch (e) {}
              toast.error(errorMsg);
              setAttachedFiles(prev => prev.filter(f => f.id !== tempId));
              allSuccessful = false;
              reject(new Error(errorMsg));
            }
          };

          xhr.onerror = () => {
            toast.error(`Upload failed for ${file.name}. Please try again.`);
            setAttachedFiles(prev => prev.filter(f => f.id !== tempId));
            allSuccessful = false;
            reject(new Error("Network error"));
          };

          xhr.send(formData);
        });
      } catch (error) {
        console.error("Upload error:", error);
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const file = prev[index];
      if (file && file.url.startsWith("blob:")) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const syntheticEvent = {
        target: { value: input + finalTranscript + interimTranscript }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticEvent);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied.");
      } else if (event.error === 'network') {
        toast.error("Network error: Please ensure you have an active internet connection.");
      } else {
        toast.error(`Voice input error (${event.error}).`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const currentInput = textareaRef.current?.value.trim();
      if (currentInput && !isLoading) {
        submitMessage(currentInput);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("Listening... Speak now.");
  };

  return (
    <div className="flex justify-center w-full bg-gradient-to-t from-background via-background to-transparent pt-4 pb-6 px-2 md:pt-10 md:pb-6 md:px-8 shrink-0 z-20">
      {isVoiceModeActive && (
        <VoiceModeOverlay
          onClose={() => setIsVoiceModeActive(false)}
          append={append}
          isLoading={isLoading}
          messages={messages}
          defaultMode={defaultMode}
          defaultModelId={defaultModelId}
        />
      )}
      <div className="w-full max-w-3xl relative">
        {isLoading && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex justify-center z-20">
            <button
              onClick={stop}
              className="flex items-center gap-2 bg-destructive/10 dark:bg-red-500/10 border border-destructive/20 dark:border-red-500/20 hover:bg-destructive/20 dark:hover:bg-red-500/20 text-destructive dark:text-red-400 text-xs font-medium px-4 py-2 rounded-full shadow-lg transition-all"
            >
              <Square size={12} className="fill-current" /> Stop generating
            </button>
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            submitMessage();
          }} 
          className="relative z-10"
        >
          <div className="bg-card dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 dark:focus-within:border-[#4A4946] transition-all duration-300">
            
            <AttachmentPreview files={attachedFiles} onRemove={removeFile} />

            <textarea
              id="chat-input"
              name="chat-input"
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              placeholder="Ask Drasa anything..."
              className="w-full bg-transparent border-none outline-none resize-none px-5 pt-4 pb-2 text-foreground dark:text-[#E6E4DF] placeholder:text-muted-foreground dark:placeholder:text-[#73726E] min-h-[56px] max-h-[200px]"
              rows={1}
            />
            
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <InputActions 
                fileInputRef={fileInputRef}
                isUploading={isUploading}
                handleFileUpload={handleFileUpload}
                isRecording={isRecording}
                toggleVoiceInput={toggleVoiceInput}
                setIsVoiceModeActive={setIsVoiceModeActive}
              />
              
              <div className="flex items-center gap-2 relative">
                <ModeSelector 
                  defaultMode={defaultMode}
                  setDefaultMode={setDefaultMode}
                  isOpen={isModeSelectorOpen}
                  setIsOpen={setIsModeSelectorOpen}
                  closeModelSelector={() => setIsModelSelectorOpen(false)}
                />

                <ModelSelector 
                  visibleModels={visibleModels}
                  defaultModelId={defaultModelId}
                  setDefaultModelId={setDefaultModelId}
                  isOpen={isModelSelectorOpen}
                  setIsOpen={setIsModelSelectorOpen}
                  closeModeSelector={() => setIsModeSelectorOpen(false)}
                  getModelLabel={getModelLabel}
                />
                
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading || isUploading}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                    input.trim() && !isLoading && !isUploading
                      ? 'bg-primary dark:bg-[#C36A4F] text-white hover:bg-primary/90 shadow-lg scale-105' 
                      : 'bg-muted dark:bg-[#363532] text-muted-foreground dark:text-[#73726E] cursor-not-allowed'
                  }`}
                >
                  <Zap size={18} className={input.trim() && !isLoading ? "fill-current" : ""} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-[11px] text-[#73726E]">Drasa AI can make mistakes. Please verify important info.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
