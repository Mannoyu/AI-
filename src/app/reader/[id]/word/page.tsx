"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, Target } from "lucide-react";
import { ArticleView } from "@/components/word-learn/ArticleView";
import { PronunciationPanel } from "@/components/word-learn/PronunciationPanel";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { useUserStore } from "@/stores/useUserStore";
import { useWordLearnStore } from "@/stores/useWordLearnStore";
import type { Article, Difficulty, HistoryRecord } from "@/types";

const VALID_DIFFICULTIES: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

function normalizeLevel(value: string | null): Difficulty | null {
  return VALID_DIFFICULTIES.includes(value as Difficulty)
    ? (value as Difficulty)
    : null;
}

function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

function buildArticleFromHistory(record: HistoryRecord): Article {
  return {
    title: record.articleTitle,
    content: record.articleContent,
    meanings: record.meanings,
    difficulty: record.articleDifficulty ?? "intermediate",
    wordCount: countWords(record.articleContent),
  };
}

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
    resetPractice,
    selectSentence,
    selectedSentence,
    recordingState,
    feedbackTokens,
    score,
  } = useWordLearnStore();
  const {
    addRecord,
    getRecordById,
    hydrated: historyHydrated,
    loadRecords,
    loading: historyLoading,
  } = useHistoryStore();

  const lastSavedRef = useRef<string | null>(null);
  const prevRecordingStateRef = useRef(recordingState);
  const requestIdRef = useRef(0);

  const historyId = searchParams.get("historyId");
  const requestedWord = searchParams.get("word")?.trim() ?? "";
  const historyRecord = historyId ? getRecordById(historyId) : null;
  const historyArticle = useMemo(
    () => (historyRecord ? buildArticleFromHistory(historyRecord) : null),
    [historyRecord]
  );

  const word = historyRecord?.word || requestedWord || "bank";
  const requestedLevel = normalizeLevel(searchParams.get("level"));
  const level =
    historyRecord?.articleDifficulty ??
    requestedLevel ??
    profile.level ??
    "intermediate";
  const waitingForHistory = Boolean(historyId) && (!historyHydrated || historyLoading);

  const [generatedArticle, setGeneratedArticle] = useState<Article | null>(null);
  const [isFetchingArticle, setIsFetchingArticle] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const article = historyArticle ?? generatedArticle;
  const loading = waitingForHistory || (!historyArticle && isFetchingArticle);
  const error = historyArticle ? null : fetchError;
  const completedSentence =
    recordingState === "done" && score !== null ? selectedSentence : null;
  const difficultyLabel =
    level === "beginner" ? "初级" : level === "intermediate" ? "中级" : "高级";

  useEffect(() => {
    resetPractice();
    lastSavedRef.current = null;

    const timer = window.setTimeout(() => {
      setGeneratedArticle(null);
      setFetchError(null);
      setIsFetchingArticle(false);
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [historyId, level, resetPractice, word]);

  useEffect(() => {
    if (!historyId) {
      return;
    }

    void loadRecords();
  }, [historyId, loadRecords]);

  useEffect(() => {
    if (historyArticle || waitingForHistory) {
      return;
    }

    const nextRequestId = requestIdRef.current + 1;
    requestIdRef.current = nextRequestId;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setIsFetchingArticle(true);
        setFetchError(null);
        setGeneratedArticle(null);

        try {
          const response = await fetch("/api/article/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word, level }),
          });

          const data = await response.json();
          if (cancelled || requestIdRef.current !== nextRequestId) {
            return;
          }

          if (!response.ok) {
            setFetchError(data.error || `请求失败 (${response.status})`);
            return;
          }

          setGeneratedArticle(data as Article);
        } catch (err) {
          if (cancelled || requestIdRef.current !== nextRequestId) {
            return;
          }

          setFetchError(
            err instanceof TypeError && err.message === "Failed to fetch"
              ? "网络连接失败，请检查网络后重试"
              : "请求异常，请稍后重试"
          );
        } finally {
          if (!cancelled && requestIdRef.current === nextRequestId) {
            setIsFetchingArticle(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [historyArticle, level, retryCount, waitingForHistory, word]);

  useEffect(() => {
    const prevState = prevRecordingStateRef.current;

    if (recordingState === "recording") {
      lastSavedRef.current = null;
    }

    const justFinished =
      prevState === "processing" && recordingState === "done";

    if (justFinished && score !== null && article && feedbackTokens.length > 0) {
      const saveKey = `${word}-${score}`;
      if (lastSavedRef.current !== saveKey) {
        lastSavedRef.current = saveKey;

        const incorrectWords = feedbackTokens
          .filter((token) => token.status === "incorrect")
          .map((token) => token.word);

        void addRecord({
          id: `h_${Date.now()}`,
          readerId: id,
          word,
          articleTitle: article.title,
          articleContent: article.content,
          articleDifficulty: article.difficulty,
          meanings: article.meanings,
          pronunciationScore: score,
          incorrectWords,
          createdAt: new Date().toISOString(),
        });
      }
    }

    prevRecordingStateRef.current = recordingState;
  }, [addRecord, article, feedbackTokens, id, recordingState, score, word]);

  const handleSelectSentence = (sentence: string) => {
    selectSentence(selectedSentence === sentence ? null : sentence);
  };

  const handleBack = () => {
    if (historyId) {
      router.push("/history");
      return;
    }

    if (id === "direct") {
      router.push("/");
      return;
    }

    router.push(`/reader/${id}`);
  };

  const handleRetry = () => {
    setRetryCount((value) => value + 1);
  };

  return (
    <div className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          {historyId
            ? "返回历史"
            : id === "direct"
              ? "返回首页"
              : "返回阅读器"}
        </button>

        {!loading && !error && article && (
          <section className="terminal-card scanline overflow-hidden p-5 md:p-6">
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary/55">
                  Practice
                </p>
                <h1
                  className="mt-2 break-words text-xl font-semibold text-text md:text-2xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  围绕 {word} 的多语义跟读练习
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-text-muted">
                  先选择一句，再开始录音。系统会保存本次练习分数和错误词，方便你回到历史记录复习。
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-text-light md:max-w-sm md:justify-end">
                <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  目标词 {word}
                </span>
                <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                  难度 {difficultyLabel}
                </span>
                <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[rgba(0,255,65,0.08)] bg-surface/70 px-3 py-1.5">
                  当前分数 {score ?? "--"}
                </span>
              </div>
            </div>
          </section>
        )}

        {loading && (
          <div className="terminal-card flex flex-col items-center justify-center gap-4 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-text-muted">
              AI 正在围绕 <strong className="text-primary">{word}</strong>{" "}
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

        {!loading && error && (
          <div className="terminal-card flex flex-col items-center justify-center gap-4 p-12">
            <p className="text-sm font-medium text-error">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="terminal-btn flex items-center gap-2 bg-primary/15 px-5 py-2.5 text-primary"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">重新生成</span>
            </button>
          </div>
        )}

        {!loading && !error && article && (
          <div className="space-y-6">
            <ArticleView
              article={article}
              targetWord={word}
              selectedSentence={selectedSentence}
              onSelectSentence={handleSelectSentence}
              recordingState={recordingState}
              completedSentence={completedSentence}
              score={score}
            />
            <PronunciationPanel targetWord={word} />
          </div>
        )}
      </div>
    </div>
  );
}
