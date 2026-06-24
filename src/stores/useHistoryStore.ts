"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty, HistoryRecord } from "@/types";

const HISTORY_LOAD_ERROR = "加载学习记录失败，请稍后重试。";
const HISTORY_SAVE_ERROR = "保存学习记录失败，请稍后重试。";
const HISTORY_REMOVE_ERROR = "删除学习记录失败，请稍后重试。";
const HISTORY_CLEAR_ERROR = "清空学习记录失败，请稍后重试。";

interface HistoryState {
  records: HistoryRecord[];
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  getRecordById: (id: string) => HistoryRecord | null;
  loadRecords: () => Promise<void>;
  addRecord: (record: HistoryRecord) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  clearRecords: () => Promise<void>;
}

const VALID_DIFFICULTIES: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0
    )
    .map((item) => item.trim());
}

function normalizeDifficulty(value: unknown): Difficulty | undefined {
  return VALID_DIFFICULTIES.includes(value as Difficulty)
    ? (value as Difficulty)
    : undefined;
}

function normalizeMeanings(value: unknown): HistoryRecord["meanings"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      meaning: normalizeString(item.meaning),
      partOfSpeech: normalizeString(item.partOfSpeech),
      example: normalizeString(item.example),
    }))
    .filter((item) => item.meaning && item.partOfSpeech && item.example);
}

function normalizeHistoryRecord(value: unknown): HistoryRecord | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeString(value.id);
  const readerId = normalizeString(value.readerId);
  const word = normalizeString(value.word);
  const articleTitle = normalizeString(value.articleTitle);
  const articleContent = normalizeString(value.articleContent);
  const articleDifficulty = normalizeDifficulty(value.articleDifficulty);
  const createdAt = normalizeString(value.createdAt);
  const pronunciationScore =
    typeof value.pronunciationScore === "number" &&
    Number.isFinite(value.pronunciationScore)
      ? Math.max(0, Math.min(100, Math.round(value.pronunciationScore)))
      : NaN;

  if (
    !id ||
    !readerId ||
    !word ||
    !articleTitle ||
    !articleContent ||
    !createdAt ||
    !Number.isFinite(pronunciationScore)
  ) {
    return null;
  }

  return {
    id,
    readerId,
    word,
    articleTitle,
    articleContent,
    articleDifficulty,
    meanings: normalizeMeanings(value.meanings),
    pronunciationScore,
    incorrectWords: normalizeStringList(value.incorrectWords),
    createdAt,
  };
}

function normalizeHistoryRecords(value: unknown): HistoryRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeHistoryRecord)
    .filter((record): record is HistoryRecord => record !== null);
}

function getCreatedAtMs(record: HistoryRecord): number {
  const timestamp = Date.parse(record.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function mergeRecords(...recordLists: HistoryRecord[][]): HistoryRecord[] {
  const byId = new Map<string, HistoryRecord>();

  for (const records of recordLists) {
    for (const record of records) {
      const existing = byId.get(record.id);

      if (!existing || getCreatedAtMs(record) >= getCreatedAtMs(existing)) {
        byId.set(record.id, record);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (left, right) => getCreatedAtMs(right) - getCreatedAtMs(left)
  );
}

function extractApiError(data: unknown): string | null {
  if (!isRecord(data) || typeof data.error !== "string") {
    return null;
  }

  const message = data.error.trim();
  return message || null;
}

async function readResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      records: [],
      loading: false,
      error: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      getRecordById: (id) => {
        if (!id) {
          return null;
        }

        return get().records.find((record) => record.id === id) ?? null;
      },

      loadRecords: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/history");
          const data = await readResponseBody(response);

          if (!response.ok) {
            throw new Error(extractApiError(data) ?? `HTTP ${response.status}`);
          }

          const serverRecords = normalizeHistoryRecords(
            isRecord(data) ? data.records : []
          );
          const sorted = mergeRecords(serverRecords, get().records);

          set({ records: sorted, loading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[HistoryStore] loadRecords failed:", message);
          set({ error: HISTORY_LOAD_ERROR, loading: false });
        }
      },

      addRecord: async (record) => {
        const prev = get().records;
        const optimisticRecords = mergeRecords([record], prev);
        set({ records: optimisticRecords, error: null });

        try {
          const response = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record),
          });
          const data = await readResponseBody(response);

          if (!response.ok) {
            throw new Error(extractApiError(data) ?? `HTTP ${response.status}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[HistoryStore] addRecord failed:", {
            id: record.id,
            error: message,
          });
          set((state) => ({
            records: mergeRecords(
              prev,
              state.records.filter((item) => item.id !== record.id)
            ),
            error: HISTORY_SAVE_ERROR,
          }));
        }
      },

      removeRecord: async (id) => {
        const prev = get().records;
        set({ records: prev.filter((record) => record.id !== id), error: null });

        try {
          const response = await fetch(`/api/history/${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
          const data = await readResponseBody(response);

          if (!response.ok) {
            throw new Error(extractApiError(data) ?? `HTTP ${response.status}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[HistoryStore] removeRecord failed:", { id, error: message });
          set((state) => ({
            records:
              state.records.every((record) => record.id !== id) &&
              prev.some((record) => record.id === id)
                ? mergeRecords(prev, state.records)
                : state.records,
            error: HISTORY_REMOVE_ERROR,
          }));
        }
      },

      clearRecords: async () => {
        const prev = get().records;
        set({ records: [], error: null });

        try {
          const response = await fetch("/api/history", { method: "DELETE" });
          const data = await readResponseBody(response);

          if (!response.ok) {
            throw new Error(extractApiError(data) ?? `HTTP ${response.status}`);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.error("[HistoryStore] clearRecords failed:", message);
          set((state) => ({
            records:
              state.records.length === 0 && prev.length > 0
                ? mergeRecords(prev, state.records)
                : state.records,
            error: HISTORY_CLEAR_ERROR,
          }));
        }
      },
    }),
    {
      name: "eng-reader-history",
      partialize: (state) => ({ records: state.records }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
