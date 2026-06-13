import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceSettings {
  enabled: boolean;
  autoPlayResponses: boolean;
  selectedVoice: string;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

interface VoiceState extends VoiceSettings {
  availableVoices: SpeechSynthesisVoice[];
  isListening: boolean;
  isSpeaking: boolean;
  setEnabled: (enabled: boolean) => void;
  setAutoPlayResponses: (autoPlay: boolean) => void;
  setSelectedVoice: (voiceName: string) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  setAvailableVoices: (voices: SpeechSynthesisVoice[]) => void;
  setIsListening: (listening: boolean) => void;
  setIsSpeaking: (speaking: boolean) => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      // Settings
      enabled: true,
      autoPlayResponses: false,
      selectedVoice: '',
      rate: 1,
      pitch: 1,
      volume: 1,
      
      // State
      availableVoices: [],
      isListening: false,
      isSpeaking: false,
      
      // Actions
      setEnabled: (enabled) => set({ enabled }),
      setAutoPlayResponses: (autoPlay) => set({ autoPlayResponses: autoPlay }),
      setSelectedVoice: (voiceName) => set({ selectedVoice: voiceName }),
      setRate: (rate) => set({ rate }),
      setPitch: (pitch) => set({ pitch }),
      setVolume: (volume) => set({ volume }),
      setAvailableVoices: (voices) => set({ availableVoices: voices }),
      setIsListening: (listening) => set({ isListening: listening }),
      setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
    }),
    {
      name: 'voice-settings',
      partialize: (state) => ({
        enabled: state.enabled,
        autoPlayResponses: state.autoPlayResponses,
        selectedVoice: state.selectedVoice,
        rate: state.rate,
        pitch: state.pitch,
        volume: state.volume,
      }),
    }
  )
);
