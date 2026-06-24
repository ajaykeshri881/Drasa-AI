import React, { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Paperclip, Mic, ChevronDown, Terminal, ImageIcon, Zap, Sparkles, Search, Square, Cpu, X, FileText, Image as ImageIcon2, MicOff, Headset } from "lucide-react";
import { Message } from "ai/react";
import { VoiceModeOverlay } from "./VoiceModeOverlay";
import { AI_MODES, AIMode } from "@/lib/ai/prompts/modes";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface UploadedFile {
  url: string;
  name: string;
  type: "image" | "file" | "audio";
  mimeType: string;
  size: number;
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
}

export function ChatInputForm({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  messages,
  append
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
  
  // Enforce available models based on user plan
  const visibleModels = availableModels.filter(model => {
    if (userPlan === "free") return !model.isPremium;
    return true; // paid plans get all models
  });

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && enterToSend) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>, {
          data: {
            mode: defaultMode,
            provider: defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
            modelId: defaultModelId,
            hasAttachments: attachedFiles.length > 0,
            attachments: attachedFiles,
          }
        });
        setAttachedFiles([]);
      }
    }
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setAttachedFiles(prev => [...prev, data.file]);
          toast.success(`${file.name} attached`);
        } else {
          const err = await res.json();
          toast.error(err.error || `Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Voice Input Handler — Web Speech API
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // Start recording
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

      // Update textarea with transcribed text
      const syntheticEvent = {
        target: { value: input + finalTranscript + interimTranscript }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticEvent);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please allow microphone access in your browser settings.");
      } else if (event.error === 'network') {
        toast.error("Network error: Please ensure you have an active internet connection. Chrome requires internet access for speech recognition.");
      } else {
        toast.error(`Voice input error (${event.error}). Please try again.`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      
      // Auto-submit if voice mode captured text
      const currentInput = textareaRef.current?.value.trim();
      if (currentInput && !isLoading) {
        handleSubmit({ preventDefault: () => {} } as any, {
          data: {
            mode: defaultMode,
            provider: defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
            modelId: defaultModelId,
            hasAttachments: attachedFiles.length > 0,
            attachments: attachedFiles,
          }
        });
        setAttachedFiles([]);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.success("Listening... Speak now.");
  };

  return (
    <div className="flex justify-center w-full bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4 md:px-8 shrink-0">
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
        {/* Stop Button (only shows when generating) */}
        {isLoading && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex justify-center z-20">
            <button
              onClick={stop}
              className="flex items-center gap-2 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#32302D] text-muted-foreground dark:text-[#A3A19C] text-xs font-medium px-4 py-2 rounded-full shadow-lg transition-all"
            >
              <Square size={12} className="fill-current" /> Stop generating
            </button>
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e, {
              data: {
                mode: defaultMode,
                provider: defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
                modelId: defaultModelId,
                hasAttachments: attachedFiles.length > 0,
                attachments: attachedFiles,
              }
            });
            setAttachedFiles([]);
          }} 
          className="relative z-10"
        >
          <div className="bg-card dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 dark:focus-within:border-[#4A4946] transition-all duration-300">
            
            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-muted dark:bg-[#2A2928] border border-border/50 dark:border-[#33312E] rounded-xl px-3 py-1.5 text-xs group"
                  >
                    {file.type === "image" ? (
                      <ImageIcon2 size={14} className="text-blue-500" />
                    ) : (
                      <FileText size={14} className="text-primary dark:text-[#C36A4F]" />
                    )}
                    <span className="text-foreground/80 dark:text-[#D4D2CD] max-w-[120px] truncate">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-0.5 text-muted-foreground hover:text-destructive dark:hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              placeholder="Ask Drasa anything..."
              className="w-full bg-transparent border-none outline-none resize-none px-5 pt-4 pb-2 text-foreground dark:text-[#E6E4DF] placeholder:text-muted-foreground dark:placeholder:text-[#73726E] min-h-[56px] max-h-[200px]"
              rows={1}
            />
            
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex items-center gap-1">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.webm"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isUploading 
                        ? 'text-primary dark:text-[#C36A4F] animate-pulse cursor-wait' 
                        : 'text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-accent dark:hover:bg-[#363532]'
                    }`}
                  >
                    <Paperclip size={18} />
                  </TooltipTrigger>
                  <TooltipContent>{isUploading ? "Uploading..." : "Attach file (PDF, image, doc)"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isRecording
                        ? 'text-red-500 bg-red-500/10 animate-pulse'
                        : 'text-muted-foreground hover:text-foreground dark:text-[#8A8985] dark:hover:text-[#E6E4DF] hover:bg-accent dark:hover:bg-[#363532]'
                    }`}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </TooltipTrigger>
                  <TooltipContent>{isRecording ? "Stop recording" : "Voice dictation"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    onClick={() => setIsVoiceModeActive(true)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary dark:text-[#8A8985] dark:hover:text-[#C36A4F] hover:bg-primary/10 transition-colors"
                  >
                    <Headset size={18} />
                  </TooltipTrigger>
                  <TooltipContent>Start Continuous Voice Mode</TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex items-center gap-2 relative">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModeSelectorOpen(!isModeSelectorOpen);
                    setIsModelSelectorOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground dark:text-[#A3A19C] dark:hover:text-[#E6E4DF] px-3 py-1.5 rounded-lg hover:bg-accent dark:hover:bg-[#363532] transition-all duration-200"
                >
                  {Object.entries(AI_MODES).find(([id]) => id === defaultMode)?.[1].name || "Balanced"} <ChevronDown size={14} className={`transition-transform duration-200 ${isModeSelectorOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mode Selector Dropdown */}
                {isModeSelectorOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {Object.entries(AI_MODES).map(([id, mode]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setDefaultMode(id as any);
                          setIsModeSelectorOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                          defaultMode === id 
                            ? 'bg-accent dark:bg-[#363532] text-foreground dark:text-[#E6E4DF] font-medium' 
                            : 'text-muted-foreground dark:text-[#A3A19C] hover:bg-accent/50 dark:hover:bg-[#363532]/50 hover:text-foreground dark:hover:text-[#E6E4DF]'
                        }`}
                      >
                        <span className={defaultMode === id ? 'text-primary dark:text-[#C36A4F]' : ''}>
                          {id === 'code' ? <Terminal size={14} /> : 
                          id === 'vision' ? <ImageIcon size={14} /> : 
                          id === 'auto' ? <Sparkles size={14} /> : <Search size={14} />}
                        </span>
                        {mode.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Model Selector (Only for paid users) */}
                {userPlan !== "free" && (
                  <>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsModelSelectorOpen(!isModelSelectorOpen);
                        setIsModeSelectorOpen(false);
                      }}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground dark:text-[#A3A19C] dark:hover:text-[#E6E4DF] px-3 py-1.5 rounded-lg hover:bg-accent dark:hover:bg-[#363532] transition-all duration-200"
                    >
                      <Cpu size={14} className={defaultModelId.includes('gemini') ? 'text-primary' : ''} />
                      {getModelLabel(defaultModelId)} <ChevronDown size={14} className={`transition-transform duration-200 ${isModelSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Model Selector Dropdown */}
                    {isModelSelectorOpen && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-card dark:bg-[#2A2928] border border-border dark:border-[#33312E] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {visibleModels.map((model) => (
                          <button
                            key={model.modelId}
                            type="button"
                            onClick={() => {
                              setDefaultModelId(model.modelId);
                              setIsModelSelectorOpen(false);
                            }}
                            className={`w-full flex flex-col items-start px-3 py-2.5 rounded-lg transition-colors ${
                              defaultModelId === model.modelId 
                                ? "bg-primary/5 dark:bg-[#C36A4F]/10 border border-primary/20 dark:border-[#C36A4F]/20" 
                                : "hover:bg-accent dark:hover:bg-[#32302D] border border-transparent"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-0.5">
                              <span className={`text-[13px] font-semibold ${defaultModelId === model.modelId ? "text-primary dark:text-[#C36A4F]" : "text-foreground dark:text-[#E6E4DF]"}`}>
                                {getModelLabel(model.modelId)}
                              </span>
                              {model.isPremium && (
                                <span className="text-[10px] uppercase font-bold tracking-wider text-primary dark:text-[#C36A4F] bg-primary/10 dark:bg-[#C36A4F]/20 px-1.5 py-0.5 rounded">
                                  Pro
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                    input.trim() && !isLoading
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
