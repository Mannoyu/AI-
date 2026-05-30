"use client";

import type { WordMeaning } from "@/types";
import { Tag } from "lucide-react";

interface SemanticBadgesProps {
  meanings: WordMeaning[];
}

const MEANING_COLORS = [
  "bg-primary/10 text-primary border-primary/20",
  "bg-cta/10 text-cta border-cta/20",
  "bg-success/10 text-success border-success/20",
  "bg-warning/10 text-warning border-warning/20",
  "bg-purple-500/10 text-purple-600 border-purple-500/20",
];

export function SemanticBadges({ meanings }: SemanticBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {meanings.map((m, i) => (
        <div
          key={i}
          className={`terminal-card inline-flex items-center gap-1.5 px-3 py-1.5 border text-sm ${MEANING_COLORS[i % MEANING_COLORS.length]}`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>
            <span className="font-medium">{m.partOfSpeech}</span>{" "}
            {m.meaning}
          </span>
        </div>
      ))}
    </div>
  );
}
