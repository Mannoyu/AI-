"use client";

import { useState } from "react";

interface WordTokenProps {
  word: string;
  isTarget?: boolean;
  isSelected?: boolean;
  onClick?: (word: string) => void;
  feedbackStatus?: "correct" | "incorrect" | "target" | "pending";
}

export function WordToken({
  word,
  isTarget = false,
  isSelected = false,
  onClick,
  feedbackStatus,
}: WordTokenProps) {
  const [hovered, setHovered] = useState(false);

  const baseClasses =
    "inline-block px-1 py-0.5 rounded-md text-sm leading-relaxed transition-all duration-150 cursor-pointer select-none";

  let statusClasses = "hover:bg-primary/10 hover:text-primary";

  if (feedbackStatus === "correct") {
    statusClasses = "bg-success/15 text-success font-medium";
  } else if (feedbackStatus === "incorrect") {
    statusClasses = "bg-error/15 text-error font-medium";
  } else if (feedbackStatus === "target") {
    statusClasses =
      "bg-gold/15 text-gold font-semibold ring-1 ring-gold/40";
  }

  if (isTarget && !feedbackStatus) {
    statusClasses = "bg-primary/10 text-primary font-semibold";
  }

  if (isSelected) {
    statusClasses = "bg-primary/15 text-primary font-medium shadow-terminal";
  }

  const cleanWord = word.replace(/[^a-zA-Z'-]/g, "");

  if (!cleanWord) {
    return <span>{word} </span>;
  }

  return (
    <span
      className={`${baseClasses} ${statusClasses}`}
      onClick={() => onClick?.(cleanWord)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(cleanWord)}
    >
      {word}
    </span>
  );
}
