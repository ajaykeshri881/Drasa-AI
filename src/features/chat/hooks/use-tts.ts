import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useTTS(content: string) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (isPlaying) window.speechSynthesis.cancel();
    };
  }, [isPlaying]);

  const handleTTS = () => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech is not supported in your browser.");
      return;
    }
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const plainText = content.replace(/[*#_`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(v => v.lang === 'en-IN')
        || voices.find(v => v.lang.startsWith('en-IN'))
        || voices.find(v => v.lang.startsWith('en'));
      if (indianVoice) utterance.voice = indianVoice;
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    };

    setIsPlaying(true);
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        setVoiceAndSpeak();
      };
    }
  };

  return { isPlaying, handleTTS };
}
