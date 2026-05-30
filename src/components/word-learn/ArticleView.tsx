"use client";

import type { Article } from "@/types";
import { SemanticBadges } from "./SemanticBadges";
import { BookOpen, Gauge } from "lucide-react";

interface ArticleViewProps {
  article: Article;
  targetWord: string;
  selectedSentence: string | null;
  onSelectSentence: (sentence: string) => void;
}

export function ArticleView({
  article,
  targetWord,
  selectedSentence,
  onSelectSentence,
}: ArticleViewProps) {
  // Render article content with highlighted target word
  const renderContent = () => {
    // Split by ** markers for bold (target word)
    const parts = article.content.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const word = part.slice(2, -2);
        return (
          <span
            key={i}
            className="font-bold text-primary bg-primary/10 px-1 py-0.5 rounded"
          >
            {word}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Split into sentences for clickable selection
  const sentences = article.content
    .replace(/\*\*/g, "")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  return (
    <div className="terminal-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {article.title}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              {article.difficulty === "beginner"
                ? "初级"
                : article.difficulty === "intermediate"
                  ? "中级"
                  : "高级"}
            </span>
            <span>{article.wordCount} 词</span>
            <span>目标词 <strong className="text-primary">{targetWord}</strong> 出现 {article.meanings.length} 种语义</span>
          </div>
        </div>
      </div>

      {/* Semantic Badges */}
      <div className="mb-5">
        <SemanticBadges meanings={article.meanings} />
      </div>

      {/* Article Content */}
      <div className="terminal-inset rounded-2xl p-5 mb-5">
        <div className="text-text leading-[1.8] text-[15px]">
          {renderContent()}
        </div>
      </div>

      {/* Sentence Selection for Practice */}
      <div>
        <p
          className="text-sm font-medium text-text mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          点击下方句子进行跟读练习：
        </p>
        <div className="flex flex-wrap gap-2">
          {sentences.map((sentence, i) => {
            const clean = sentence.trim();
            const isSelected = selectedSentence === clean;

            return (
              <button
                key={i}
                onClick={() => onSelectSentence(clean)}
                className={`terminal-card text-left px-3 py-2 text-sm leading-relaxed transition-all duration-200 max-w-full ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:shadow-terminal-hover terminal-card-hover"
                }`}
              >
                {clean.length > 100
                  ? clean.slice(0, 100) + "..."
                  : clean}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
