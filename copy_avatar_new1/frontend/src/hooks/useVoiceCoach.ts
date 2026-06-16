/**
 * useVoiceCoach
 * Delivers spoken feedback via Web Speech API.
 * Includes per-message cooldown to avoid repetitive speech.
 */
import { useRef, useCallback } from 'react';
import { VOICE } from '@shared/constants';

export function useVoiceCoach(enabled = true) {
  const lastSpoken = useRef<Map<string, number>>(new Map());
  const synthRef   = useRef<SpeechSynthesis | null>(null);

  if (typeof window !== 'undefined' && !synthRef.current) {
    synthRef.current = window.speechSynthesis;
  }

  const speak = useCallback((text: string) => {
    if (!enabled || !synthRef.current) return;
    const now  = Date.now();
    const last = lastSpoken.current.get(text) ?? 0;
    if (now - last < VOICE.COOLDOWN_MS) return;
    lastSpoken.current.set(text, now);

    const utt       = new SpeechSynthesisUtterance(text);
    utt.rate        = VOICE.RATE;
    utt.pitch       = VOICE.PITCH;
    utt.volume      = VOICE.VOLUME;
    utt.lang        = VOICE.LANG;
    synthRef.current.cancel(); // cancel ongoing speech before new message
    synthRef.current.speak(utt);
  }, [enabled]);

  const cancel = useCallback(() => {
    synthRef.current?.cancel();
  }, []);

  return { speak, cancel };
}
