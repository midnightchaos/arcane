import { useEffect, useRef, useCallback } from 'react';
import { useVoiceStore } from '@/store/voiceStore';

export const useSpeechToText = (onResult: (text: string) => void) => {
  const recognitionRef = useRef<any>(null);
  const { isListening, setIsListening } = useVoiceStore();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Avoid double initialization
    if (isInitializedRef.current) return;
    
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Changed to false for better control
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        // Only use final results to avoid duplicate text
        if (event.results[event.results.length - 1].isFinal) {
          console.log('Final transcript:', transcript);
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          console.log('No speech detected, restarting...');
        } else if (event.error === 'aborted') {
          console.log('Recognition aborted');
        } else {
          console.error('Recognition error:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      isInitializedRef.current = true;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
      isInitializedRef.current = false;
    };
  }, [setIsListening, onResult]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    if (isListening) {
      console.log('Already listening');
      return;
    }

    try {
      recognitionRef.current.start();
      console.log('Starting speech recognition...');
    } catch (error: any) {
      if (error.name === 'InvalidStateError') {
        // Recognition already started, stop and restart
        console.log('Restarting recognition...');
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      } else {
        console.error('Failed to start recognition:', error);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log('Stopping speech recognition...');
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }, [isListening]);

  return { startListening, stopListening, isListening };
};

export const useTextToSpeech = () => {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const {
    selectedVoice,
    rate,
    pitch,
    volume,
    isSpeaking,
    setIsSpeaking,
    availableVoices,
    setAvailableVoices,
  } = useVoiceStore();

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Available voices:', voices.length);
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [setAvailableVoices]);

  const speak = useCallback((text: string) => {
    if (!text || text.trim().length === 0) {
      console.warn('Cannot speak empty text');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set properties
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      console.log('Started speaking');
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      console.log('Finished speaking');
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    console.log('Speaking:', text.substring(0, 50) + '...');
  }, [selectedVoice, rate, pitch, volume, availableVoices, setIsSpeaking]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    console.log('Stopped speaking');
  }, [setIsSpeaking]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    console.log('Paused speaking');
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    console.log('Resumed speaking');
  }, []);

  return { speak, stop, pause, resume, isSpeaking };
};
