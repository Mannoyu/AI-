"use client";

import { useState, useCallback, useEffect, use, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArticleView } from "@/components/word-learn/ArticleView";
import { PronunciationPanel } from "@/components/word-learn/PronunciationPanel";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useUserStore } from "@/stores/useUserStore";
import { useWordLearnStore } from "@/stores/useWordLearnStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import type { Article } from "@/types";

export default function WordLearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useUserStore();
  const {
    selectSentence,
    selectedSentence,
    recordingState,
    feedbackTokens,
    score,
  } = useWordLearnStore();
  const { addRecord } = useHistoryStore();
  const lastSavedRef = useRef<string | null>(null);
  const prevRecordingStateRef = useRef(recordingState);
  const word = searchParams.get("word") || "bank";
  const historyId = searchParams.get("historyId");
  const level = searchParams.get("level") || profile.level || "intermediate";

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/article/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, level }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `请求失败 (${response.status})`);
        return;
      }

      setArticle(data as Article);
    } catch (err) {
      setError(
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "网络连接失败，请检查网络后重试"
          : "请求异常，请稍后重试"
      );
    } finally {
      setLoading(false);
    }
  }, [word, level]);

  // Fetch article on mount
  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // Auto-save history record when pronunciation exercise completes
  useEffect(() => {
    // Capture previous state BEFORE updating the ref
    const prevState = prevRecordingStateRef.current;

    // Reset save guard when user starts a new recording
    if (recordingState === "recording") {
      lastSavedRef.current = null;
    }

    // Only save on the transition: processing → done
    const justFinished =
      prevState === "processing" && recordingState === "done";
    if (
      justFinished &&
      score !== null &&
      article &&
      feedbackTokens.length > 0
    ) {
      // Prevent duplicate saves for the same score session
      if (lastSavedRef.current !== `${word}-${score}`) {
        lastSavedRef.current = `${word}-${score}`;

        const incorrectWords = feedbackTokens
          .filter((t) => t.status === "incorrect")
          .map((t) => t.word);

        addRecord({
          id: `h_${Date.now()}`,
          readerId: id,
          word,
          articleTitle: article.title,
          articleContent: article.content,
          meanings: article.meanings,
          pronunciationScore: score,
          incorrectWords,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Update previous state for next render
    prevRecordingStateRef.current = recordingState;
  }, [recordingState, score, article, feedbackTokens, word, id, addRecord]);

  const handleSelectSentence = useCallback(
    (sentence: string) => {
      selectSentence(selectedSentence === sentence ? null : sentence);
    },
    [selectSentence, selectedSentence]
  );

  const handleBack = () => {
    if (historyId) {
      router.push("/history");
    } else if (id === "direct") {
      router.push("/");
    } else {
      router.push(`/reader/${id}`);
    }
  };

  return (
    <div className="flex-1 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {historyId
            ? "返回历史"
            : id === "direct"
              ? "返回首页"
              : "返回阅读器"}
        </button>

        {/* Loading */}
        {loading && (
          <div className="terminal-card p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-text-muted text-sm">
              AI 正在为 <strong className="text-primary">「{word}」</strong>{" "}
              生成多语义文章...
            </p>
            <p className="text-xs text-text-light">
              难度：
              {level === "beginner"
                ? "初级 · 80-120 词"
                : level === "intermediate"
                  ? "中级 · 150-200 词"
                  : "高级 · 200-300 词"}
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="terminal-card p-12 flex flex-col items-center justify-center gap-4">
            <p className="text-error text-sm font-medium">{error}</p>
            <button
              onClick={fetchArticle}
              className="terminal-btn flex items-center gap-2 px-5 py-2.5 bg-primary/15 text-primary"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">重新生成</span>
            </button>
          </div>
        )}

        {/* Article */}
        {!loading && !error && article && (
          <div className="space-y-6">
            <ArticleView
              article={article}
              targetWord={word}
              selectedSentence={selectedSentence}
              onSelectSentence={handleSelectSentence}
            />

            <PronunciationPanel targetWord={word} />
          </div>
        )}
      </div>
    </div>
  );
}
