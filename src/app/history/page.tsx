"use client";

import { HistoryList } from "@/components/history/HistoryList";
import { ArrowLeft, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useEffect } from "react";

export default function HistoryPage() {
  const router = useRouter();
  const { records, loading, error, loadRecords, removeRecord, clearRecords } =
    useHistoryStore();

  // Load from server on mount
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </button>
            <h1
              className="text-2xl font-bold text-text"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              学习记录
            </h1>
          </div>

          {records.length > 0 && (
            <button
              onClick={clearRecords}
              className="flex items-center gap-1.5 text-sm text-error hover:text-error/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空记录
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="terminal-card p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-text-muted text-sm">正在加载学习记录...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="terminal-inset rounded-2xl p-4 mb-4 flex items-start gap-3 border border-error/20 bg-error/5">
            <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-error mb-1">加载失败</p>
              <p className="text-xs text-text-muted">{error}</p>
            </div>
          </div>
        )}

        {/* Records */}
        {!loading && <HistoryList records={records} onDelete={removeRecord} />}
      </div>
    </div>
  );
}
