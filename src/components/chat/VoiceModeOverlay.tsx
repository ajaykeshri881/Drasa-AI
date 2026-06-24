import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, X, Loader2, Volume2, AudioLines } from 'lucide-react';
import { Message } from 'ai/react';
import { toast } from 'sonner';

interface VoiceModeOverlayProps {
  onClose: () => void;
  append: (message: any, options?: any) => Promise<string | null | undefined>;
  isLoading: boolean;
  messages: Message[];
  defaultMode: string;
  defaultModelId: string;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function VoiceModeOverlay({ 
  onClose, 
  append, 
  isLoading, 
  messages,
  defaultMode,
  defaultModelId
}: VoiceModeOverlayProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('listening');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastProcessedMessageId = useRef<string | null>(null);
  const restartListeningRef = useRef<(() => void) | null>(null);

  // Initialize SpeechSynthesis
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in your browser.");
      onClose();
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    setTranscript('');
    setVoiceState('listening');

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop automatically when user finishes sentence
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Restart listening if no speech detected
        try { recognition.start(); } catch (e) {}
      }
    };

    recognition.onend = () => {
      setTranscript(prev => {
        if (prev.trim()) {
          setVoiceState('thinking');
          append(
            { role: 'user', content: prev.trim() },
            {
              data: {
                mode: defaultMode,
                provider: defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
                modelId: defaultModelId,
                hasAttachments: false,
                attachments: [],
              }
            }
          ).catch(() => {
            setVoiceState('listening');
            restartListeningRef.current?.();
          });
        } else {
          // No transcript captured, restart listening
          restartListeningRef.current?.();
        }
        return prev;
      });
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  }, [append, defaultMode, defaultModelId, onClose]);

  useEffect(() => {
    restartListeningRef.current = startListening;
  }, [startListening]);

  // Initial auto-start
  useEffect(() => {
    startListening();
  }, [startListening]);

  // Handle Response TTS Loop
  useEffect(() => {
    // If not loading anymore and we were thinking, it means the response arrived
    if (!isLoading && voiceState === 'thinking' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.role === 'assistant' && lastMessage.id !== lastProcessedMessageId.current) {
        lastProcessedMessageId.current = lastMessage.id;
        setVoiceState('speaking');
        
        if (synthRef.current) {
          const utterance = new SpeechSynthesisUtterance(lastMessage.content);
          
          // Optional: Choose a good voice if available
          const voices = synthRef.current.getVoices();
          const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
          if (preferredVoice) utterance.voice = preferredVoice;
          
          utterance.rate = 1.0; // Normal speed
          
          utterance.onend = () => {
            // Once AI finishes speaking, go back to listening!
            startListening();
          };
          
          utterance.onerror = () => {
            startListening();
          };

          synthRef.current.speak(utterance);
        } else {
          // If no synth, just go back to listening
          startListening();
        }
      }
    }
  }, [isLoading, messages, voiceState, startListening]);


  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <button 
        onClick={() => {
          if (recognitionRef.current) recognitionRef.current.stop();
          if (synthRef.current) synthRef.current.cancel();
          onClose();
        }}
        className="absolute top-8 right-8 p-3 bg-card border border-border shadow-sm rounded-full hover:bg-accent hover:scale-105 active:scale-95 transition-all"
      >
        <X size={24} className="text-foreground" />
      </button>

      <div className="text-center max-w-2xl w-full flex flex-col items-center">
        {/* Animated Circle */}
        <div className="relative mb-12 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
            voiceState === 'listening' ? 'bg-primary/20 scale-[2] animate-pulse' :
            voiceState === 'thinking' ? 'bg-blue-500/20 scale-[1.5] animate-pulse' :
            voiceState === 'speaking' ? 'bg-emerald-500/20 scale-[1.8] animate-bounce' : 'bg-transparent scale-100'
          }`} />
          
          <div className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-500 ${
            voiceState === 'listening' ? 'bg-primary text-primary-foreground' :
            voiceState === 'thinking' ? 'bg-blue-500 text-white' :
            voiceState === 'speaking' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {voiceState === 'listening' && <Mic size={48} className="animate-pulse" />}
            {voiceState === 'thinking' && <Loader2 size={48} className="animate-spin" />}
            {voiceState === 'speaking' && <AudioLines size={48} className="animate-pulse" />}
          </div>
        </div>

        {/* Status Text */}
        <h2 className="text-4xl font-bold mb-6 capitalize tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
          {voiceState === 'listening' ? "Listening..." :
           voiceState === 'thinking' ? "Processing..." :
           "Speaking..."}
        </h2>

        {/* Transcript */}
        <p className="text-2xl text-muted-foreground/80 min-h-[6rem] px-4 text-center font-medium leading-relaxed max-w-xl">
          {voiceState === 'listening' && transcript ? `"${transcript}"` : 
           voiceState === 'listening' ? "Speak now..." :
           voiceState === 'thinking' ? "Give me a moment to think." :
           "..."}
        </p>

        {voiceState === 'speaking' && (
          <button 
            onClick={() => {
              if (synthRef.current) synthRef.current.cancel();
              startListening();
            }}
            className="mt-8 px-6 py-2 bg-muted hover:bg-accent rounded-full text-sm font-medium transition-colors"
          >
            Skip & Interrupt
          </button>
        )}
      </div>
    </div>
  );
}
