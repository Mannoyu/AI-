"use client";

import type { FeedbackToken } from "@/types";
import { WordToken } from "@/components/reader/WordToken";
import { CheckCircle2, XCircle, Star } from "lucide-react";

interface WordFeedbackProps {
  tokens: FeedbackToken[];
  targetWord: string;
}

export function WordFeedback({ tokens, targetWord }: WordFeedbackProps) {
  if (!tokens.length) return null;

  const correctCount = tokens.filter((t) => t.status === "correct").length;
  const incorrectCount = tokens.filter((t) => t.status === "incorrect").length;
  const total = correctCount + incorrectCount;

  return (
    <div className="terminal-card p-5">
      <h3
        className="text-base font-semibold mb-3 flex items-center gap-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        逐词反馈
      </h3>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          正确 ({correctCount})
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5 text-error" />
          需改进 ({incorrectCount})
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-gold" />
          目标词
        </span>
      </div>

      {/* Token Display */}
      <div className="terminal-inset rounded-xl p-4 leading-[2]">
        {tokens.map((token, i) => (
          <WordToken
            key={i}
            word={token.word}
            isTarget={
              token.word.toLowerCase().replace(/[^a-z'-]/g, "") ===
              targetWord.toLowerCase()
            }
            feedbackStatus={token.status}
          />
        ))}
        {tokens.map((_, i) => (
          <span key={`space-${i}`}> </span>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>准确率</span>
          <span>{total > 0 ? Math.round((correctCount / total) * 100) : 0}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
          <div
            className="h-full rounded-full bg-success transition-all duration-500"
            style={{
              width: `${total > 0 ? Math.round((correctCount / total) * 100) : 0}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
