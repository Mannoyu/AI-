"use client";

import type { HistoryRecord } from "@/types";
import { HistoryCard } from "./HistoryCard";
import { BookOpen } from "lucide-react";

interface HistoryListProps {
  records: HistoryRecord[];
  onDelete: (id: string) => void;
}

export function HistoryList({ records, onDelete }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <div className="terminal-card p-12 text-center">
        <BookOpen className="w-12 h-12 text-text-light mx-auto mb-4" />
        <p className="text-text-muted font-medium mb-1">暂无学习记录</p>
        <p className="text-sm text-text-light">
          拍照上传英文文本，开始你的英语学习之旅吧！
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {records.map((record) => (
        <HistoryCard key={record.id} record={record} onDelete={onDelete} />
      ))}
    </div>
  );
}
