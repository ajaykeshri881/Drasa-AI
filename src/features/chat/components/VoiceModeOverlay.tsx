import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, X, Loader2, AudioLines } from 'lucide-react';
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

type VoiceState = 'greeting' | 'idle' | 'listening' | 'thinking' | 'speaking';

const GREETING = "Hello! I'm Drasa AI. How can I help you today?";

function getIndianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  return (
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.lang.startsWith('en-IN')) ||
    voices.find(v => v.name.toLowerCase().includes('india')) ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
}

export function VoiceModeOverlay({
  onClose,
  append,
  isLoading,
  messages,
  defaultMode,
  defaultModelId,
}: VoiceModeOverlayProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('greeting');
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastProcessedMessageId = useRef<string | null>(null);
  const isActiveRef = useRef(true); // tracks if overlay is still mounted

  // Cleanup on unmount
  useEffect(() => {
    isActiveRef.current = true;
    synthRef.current = window.speechSynthesis;
    return () => {
      isActiveRef.current = false;
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  // ─── Speak helper ────────────────────────────────────────────────────────────
  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!synthRef.current) { onDone?.(); return; }
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;

    const doSpeak = () => {
      if (!isActiveRef.current) return;
      const voices = synthRef.current!.getVoices();
      const voice = getIndianVoice(voices);
      if (voice) utterance.voice = voice;
      utterance.onend = () => { if (isActiveRef.current) onDone?.(); };
      utterance.onerror = () => { if (isActiveRef.current) onDone?.(); };
      synthRef.current!.speak(utterance);
    };

    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      synthRef.current.onvoiceschanged = () => {
        if (synthRef.current) synthRef.current.onvoiceschanged = null;
        doSpeak();
      };
    }
  }, []);



  // ─── Start listening ─────────────────────────────────────────────────────────
  const startListening = useCallback(function doStartListening() {
    if (!isActiveRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in your browser.');
      onClose();
      return;
    }

    recognitionRef.current?.stop();
    synthRef.current?.cancel();

    setTranscript('');
    setVoiceState('listening');

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' && isActiveRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onend = () => {
      if (!isActiveRef.current) return;
      setTranscript(prev => {
        const text = prev.trim();
        if (text) {
          setVoiceState('thinking');
          append(
            { role: 'user', content: text },
            {
              data: {
                mode: defaultMode,
                provider: defaultModelId.includes('gemini') ? 'gemini' : 'openrouter',
                modelId: defaultModelId,
                hasAttachments: false,
                attachments: [],
              },
            }
          ).catch(() => {
            if (isActiveRef.current) doStartListening();
          });
        } else {
          // Nothing heard — restart
          if (isActiveRef.current) doStartListening();
        }
        return prev;
      });
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch {}
  }, [append, defaultMode, defaultModelId, onClose]);

  // ─── Greet on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    setVoiceState('greeting');
    speak(GREETING, () => {
      if (isActiveRef.current) startListening();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run only once on mount

  // ─── Handle AI response → speak it → listen again ────────────────────────────
  useEffect(() => {
    if (!isLoading && voiceState === 'thinking' && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && last.id !== lastProcessedMessageId.current) {
        lastProcessedMessageId.current = last.id;
        setVoiceState('speaking');

        // Strip markdown for cleaner speech
        const plainText = last.content.replace(/[*#_`~]/g, '');
        speak(plainText, () => {
          if (isActiveRef.current) startListening();
        });
      }
    }
  }, [isLoading, messages, voiceState, speak, startListening]);

  // ─── UI ───────────────────────────────────────────────────────────────────────
  const stateLabel: Record<VoiceState, string> = {
    greeting: 'Greeting...',
    idle:     'Ready',
    listening:'Listening...',
    thinking: 'Processing...',
    speaking: 'Speaking...',
  };

  const stateColors: Record<VoiceState, string> = {
    greeting: 'bg-violet-500 text-white',
    idle:     'bg-muted text-muted-foreground',
    listening:'bg-primary text-primary-foreground',
    thinking: 'bg-blue-500 text-white',
    speaking: 'bg-emerald-500 text-white',
  };

  const ringColors: Record<VoiceState, string> = {
    greeting: 'bg-violet-500/20 scale-[1.8] animate-pulse',
    idle:     'bg-transparent scale-100',
    listening:'bg-primary/20 scale-[2] animate-pulse',
    thinking: 'bg-blue-500/20 scale-[1.5] animate-pulse',
    speaking: 'bg-emerald-500/20 scale-[1.8] animate-bounce',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Close */}
      <button
        onClick={() => {
          recognitionRef.current?.stop();
          synthRef.current?.cancel();
          onClose();
        }}
        className="absolute top-8 right-8 p-3 bg-card border border-border shadow-sm rounded-full hover:bg-accent hover:scale-105 active:scale-95 transition-all"
      >
        <X size={24} className="text-foreground" />
      </button>

      <div className="text-center max-w-2xl w-full flex flex-col items-center">
        {/* Animated circle */}
        <div className="relative mb-12 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${ringColors[voiceState]}`} />
          <div className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-500 ${stateColors[voiceState]}`}>
            {(voiceState === 'listening') && <Mic size={48} className="animate-pulse" />}
            {(voiceState === 'thinking')  && <Loader2 size={48} className="animate-spin" />}
            {(voiceState === 'speaking' || voiceState === 'greeting') && <AudioLines size={48} className="animate-pulse" />}
          </div>
        </div>

        {/* Status */}
        <h2 className="text-4xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
          {stateLabel[voiceState]}
        </h2>

        {/* Transcript / hint */}
        <p className="text-2xl text-muted-foreground/80 min-h-[6rem] px-4 text-center font-medium leading-relaxed max-w-xl">
          {voiceState === 'greeting'  && GREETING}
          {voiceState === 'listening' && (transcript ? `"${transcript}"` : 'Speak now...')}
          {voiceState === 'thinking'  && 'Give me a moment to think.'}
          {voiceState === 'speaking'  && '...'}
        </p>

        {/* Skip button while speaking */}
        {voiceState === 'speaking' && (
          <button
            onClick={() => {
              synthRef.current?.cancel();
              startListening();
            }}
            className="mt-8 px-6 py-2 bg-muted hover:bg-accent rounded-full text-sm font-medium transition-colors"
          >
            Skip &amp; Interrupt
          </button>
        )}
      </div>
    </div>
  );
}
