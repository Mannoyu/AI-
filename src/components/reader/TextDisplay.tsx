"use client";

import { useEffect, useMemo, useRef } from "react";
import { WordToken } from "./WordToken";
import type { FeedbackToken } from "@/types";

interface TextDisplayProps {
  text: string;
  selectedWord: string | null;
  onWordClick: (word: string) => void;
  targetWord?: string;
  feedbackTokens?: FeedbackToken[];
  className?: string;
  highlightSentenceIndex?: number | null;
}

function splitParagraphs(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const parts = normalized
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\n+/g, " ").trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : [normalized.replace(/\n+/g, " ").trim()];
}

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?\n]+[.!?]+[\s]*|[^.!?\n]+$/g);
  if (!matches || matches.length === 0) {
    return text.trim() ? [text.trim()] : [];
  }

  return matches.map((sentence) => sentence.trim()).filter(Boolean);
}

export function TextDisplay({
  text,
  selectedWord,
  onWordClick,
  targetWord,
  feedbackTokens,
  className = "",
  highlightSentenceIndex,
}: TextDisplayProps) {
  const highlightRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const paragraphs = useMemo(() => {
    return splitParagraphs(text).map((paragraph, index) => ({
      id: `${index}-${paragraph.slice(0, 24)}`,
      sentences: splitSentences(paragraph),
    }));
  }, [text]);

  const feedbackLookup = useMemo(() => {
    if (!feedbackTokens?.length) {
      return new Map<string, FeedbackToken["status"]>();
    }

    return new Map(
      feedbackTokens.map((token) => [
        token.word.replace(/[^a-zA-Z'-]/g, "").toLowerCase(),
        token.status,
      ])
    );
  }, [feedbackTokens]);

  useEffect(() => {
    if (highlightSentenceIndex == null) {
      return;
    }

    const target = highlightRefs.current[highlightSentenceIndex];
    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [highlightSentenceIndex]);

  let runningSentenceIndex = 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.id} className="text-balance">
          {paragraph.sentences.map((sentence, sentenceIdx) => {
            const absoluteSentenceIndex = runningSentenceIndex++;
            const isHighlighted =
              highlightSentenceIndex != null &&
              absoluteSentenceIndex === highlightSentenceIndex;

            return (
              <span
                key={`${paragraph.id}-${sentenceIdx}`}
                ref={(element) => {
                  highlightRefs.current[absoluteSentenceIndex] = element;
                }}
                className={`${
                  isHighlighted
                    ? "rounded-r-md border-l-2 border-primary bg-primary/10 pl-2"
                    : ""
                } transition-all duration-300`}
              >
                {sentence.split(/(\s+)/).map((token, tokenIdx) => {
                  if (token.trim() === "") {
                    return (
                      <span key={`${paragraph.id}-${sentenceIdx}-space-${tokenIdx}`}>
                        {token}
                      </span>
                    );
                  }

                  const clean = token.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
                  const isTarget = targetWord?.toLowerCase() === clean;

                  return (
                    <WordToken
                      key={`${paragraph.id}-${sentenceIdx}-${tokenIdx}-${token}`}
                      word={token}
                      isTarget={isTarget}
                      isSelected={selectedWord?.toLowerCase() === clean}
                      onClick={onWordClick}
                      feedbackStatus={feedbackLookup.get(clean)}
                    />
                  );
                })}
                {sentenceIdx < paragraph.sentences.length - 1 ? " " : null}
              </span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
