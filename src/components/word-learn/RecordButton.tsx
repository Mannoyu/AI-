"use client";

import { Mic, Square, Loader2 } from "lucide-react";
import type { RecordingState } from "@/types";

interface RecordButtonProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ state, onStart, onStop }: RecordButtonProps) {
  if (state === "recording") {
    return (
      <button
        onClick={onStop}
        className="terminal-btn flex items-center gap-2 px-5 py-3 bg-error text-white animate-pulse"
      >
        <Square className="w-4 h-4" />
        <span className="text-sm font-medium">停止录音</span>
      </button>
    );
  }

  if (state === "processing") {
    return (
      <button
        disabled
        className="terminal-btn flex items-center gap-2 px-5 py-3 bg-surface-alt text-text-muted"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-medium">分析中...</span>
      </button>
    );
  }

  return (
    <button
      onClick={onStart}
      disabled={false}
      className="terminal-btn flex items-center gap-2 px-5 py-3 bg-primary/15 text-primary"
    >
      <Mic className="w-4 h-4" />
      <span className="text-sm font-medium">开始录音</span>
    </button>
  );
}
