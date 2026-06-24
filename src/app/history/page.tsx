"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Loader2,
  Mic,
  Trash2,
} from "lucide-react";
import { HistoryList } from "@/components/history/HistoryList";
import { useHistoryStore } from "@/stores/useHistoryStore";

export default function HistoryPage() {
  const router = useRouter();
  const { records, loading, error, loadRecords, removeRecord, clearRecords } =
    useHistoryStore();

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const avgScore =
    records.length > 0
      ? Math.round(
          records.reduce(
            (sum, record) => sum + record.pronunciationScore,
            0
          ) / records.length
        )
      : 0;
  const reviewCount = records.reduce(
    (sum, record) => sum + record.incorrectWords.length,
    0
  );

  return (
    <div className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="flex min-h-11 items-center gap-1.5 rounded-md px-2 py-2 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
            >
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-primary/55">
                History
              </p>
              <h1
                className="mt-2 text-2xl font-bold text-text md:text-3xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                学习记录
              </h1>
              <p className="mt-2 text-sm text-text-muted md:text-base">
                回看做过的单词训练，优先复习发音分数偏低或仍有错误的内容。
              </p>
            </div>
          </div>

          {records.length > 0 && (
            <button
              onClick={() => {
                void clearRecords();
              }}
              className="terminal-btn flex min-h-11 items-center gap-1.5 px-4 py-2 text-sm text-error hover:bg-error/6"
            >
              <Trash2 className="h-4 w-4" />
              清空记录
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={BookOpen}
            label="总记录数"
            value={`${records.length}`}
            helper="可继续回看与复习"
          />
          <SummaryCard
            icon={Mic}
            label="平均发音分"
            value={records.length > 0 ? `${avgScore}` : "--"}
            helper="根据历史练习自动汇总"
          />
          <SummaryCard
            icon={AlertTriangle}
            label="待纠正项"
            value={`${reviewCount}`}
            helper="优先处理错误较多的记录"
          />
        </div>

        {loading && (
          <div className="terminal-card flex flex-col items-center justify-center gap-3 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-text-muted">正在加载学习记录...</p>
          </div>
        )}

        {error && !loading && (
          <div className="terminal-inset mb-4 flex items-start gap-3 rounded-2xl border border-error/20 bg-error/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm font-medium text-error">加载失败</p>
              <p className="text-xs text-text-muted">{error}</p>
            </div>
          </div>
        )}

        {!loading && <HistoryList records={records} onDelete={removeRecord} />}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="terminal-card p-4">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div
        className="mt-3 text-2xl font-bold text-text"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </div>
      <p className="mt-2 text-xs text-text-light">{helper}</p>
    </div>
  );
}
