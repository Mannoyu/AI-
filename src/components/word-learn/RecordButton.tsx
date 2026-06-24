"use client";

import { Loader2, Mic, Square } from "lucide-react";
import type { RecordingState } from "@/types";

interface RecordButtonProps {
  state: RecordingState;
  preparing?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({
  state,
  preparing = false,
  onStart,
  onStop,
}: RecordButtonProps) {
  if (state === "recording") {
    return (
      <button
        type="button"
        onClick={onStop}
        className="terminal-btn flex min-h-11 items-center gap-2 bg-error px-5 py-3 text-white animate-pulse"
      >
        <Square className="h-4 w-4" />
        <span className="text-sm font-medium">停止录音</span>
      </button>
    );
  }

  if (preparing || state === "processing") {
    return (
      <button
        type="button"
        disabled
        className="terminal-btn flex min-h-11 items-center gap-2 bg-surface-alt px-5 py-3 text-text-muted"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">
          {preparing ? "准备中..." : "分析中..."}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onStart}
      className="terminal-btn flex min-h-11 items-center gap-2 bg-primary/15 px-5 py-3 text-primary"
    >
      <Mic className="h-4 w-4" />
      <span className="text-sm font-medium">开始录音</span>
    </button>
  );
}
