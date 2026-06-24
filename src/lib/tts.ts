/**
 * Browser TTS utility using the Web Speech API (SpeechSynthesis).
 *
 * Speaks an array of sentences sequentially, with per-sentence callbacks
 * for UI highlighting. Zero dependencies, zero server cost.
 */

export type TtsState = "idle" | "playing" | "paused";

export interface TtsOptions {
  sentences: string[];
  rate?: number;
  onSentenceChange?: (index: number) => void;
  onStateChange?: (state: TtsState) => void;
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

export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (!isTtsSupported()) return [];

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.startsWith("en"));
}

export function createTtsReader(options: TtsOptions): TtsController {
  const { sentences, onSentenceChange, onStateChange, onEnd } = options;

  let rate = options.rate ?? 1;
  let state: TtsState = "idle";
  let currentIndex = -1;
  let sessionId = 0;
  let pendingSpeakTimer = 0;
  let currentUtterance: SpeechSynthesisUtterance | null = null;

  function setState(nextState: TtsState) {
    if (state === nextState) return;
    state = nextState;
    onStateChange?.(nextState);
  }

  function clearPendingSpeak() {
    if (!pendingSpeakTimer) return;
    window.clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = 0;
  }

  function getVoice(): SpeechSynthesisVoice | null {
    const englishVoices = getEnglishVoices();
    if (englishVoices.length === 0) return null;

    const preferredVoice = englishVoices.find(
      (voice) =>
        voice.name.includes("Google") ||
        voice.name.includes("Microsoft") ||
        voice.name.includes("Samantha") ||
        voice.name.includes("Daniel") ||
        voice.name.includes("Karen")
    );

    return preferredVoice ?? englishVoices[0];
  }

  function finalize(activeSessionId: number, shouldNotifyEnd: boolean) {
    if (activeSessionId !== sessionId) return;

    clearPendingSpeak();
    currentIndex = -1;
    currentUtterance = null;
    setState("idle");

    if (shouldNotifyEnd) {
      onEnd?.();
    }
  }

  function speakNext(activeSessionId: number) {
    if (activeSessionId !== sessionId) return;

    currentIndex += 1;
    if (currentIndex >= sentences.length) {
      finalize(activeSessionId, true);
      return;
    }

    const sentence = sentences[currentIndex];
    if (!sentence?.trim()) {
      speakNext(activeSessionId);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = rate;
    utterance.lang = "en-US";
    utterance.volume = 1;

    const voice = getVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (activeSessionId !== sessionId) return;
      currentUtterance = null;
      speakNext(activeSessionId);
    };

    utterance.onerror = (event) => {
      if (activeSessionId !== sessionId) return;
      currentUtterance = null;

      if (event.error === "canceled" || event.error === "interrupted") {
        return;
      }

      speakNext(activeSessionId);
    };

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    onSentenceChange?.(currentIndex);
    currentUtterance = utterance;

    clearPendingSpeak();
    pendingSpeakTimer = window.setTimeout(() => {
      if (activeSessionId === sessionId && currentUtterance === utterance) {
        window.speechSynthesis.speak(utterance);
      }
    }, 10);
  }

  return {
    play() {
      if (state === "playing") return;

      if (state === "paused") {
        setState("playing");
        window.speechSynthesis.resume();
        return;
      }

      sessionId += 1;
      clearPendingSpeak();
      window.speechSynthesis.cancel();

      currentIndex = -1;
      currentUtterance = null;
      setState("playing");

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const activeSessionId = sessionId;
      pendingSpeakTimer = window.setTimeout(() => {
        if (activeSessionId === sessionId) {
          speakNext(activeSessionId);
        }
      }, 20);
    },

    pause() {
      if (state !== "playing") return;
      setState("paused");
      window.speechSynthesis.pause();
    },

    resume() {
      if (state !== "paused") return;
      setState("playing");
      window.speechSynthesis.resume();
    },

    stop() {
      sessionId += 1;
      clearPendingSpeak();
      currentIndex = -1;
      currentUtterance = null;
      window.speechSynthesis.cancel();
      setState("idle");
    },

    setRate(nextRate: number) {
      rate = Math.max(0.5, Math.min(1.5, nextRate));
      if (currentUtterance) {
        currentUtterance.rate = rate;
      }
    },

    getState() {
      return state;
    },
  };
}
