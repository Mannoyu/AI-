"use client";

import { WordToken } from "./WordToken";
import type { FeedbackToken } from "@/types";

interface TextDisplayProps {
  text: string;
  selectedWord: string | null;
  onWordClick: (word: string) => void;
  targetWord?: string;
  feedbackTokens?: FeedbackToken[];
  className?: string;
  /** Index of the currently spoken sentence (for TTS highlight). */
  highlightSentenceIndex?: number | null;
}

/**
 * Split text into sentences, preserving delimiters and whitespace.
 * Handles `.` `!` `?` as sentence boundaries.
 */
function splitSentences(text: string): string[] {
  const parts: string[] = [];
  // Match: sentence content up to and including the terminator + any following whitespace
  const regex = /([^.!?\n]+[.!?]+[\s]*|[\n]+|[^.!?\n]+$)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      // There's text between matches — add it as a separate part
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(match[0]);
    lastIndex = regex.lastIndex;
  }

  // Remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
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
  const sentences = splitSentences(text);

  const getFeedbackStatus = (
    word: string
  ): FeedbackToken["status"] | undefined => {
    if (!feedbackTokens?.length) return undefined;
    const clean = word.replace(/[^a-zA-Z'-]/g, "");
    const found = feedbackTokens.find(
      (t) => t.word.toLowerCase() === clean.toLowerCase()
    );
    return found?.status;
  };

  const renderWords = (sentence: string, sentenceIdx: number) => {
    const words = sentence.split(/(\s+)/);
    const isHighlighted =
      highlightSentenceIndex != null && sentenceIdx === highlightSentenceIndex;

    return (
      <span
        key={sentenceIdx}
        className={`${
          isHighlighted
            ? "bg-primary/10 border-l-2 border-primary pl-2 rounded-r-md"
            : ""
        } transition-all duration-300`}
      >
        {words.map((token, i) => {
          if (token.trim() === "") {
            return <span key={i}>{token}</span>;
          }

          const clean = token.replace(/[^a-zA-Z'-]/g, "").toLowerCase();
          const isTarget = targetWord?.toLowerCase() === clean;

          return (
            <WordToken
              key={i}
              word={token}
              isTarget={isTarget}
              isSelected={selectedWord?.toLowerCase() === clean}
              onClick={onWordClick}
              feedbackStatus={getFeedbackStatus(token)}
            />
          );
        })}
      </span>
    );
  };

  return (
    <div className={`leading-relaxed ${className}`}>
      {sentences.map((sentence, idx) => renderWords(sentence, idx))}
    </div>
  );
}
