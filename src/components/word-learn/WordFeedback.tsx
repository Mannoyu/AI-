"use client";

import { Fragment } from "react";
import { CheckCircle2, Star, XCircle } from "lucide-react";
import { WordToken } from "@/components/reader/WordToken";
import type { FeedbackToken } from "@/types";

interface WordFeedbackProps {
  tokens: FeedbackToken[];
  targetWord: string;
}

export function WordFeedback({ tokens, targetWord }: WordFeedbackProps) {
  if (!tokens.length) return null;

  const correctCount = tokens.filter((token) => token.status === "correct").length;
  const targetCount = tokens.filter((token) => token.status === "target").length;
  const incorrectCount = tokens.filter(
    (token) => token.status === "incorrect"
  ).length;
  const total = correctCount + targetCount + incorrectCount;
  const accuracy =
    total > 0 ? Math.round(((correctCount + targetCount) / total) * 100) : 0;

  return (
    <div className="terminal-inset rounded-2xl p-5">
      <h3
        className="mb-3 flex items-center gap-2 text-base font-semibold text-text"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        逐词反馈
      </h3>

      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          正确 ({correctCount + targetCount})
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-3.5 w-3.5 text-error" />
          待改进 ({incorrectCount})
        </span>
        <span className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-gold" />
          目标词
        </span>
      </div>

      <div className="rounded-xl border border-[rgba(0,255,65,0.08)] bg-surface/60 p-4 leading-[2]">
        {tokens.map((token, index) => (
          <Fragment key={`${token.originalIndex}-${index}-${token.word}`}>
            <WordToken
              word={token.word}
              isTarget={
                token.word.toLowerCase().replace(/[^a-z'-]/g, "") ===
                targetWord.toLowerCase()
              }
              feedbackStatus={token.status}
            />
            {index < tokens.length - 1 ? " " : null}
          </Fragment>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-text-muted">
          <span>准确率</span>
          <span>{accuracy}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
          <div
            className="h-full rounded-full bg-success transition-all duration-500"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>
    </div>
  );
}
