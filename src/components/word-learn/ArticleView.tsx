"use client";

import { useMemo } from "react";
import { BookOpen, CheckCircle2, Gauge, ListChecks, Mic } from "lucide-react";
import type { Article, RecordingState } from "@/types";
import { SemanticBadges } from "./SemanticBadges";

interface ArticleViewProps {
  article: Article;
  targetWord: string;
  selectedSentence: string | null;
  onSelectSentence: (sentence: string) => void;
  recordingState?: RecordingState;
  completedSentence?: string | null;
  score?: number | null;
}

export function ArticleView({
  article,
  targetWord,
  selectedSentence,
  onSelectSentence,
  recordingState = "idle",
  completedSentence = null,
  score = null,
}: ArticleViewProps) {
  const renderedContent = useMemo(() => {
    const parts = article.content.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const word = part.slice(2, -2);

        return (
          <span
            key={index}
            className="rounded bg-primary/10 px-1 py-0.5 font-bold text-primary"
          >
            {word}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  }, [article.content]);

  const sentences = useMemo(() => {
    const parsed = article.content
      .replace(/\*\*/g, "")
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    if (parsed.length > 0) {
      return parsed;
    }

    const fallback = article.content.replace(/\*\*/g, "").trim();
    return fallback ? [fallback] : [];
  }, [article.content]);

  const difficultyLabel =
    article.difficulty === "beginner"
      ? "初级"
      : article.difficulty === "intermediate"
        ? "中级"
        : "高级";

  return (
    <div className="terminal-card p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2
              className="break-words text-xl font-semibold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {article.title}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-light">
            <span className="inline-flex min-h-8 items-center gap-1 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-2.5 py-1">
              <Gauge className="h-3.5 w-3.5 text-primary" />
              {difficultyLabel}
            </span>
            <span className="inline-flex min-h-8 items-center rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-2.5 py-1">
              {article.wordCount} 词
            </span>
            <span className="inline-flex min-h-8 items-center rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-2.5 py-1">
              目标词 <strong className="ml-1 text-primary">{targetWord}</strong>
            </span>
            <span className="inline-flex min-h-8 items-center rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/60 px-2.5 py-1">
              {article.meanings.length} 种语义
            </span>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <SemanticBadges meanings={article.meanings} />
      </div>

      <div className="terminal-inset mb-5 rounded-2xl p-5 md:p-6">
        <div className="text-[15px] leading-[1.9] text-text">{renderedContent}</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <p
            className="text-sm font-medium text-text"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            选择一句开始跟读
          </p>
        </div>
        <div className="grid gap-2">
          {sentences.map((sentence, index) => {
            const isSelected = selectedSentence === sentence;
            const isCompleted = completedSentence === sentence;

            return (
              <button
                key={`${index}-${sentence}`}
                type="button"
                onClick={() => onSelectSentence(sentence)}
                aria-pressed={isSelected}
                className={`terminal-card w-full px-3 py-3 text-left text-sm leading-relaxed transition-all duration-200 ${
                  isSelected
                    ? "bg-primary/5 ring-2 ring-primary"
                    : "terminal-card-hover hover:shadow-terminal-hover"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-text-light">
                  <span>Sentence {index + 1}</span>
                  <span className="flex items-center gap-1">
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        已完成{score != null ? ` · ${score}分` : ""}
                      </>
                    ) : isSelected && recordingState === "recording" ? (
                      <>
                        <Mic className="h-3.5 w-3.5 text-cta" />
                        录音中
                      </>
                    ) : isSelected ? (
                      "已选中"
                    ) : (
                      "待练习"
                    )}
                  </span>
                </div>
                <div>{sentence}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
