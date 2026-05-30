"use client";

import { useRouter } from "next/navigation";
import { Calendar, Target, Mic, ChevronRight, Trash2 } from "lucide-react";
import type { HistoryRecord } from "@/types";

interface HistoryCardProps {
  record: HistoryRecord;
  onDelete: (id: string) => void;
}

export function HistoryCard({ record, onDelete }: HistoryCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(
      `/reader/${record.readerId}/word?word=${encodeURIComponent(record.word)}&level=intermediate&historyId=${record.id}`
    );
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(record.id);
  };

  return (
    <div
      onClick={handleClick}
      className="terminal-card p-5 terminal-card-hover cursor-pointer group relative"
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error/10 text-text-light hover:text-error transition-all duration-200"
        title="删除此记录"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Word & Title */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg font-bold text-primary">
              {record.word}
            </span>
            <ChevronRight className="w-4 h-4 text-text-light group-hover:text-primary transition-colors" />
          </div>
          <p
            className="text-sm font-medium text-text mb-2 truncate"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {record.articleTitle}
          </p>

          {/* Meanings */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {record.meanings.map((m, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded-md text-xs bg-primary/8 text-primary"
              >
                {m.partOfSpeech} {m.meaning}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(record.createdAt).toLocaleDateString("zh-CN")}
            </span>
            {record.incorrectWords.length > 0 && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                需改进: {record.incorrectWords.length} 词
              </span>
            )}
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3" />
              发音得分
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
              record.pronunciationScore >= 80
                ? "bg-success/10 text-success"
                : record.pronunciationScore >= 60
                  ? "bg-warning/10 text-warning"
                  : "bg-error/10 text-error"
            }`}
          >
            <span className="text-xl font-bold">
              {record.pronunciationScore}
            </span>
            <span className="text-[10px]">分</span>
          </div>
        </div>
      </div>
    </div>
  );
}
