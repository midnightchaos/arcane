import { useCallback } from 'react';

// Common UI sound URLs (High-quality tech/magic sounds)
const SOUNDS = {
    START: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Tech swoosh/start
    SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3', // Magical achievement/ding
    ERROR: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3', // Low error thud
    CLICK: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Minimal click
    NOTIFICATION: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3' // Subtle ping
};

/**
 * useAudio hook for Arcane Studio audio cues
 */
export const useAudio = () => {
    const playSound = useCallback((type: keyof typeof SOUNDS) => {
        // Check if audio is enabled in settings (future feature)
        // For now, only play if the user is in the browser context
        try {
            const audio = new Audio(SOUNDS[type]);
            audio.volume = 0.4; // Keep it subtle
            audio.play().catch(err => {
                // Autoplay policy might block sounds until user interacts
                console.warn('Audio playback blocked or failed:', err);
            });
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }, []);

    return { playSound };
};
