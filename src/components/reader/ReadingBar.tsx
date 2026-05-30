"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, ChevronDown } from "lucide-react";
import {
  createTtsReader,
  isTtsSupported,
  getEnglishVoices,
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
  { value: 1.0, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
];

export function ReadingBar({ sentences, onSentenceChange }: ReadingBarProps) {
  const [ttsState, setTtsState] = useState<TtsState>("idle");
  const [rate, setRate] = useState(1.0);
  const [showRateMenu, setShowRateMenu] = useState(false);
  const [supported, setSupported] = useState(true);
  const ttsRef = useRef<TtsController | null>(null);
  const rateRef = useRef(rate);
  rateRef.current = rate;

  // Check browser support
  useEffect(() => {
    if (!isTtsSupported()) {
      setSupported(false);
      return;
    }
    // Warm up voice list
    window.speechSynthesis.getVoices();
  }, []);

  // (Re)create TTS reader when sentences change
  useEffect(() => {
    // Clean up previous reader
    ttsRef.current?.stop();

    if (sentences.length === 0) {
      ttsRef.current = null;
      return;
    }

    const reader = createTtsReader({
      sentences,
      rate: rateRef.current,
      onSentenceChange: (index) => {
        onSentenceChange(index);
      },
      onEnd: () => {
        setTtsState("idle");
        onSentenceChange(null);
      },
    });

    ttsRef.current = reader;

    return () => {
      reader.stop();
    };
  }, [sentences, onSentenceChange]);

  const handlePlay = useCallback(() => {
    const reader = ttsRef.current;
    if (!reader) return;

    if (reader.getState() === "paused") {
      reader.resume();
    } else {
      reader.play();
    }
    setTtsState("playing");
  }, []);

  const handlePause = useCallback(() => {
    ttsRef.current?.pause();
    setTtsState("paused");
  }, []);

  const handleStop = useCallback(() => {
    ttsRef.current?.stop();
    setTtsState("idle");
    onSentenceChange(null);
  }, [onSentenceChange]);

  const handleRateChange = useCallback(
    (newRate: number) => {
      setRate(newRate);
      setShowRateMenu(false);
      ttsRef.current?.setRate(newRate);
    },
    []
  );

  // Close rate menu on outside click
  useEffect(() => {
    if (!showRateMenu) return;
    const handler = () => setShowRateMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showRateMenu]);

  if (!supported || sentences.length === 0) {
    return null;
  }

  const isPlaying = ttsState === "playing";
  const isPaused = ttsState === "paused";
  const isIdle = ttsState === "idle";

  return (
    <div className="terminal-inset rounded-xl p-4 flex items-center gap-4 flex-wrap border border-primary/20">
      {/* Label */}
      <div className="flex items-center gap-2 text-sm font-semibold text-text">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isPlaying
              ? "bg-primary/20 text-primary"
              : "bg-primary/10 text-primary"
          }`}
        >
          <Volume2
            className={`w-4 h-4 ${isPlaying ? "animate-pulse" : ""}`}
          />
        </div>
        <div>
          <span>AI 朗读</span>
          {isIdle && (
            <p className="text-xs text-text-muted font-normal">
              点击播放按钮开始朗读全文
            </p>
          )}
          {isPlaying && (
            <p className="text-xs text-primary font-normal">正在朗读中...</p>
          )}
          {isPaused && (
            <p className="text-xs text-cta font-normal">已暂停</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {isPaused || isIdle ? (
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-bg font-semibold text-sm hover:opacity-90 transition-opacity shadow-terminal"
            title="播放"
          >
            <Play className="w-4 h-4 fill-current" />
            {isPaused ? "继续" : "播放"}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cta/20 text-cta font-semibold text-sm hover:bg-cta/30 transition-colors"
            title="暂停"
          >
            <Pause className="w-4 h-4" />
            暂停
          </button>
        )}

        <button
          onClick={handleStop}
          disabled={isIdle}
          className="w-9 h-9 rounded-lg bg-surface-alt text-text-muted flex items-center justify-center hover:bg-error/20 hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="停止"
        >
          <Square className="w-4 h-4" />
        </button>

        {/* Speed Selector */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRateMenu((v) => !v);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-alt text-sm text-text-muted hover:text-text transition-colors"
          >
            <span>{rate}x</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showRateMenu ? "rotate-180" : ""
              }`}
            />
          </button>

          {showRateMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 terminal-inset rounded-xl p-1 shadow-terminal min-w-[90px]">
              {RATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRateChange(opt.value);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    rate === opt.value
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-text-muted hover:text-text hover:bg-surface-alt"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
