"use client";

import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, Mic, Target, Trash2 } from "lucide-react";
import type { HistoryRecord } from "@/types";

interface HistoryCardProps {
  record: HistoryRecord;
  onDelete: (id: string) => void;
}

export function HistoryCard({ record, onDelete }: HistoryCardProps) {
  const router = useRouter();
  const visibleMeanings = record.meanings.slice(0, 3);
  const hiddenMeaningCount = Math.max(
    0,
    record.meanings.length - visibleMeanings.length
  );
  const articleId = `history-article-${record.id}`;
  const meaningId = `history-meanings-${record.id}`;
  const metaId = `history-meta-${record.id}`;

  const scoreTone =
    record.pronunciationScore >= 80
      ? {
          badge: "表现稳定",
          scoreClass: "bg-success/10 text-success",
        }
      : record.pronunciationScore >= 60
        ? {
            badge: "继续巩固",
            scoreClass: "bg-warning/10 text-warning",
          }
        : {
            badge: "优先复习",
            scoreClass: "bg-error/10 text-error",
          };

  const handleOpen = () => {
    const level = record.articleDifficulty ?? "intermediate";
    router.push(
      `/reader/${record.readerId}/word?word=${encodeURIComponent(record.word)}&level=${level}&historyId=${record.id}`
    );
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete(record.id);
  };

  return (
    <article className="terminal-card terminal-card-hover group relative overflow-hidden">
      <button
        type="button"
        onClick={handleOpen}
        aria-labelledby={articleId}
        aria-describedby={`${meaningId} ${metaId}`}
        className="w-full p-5 pr-16 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{record.word}</span>
              <ChevronRight className="h-4 w-4 text-text-light transition-colors group-hover:text-primary" />
              <span className="rounded-md border border-[rgba(0,255,65,0.08)] bg-surface px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-text-light">
                {scoreTone.badge}
              </span>
            </div>

            <p
              id={articleId}
              className="mb-2 truncate text-sm font-medium text-text"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {record.articleTitle}
            </p>

            <div id={meaningId} className="mb-3 flex flex-wrap gap-1.5">
              {visibleMeanings.map((meaning, index) => (
                <span
                  key={index}
                  className="inline-block rounded-md bg-primary/8 px-2 py-0.5 text-xs text-primary"
                >
                  {meaning.partOfSpeech} {meaning.meaning}
                </span>
              ))}
              {hiddenMeaningCount > 0 && (
                <span className="inline-block rounded-md bg-surface-alt px-2 py-0.5 text-xs text-text-light">
                  +{hiddenMeaningCount} 条释义
                </span>
              )}
            </div>

            <div
              id={metaId}
              className="flex flex-wrap items-center gap-4 text-xs text-text-muted"
            >
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <time dateTime={record.createdAt}>
                  {new Date(record.createdAt).toLocaleString("zh-CN")}
                </time>
              </span>
              {record.incorrectWords.length > 0 && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  待纠正 {record.incorrectWords.length} 处
                </span>
              )}
              <span className="flex items-center gap-1">
                <Mic className="h-3 w-3" />
                发音评分
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div
              className={`flex h-16 w-16 flex-col items-center justify-center rounded-2xl ${scoreTone.scoreClass}`}
              aria-label={`发音评分 ${record.pronunciationScore} 分`}
            >
              <span className="text-xl font-bold">{record.pronunciationScore}</span>
              <span className="text-[10px]">分</span>
            </div>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={handleDelete}
        aria-label={`删除 ${record.word} 的学习记录`}
        title="删除这条记录"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-text-light opacity-60 transition-all duration-200 hover:bg-error/10 hover:text-error focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </article>
  );
}
