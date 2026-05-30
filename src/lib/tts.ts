/**
 * Browser TTS utility using the Web Speech API (SpeechSynthesis).
 *
 * Speaks an array of sentences sequentially, with per-sentence callbacks
 * for UI highlighting. Zero dependencies, zero server cost.
 *
 * Chrome quirks handled:
 * - speechSynthesis is sometimes "paused" by default → resume() before speak()
 * - Utterance objects can be GC'd if not referenced → keep ref to current
 * - getVoices() is async → listen for voiceschanged event
 */

export type TtsState = "idle" | "playing" | "paused";

export interface TtsOptions {
  sentences: string[];
  rate?: number; // 0.5 ~ 1.5, default 1.0
  onSentenceChange?: (index: number) => void;
  onEnd?: () => void;
}

export interface TtsController {
  play(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  getState(): TtsState;
}

/**
 * Check whether the browser supports SpeechSynthesis at all.
 */
export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Get available English voices. Returns empty array if none found.
 * Call after the "voiceschanged" event for reliable results.
 */
export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (!isTtsSupported()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
}

/**
 * Create a TTS reader that speaks sentences one by one.
 */
export function createTtsReader(options: TtsOptions): TtsController {
  const { sentences, onSentenceChange, onEnd } = options;

  let rate = options.rate ?? 1.0;
  let state: TtsState = "idle";
  let currentIndex = -1;
  let aborted = false;
  // Chrome GC workaround: keep ref to the active utterance
  let currentUtterance: SpeechSynthesisUtterance | null = null;

  function getVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    if (enVoices.length === 0) return null;

    // Prefer a high-quality English voice
    const preferred = enVoices.find(
      (v) =>
        v.name.includes("Google") ||
        v.name.includes("Microsoft") ||
        v.name.includes("Samantha") ||
        v.name.includes("Daniel") ||
        v.name.includes("Karen")
    );
    return preferred || enVoices[0];
  }

  function speakNext() {
    if (aborted) {
      console.log("[TTS] Aborted, not speaking next sentence");
      return;
    }

    currentIndex++;
    if (currentIndex >= sentences.length) {
      console.log("[TTS] All sentences spoken — done");
      state = "idle";
      currentIndex = -1;
      currentUtterance = null;
      onEnd?.();
      return;
    }

    const sentence = sentences[currentIndex];
    if (!sentence || !sentence.trim()) {
      // Skip empty sentences immediately
      speakNext();
      return;
    }

    console.log(`[TTS] Speaking sentence ${currentIndex}: "${sentence.slice(0, 50)}..."`);

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = rate;
    utterance.lang = "en-US";
    // Volume explicitly to 1
    utterance.volume = 1;

    const voice = getVoice();
    if (voice) {
      utterance.voice = voice;
      console.log(`[TTS] Using voice: ${voice.name} (${voice.lang})`);
    } else {
      console.log("[TTS] No English voice found, using default");
    }

    utterance.onstart = () => {
      console.log(`[TTS] Utterance started for sentence ${currentIndex}`);
    };

    utterance.onend = () => {
      console.log(`[TTS] Utterance ended for sentence ${currentIndex}`);
      currentUtterance = null;
      if (!aborted) speakNext();
    };

    utterance.onerror = (event) => {
      console.error(`[TTS] Utterance error: ${event.error} at sentence ${currentIndex}`);
      currentUtterance = null;
      // "canceled" is expected when stop() is called
      if (event.error === "canceled" || event.error === "interrupted") {
        return;
      }
      // Try to continue to next sentence despite error
      if (!aborted) speakNext();
    };

    // Chrome fix: resume synthesis if it's in a weird paused state
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // Fire sentence change callback
    onSentenceChange?.(currentIndex);

    // Keep reference (Chrome GC workaround)
    currentUtterance = utterance;

    // Chrome fix: defer speak() slightly — gives the browser time to process
    // the utterance setup. Without this, onstart may never fire (known Chrome bug).
    setTimeout(() => {
      if (!aborted && currentUtterance === utterance) {
        window.speechSynthesis.speak(utterance);
      }
    }, 10);
  }

  const controller: TtsController = {
    play() {
      if (state === "playing") return;
      aborted = false;

      console.log("[TTS] play() called, current state:", state);

      if (state === "paused") {
        // Resume from pause
        state = "playing";
        window.speechSynthesis.resume();
        return;
      }

      // Fresh start — cancel any stale speech first (Chrome bug workaround)
      window.speechSynthesis.cancel();

      state = "playing";
      currentIndex = -1;

      // Chrome fix: ensure speechSynthesis is not in a paused state
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Small delay to let cancel() flush before speaking
      setTimeout(() => {
        if (!aborted) speakNext();
      }, 20);
    },

    pause() {
      if (state !== "playing") return;
      console.log("[TTS] pause()");
      state = "paused";
      window.speechSynthesis.pause();
    },

    resume() {
      if (state !== "paused") return;
      console.log("[TTS] resume()");
      state = "playing";
      window.speechSynthesis.resume();
    },

    stop() {
      console.log("[TTS] stop()");
      aborted = true;
      state = "idle";
      currentIndex = -1;
      currentUtterance = null;
      window.speechSynthesis.cancel();
      onEnd?.();
    },

    setRate(newRate: number) {
      rate = Math.max(0.5, Math.min(1.5, newRate));
      console.log("[TTS] setRate:", rate);
    },

    getState() {
      return state;
    },
  };

  return controller;
}
