"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  narrationLanguages,
  type NarrationLanguage,
  type NarrationSet,
} from "@/lib/immersive/narration";

export interface UseNarration {
  language: NarrationLanguage;
  /** Switching language always silences whatever is currently talking. */
  setLanguage: (code: NarrationLanguage) => void;
  /** The chosen language's descriptor: `lang` tag and font class. */
  active: (typeof narrationLanguages)[number];
  /** The narration text in the chosen language, when there is one. */
  text: string | undefined;
  speaking: boolean;
  /** True when this landmark can be heard at all in the chosen language. */
  canPlay: boolean;
  /** Start, or stop if already talking. */
  toggle: () => void;
  stop: () => void;
}

/**
 * Plays a landmark's recorded narration, with the browser's own voice as a
 * fallback.
 *
 * The fallback is English-only on purpose. `speechSynthesis` ships no Meiteilon
 * voice in any browser, and a Hindi voice is a coin flip depending on the
 * platform's installed voices, so rather than mispronounce a heritage site in
 * someone's own language, a missing track simply offers nothing to press.
 */
export function useNarration(tracks: NarrationSet | undefined, fallbackText?: string): UseNarration {
  const [language, setLanguageState] = useState<NarrationLanguage>("en");
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const track = tracks?.[language];
  const active = narrationLanguages.find((item) => item.code === language) ?? narrationLanguages[0];

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  // Leaving the page mid-sentence must not keep talking over the next one.
  useEffect(() => stop, [stop]);

  const speakWithBrowser = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !fallbackText) {
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fallbackText);
    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [fallbackText]);

  const setLanguage = useCallback(
    (code: NarrationLanguage) => {
      stop();
      setLanguageState(code);
    },
    [stop],
  );

  const toggle = useCallback(() => {
    if (speaking) {
      stop();
      return;
    }
    stop();

    if (track?.audio && typeof window !== "undefined" && "Audio" in window) {
      const audio = new Audio(track.audio);
      audioRef.current = audio;
      const giveUp = () => {
        audioRef.current = null;
        if (language === "en") speakWithBrowser();
        else setSpeaking(false);
      };
      audio.onended = () => {
        audioRef.current = null;
        setSpeaking(false);
      };
      audio.onerror = giveUp;
      setSpeaking(true);
      void audio.play().catch(giveUp);
      return;
    }

    if (language === "en") speakWithBrowser();
  }, [speaking, stop, track, language, speakWithBrowser]);

  const canPlay = Boolean(track?.audio) || (language === "en" && Boolean(fallbackText));

  return { language, setLanguage, active, text: track?.text, speaking, canPlay, toggle, stop };
}
