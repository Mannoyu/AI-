"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { HistoryRecord } from "@/types";
import { HistoryCard } from "./HistoryCard";

interface HistoryListProps {
  records: HistoryRecord[];
  onDelete: (id: string) => void;
}

export function HistoryList({ records, onDelete }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <div className="terminal-card p-12 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-text-light" />
        <p className="mb-1 font-medium text-text">还没有学习记录</p>
        <p className="text-sm text-text-light">
          完成一次阅读与跟读训练后，记录会自动出现在这里，方便继续复习。
        </p>
        <Link
          href="/"
          className="terminal-btn mx-auto mt-5 inline-flex min-h-11 items-center px-4 py-2 text-sm text-primary"
        >
          去生成第一篇练习
        </Link>
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
