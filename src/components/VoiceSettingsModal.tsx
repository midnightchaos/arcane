import { useEffect } from 'react';
import { useVoiceStore } from '@/store/voiceStore';
import { X, Volume2 } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceSettingsModal({ isOpen, onClose }: VoiceSettingsModalProps) {
  const {
    enabled,
    autoPlayResponses,
    selectedVoice,
    rate,
    pitch,
    volume,
    availableVoices,
    setEnabled,
    setAutoPlayResponses,
    setSelectedVoice,
    setRate,
    setPitch,
    setVolume,
  } = useVoiceStore();

  useEffect(() => {
    // Initialize voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && !selectedVoice && voices[0]) {
        setSelectedVoice(voices[0].name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice, setSelectedVoice]);

  if (!isOpen) return null;

  const testVoice = () => {
    const utterance = new SpeechSynthesisUtterance('Hello! This is a test of the voice settings.');
    const voice = availableVoices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 rounded-lg shadow-2xl border max-h-[90vh] overflow-y-auto bg-gray-900 border-cyan-500/30">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-cyan-500/20 bg-gray-900/95 backdrop-blur">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-cyan-400">
            <Volume2 className="w-6 h-6" />
            Voice Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-800 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable Voice */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="font-medium text-cyan-100">
                Enable Voice Features
              </span>
            </label>
          </div>

          {/* Auto-play Responses */}
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPlayResponses}
                onChange={(e) => setAutoPlayResponses(e.target.checked)}
                disabled={!enabled}
                className="w-5 h-5 rounded disabled:opacity-50"
              />
              <span className={`font-medium text-cyan-100 ${!enabled ? 'opacity-50' : ''}`}>
                Auto-play AI Responses
              </span>
            </label>
            <p className="text-sm ml-8 text-gray-400">
              Wait, I'll automatically speak AI responses when they arrive
            </p>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <label className={`block font-medium text-cyan-100 ${!enabled ? 'opacity-50' : ''}`}>
              Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={!enabled}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-gray-800 border-cyan-500/30 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableVoices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <label className={`block font-medium text-cyan-100 ${!enabled ? 'opacity-50' : ''}`}>
              Speed: {rate.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              disabled={!enabled}
              className="w-full disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <label className={`block font-medium text-cyan-100 ${!enabled ? 'opacity-50' : ''}`}>
              Pitch: {pitch.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              disabled={!enabled}
              className="w-full disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>Normal</span>
              <span>High</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <label className={`block font-medium text-cyan-100 ${!enabled ? 'opacity-50' : ''}`}>
              Volume: {Math.round(volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={!enabled}
              className="w-full disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Mute</span>
              <span>50%</span>
              <span>Max</span>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={testVoice}
            disabled={!enabled}
            className="w-full py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Volume2 className="w-5 h-5" />
            Test Voice
          </button>
        </div>
      </div>
    </div>
  );
}
