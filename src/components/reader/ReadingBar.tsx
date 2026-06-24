"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ChevronDown, Pause, Play, Square, Volume2 } from "lucide-react";
import {
  createTtsReader,
  getEnglishVoices,
  isTtsSupported,
  type TtsController,
  type TtsState,
} from "@/lib/tts";

interface ReadingBarProps {
  sentences: string[];
  onSentenceChange: (index: number | null) => void;
}

const RATE_OPTIONS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
];

export function ReadingBar({ sentences, onSentenceChange }: ReadingBarProps) {
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [rate, setRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [supported, setSupported] = useState(true);
  const ttsRef = useRef<TtsController | null>(null);
  const rateButtonRef = useRef<HTMLButtonElement | null>(null);
  const rateMenuRef = useRef<HTMLDivElement | null>(null);
  const rateOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSupported = isTtsSupported();
      setSupported(nextSupported);

      if (nextSupported) {
        getEnglishVoices();
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    let reader: TtsController | null = null;
    let disposed = false;

    const timer = window.setTimeout(() => {
      ttsRef.current?.stop();
      ttsRef.current = null;
      setTtsState("idle");
      onSentenceChange(null);

      if (!supported || sentences.length === 0 || disposed) {
        return;
      }

      reader = createTtsReader({
        sentences,
        onSentenceChange,
        onStateChange: setTtsState,
        onEnd: () => {
          onSentenceChange(null);
        },
      });

      reader.setRate(rate);

      if (disposed) {
        reader.stop();
        return;
      }

      ttsRef.current = reader;
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      reader?.stop();
      if (ttsRef.current === reader) {
        ttsRef.current = null;
      }
    };
  }, [onSentenceChange, rate, sentences, supported]);

  const handlePlay = useCallback(() => {
    const reader = ttsRef.current;
    if (!reader) return;

    if (reader.getState() === "paused") {
      reader.resume();
      return;
    }

    reader.play();
  }, []);

  const handlePause = useCallback(() => {
    ttsRef.current?.pause();
  }, []);

  const handleStop = useCallback(() => {
    ttsRef.current?.stop();
    onSentenceChange(null);
  }, [onSentenceChange]);

  const handleRateChange = useCallback((nextRate: number) => {
    setRate(nextRate);
    setShowRateMenu(false);
    rateButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!showRateMenu) {
      return;
    }

    const selectedIndex = RATE_OPTIONS.findIndex((option) => option.value === rate);
    const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;
    rateOptionRefs.current[focusIndex]?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        !rateMenuRef.current?.contains(target) &&
        !rateButtonRef.current?.contains(target)
      ) {
        setShowRateMenu(false);
      }
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowRateMenu(false);
        rateButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [rate, showRateMenu]);

  const handleRateButtonKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setShowRateMenu(true);
      }
    },
    []
  );

  const handleRateMenuKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const selectedIndex = RATE_OPTIONS.findIndex((option) => option.value === rate);
      const fallbackIndex = selectedIndex >= 0 ? selectedIndex : 0;
      const activeIndex = rateOptionRefs.current.findIndex(
        (element) => element === document.activeElement
      );
      const currentIndex = activeIndex >= 0 ? activeIndex : fallbackIndex;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = currentIndex >= RATE_OPTIONS.length - 1 ? 0 : currentIndex + 1;
        rateOptionRefs.current[nextIndex]?.focus();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = currentIndex <= 0 ? RATE_OPTIONS.length - 1 : currentIndex - 1;
        rateOptionRefs.current[nextIndex]?.focus();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        rateOptionRefs.current[0]?.focus();
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        rateOptionRefs.current[RATE_OPTIONS.length - 1]?.focus();
        return;
      }

      if (event.key === "Tab") {
        setShowRateMenu(false);
      }
    },
    [rate]
  );

  if (!supported || sentences.length === 0) {
    return null;
  }

  const isPlaying = ttsState === "playing";
  const isPaused = ttsState === "paused";
  const isIdle = ttsState === "idle";

  return (
    <div
      className="terminal-inset rounded-xl border border-primary/20 p-4"
      role="group"
      aria-label="文章朗读控制"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isPlaying ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
            }`}
          >
            <Volume2 className={`h-4 w-4 ${isPlaying ? "animate-pulse" : ""}`} />
          </div>
          <div aria-live="polite">
            <span>AI 朗读</span>
            {isIdle && (
              <p className="text-xs font-normal text-text-muted">
                点击播放后将逐句朗读文章，并同步高亮当前句子。
              </p>
            )}
            {isPlaying && (
              <p className="text-xs font-normal text-primary">正在朗读中...</p>
            )}
            {isPaused && (
              <p className="text-xs font-normal text-cta">朗读已暂停</p>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isPaused || isIdle ? (
            <button
              type="button"
              onClick={handlePlay}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-bg shadow-terminal transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title={isPaused ? "继续朗读" : "开始朗读"}
              aria-label={isPaused ? "继续朗读" : "开始朗读"}
            >
              <Play className="h-4 w-4 fill-current" />
              {isPaused ? "继续" : "播放"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="flex items-center gap-2 rounded-lg bg-cta/20 px-4 py-2 text-sm font-semibold text-cta transition-colors hover:bg-cta/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/40"
              title="暂停朗读"
              aria-label="暂停朗读"
            >
              <Pause className="h-4 w-4" />
              暂停
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={isIdle}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-alt text-text-muted transition-colors hover:bg-error/20 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:cursor-not-allowed disabled:opacity-30"
            title="停止朗读"
            aria-label="停止朗读"
          >
            <Square className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              ref={rateButtonRef}
              type="button"
              onClick={() => setShowRateMenu((value) => !value)}
              onKeyDown={handleRateButtonKeyDown}
              className="flex items-center gap-1 rounded-lg bg-surface-alt px-3 py-1.5 text-sm text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-haspopup="menu"
              aria-expanded={showRateMenu}
              aria-controls={showRateMenu ? menuId : undefined}
              aria-label={`朗读速度，当前 ${rate} 倍`}
            >
              <span>{rate}x</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  showRateMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {showRateMenu && (
              <div
                ref={rateMenuRef}
                id={menuId}
                role="menu"
                aria-label="选择朗读速度"
                onKeyDown={handleRateMenuKeyDown}
                className="terminal-inset absolute right-0 top-full z-10 mt-1 min-w-[90px] rounded-xl p-1 shadow-terminal"
              >
                {RATE_OPTIONS.map((option, index) => (
                  <button
                    key={option.value}
                    ref={(element) => {
                      rateOptionRefs.current[index] = element;
                    }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={rate === option.value}
                    onClick={() => handleRateChange(option.value)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      rate === option.value
                        ? "bg-primary/15 font-medium text-primary"
                        : "text-text-muted hover:bg-surface-alt hover:text-text"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
