"use client";

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
  const interactive = typeof onClick === "function";
  const baseClasses =
    "inline-block rounded-md px-1 py-0.5 text-sm leading-relaxed transition-all duration-150 select-none align-baseline";

  let statusClasses = interactive
    ? "cursor-pointer hover:bg-primary/10 hover:text-primary"
    : "cursor-default";

  if (feedbackStatus === "correct") {
    statusClasses = "bg-success/15 font-medium text-success";
  } else if (feedbackStatus === "incorrect") {
    statusClasses = "bg-error/15 font-medium text-error";
  } else if (feedbackStatus === "target") {
    statusClasses = "bg-gold/15 font-semibold text-gold ring-1 ring-gold/40";
  }

  if (isTarget && !feedbackStatus) {
    statusClasses = "bg-primary/10 font-semibold text-primary";
  }

  if (isSelected) {
    statusClasses = "bg-primary/15 font-medium text-primary shadow-terminal";
  }

  const cleanWord = word.replace(/[^a-zA-Z'-]/g, "");

  if (!cleanWord) {
    return <span>{word}</span>;
  }

  if (!interactive) {
    return <span className={`${baseClasses} ${statusClasses}`}>{word}</span>;
  }

  return (
    <button
      type="button"
      className={`${baseClasses} ${statusClasses} border-0 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg`}
      onClick={() => onClick?.(cleanWord)}
      aria-pressed={isSelected}
      aria-label={
        isSelected ? `已选择单词 ${cleanWord}` : `选择单词 ${cleanWord}`
      }
    >
      {word}
    </button>
  );
}
