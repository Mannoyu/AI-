"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HistoryRecord } from "@/types";

interface HistoryState {
  records: HistoryRecord[];
  loading: boolean;
  error: string | null;
  /** Fetch records from server (call once on app mount). */
  loadRecords: () => Promise<void>;
  /** Add a record locally + POST to server. */
  addRecord: (record: HistoryRecord) => Promise<void>;
  /** Remove a record locally + DELETE from server. */
  removeRecord: (id: string) => Promise<void>;
  /** Clear all records locally + DELETE on server. */
  clearRecords: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      records: [],
      loading: false,
      error: null,

      loadRecords: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch("/api/history");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const serverRecords: HistoryRecord[] = data.records || [];
          // Merge with local records (dedup by id) so optimistically-saved
          // records are not lost if the POST hasn't completed yet
          const localRecords = get().records;
          const merged = new Map<string, HistoryRecord>();
          for (const r of serverRecords) merged.set(r.id, r);
          for (const r of localRecords) {
            if (!merged.has(r.id)) merged.set(r.id, r);
          }
          const sorted = Array.from(merged.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          set({ records: sorted, loading: false });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error("[History] Load failed:", message);
          // Keep existing local records on error
          set({ error: "加载历史记录失败", loading: false });
        }
      },

      addRecord: async (record) => {
        // Optimistic update
        const prev = get().records;
        set({ records: [record, ...prev], error: null });

        try {
          const res = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(record),
          });
          if (!res.ok) {
            // Rollback on failure
            set({ records: prev });
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error("[History] Add failed:", message);
          // Verify rollback is still needed (check first item)
          if (get().records[0]?.id === record.id) {
            set({ records: prev });
          }
          set({ error: "保存记录失败" });
        }
      },

      removeRecord: async (id) => {
        const prev = get().records;
        set({ records: prev.filter((r) => r.id !== id), error: null });

        try {
          const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
            method: "DELETE",
          });
          if (!res.ok) {
            set({ records: prev });
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error("[History] Remove failed:", message);
          if (get().records.every((r) => r.id !== id) && prev.some((r) => r.id === id)) {
            set({ records: prev });
          }
          set({ error: "删除记录失败" });
        }
      },

      clearRecords: async () => {
        const prev = get().records;
        set({ records: [], error: null });

        try {
          const res = await fetch("/api/history", { method: "DELETE" });
          if (!res.ok) {
            set({ records: prev });
            throw new Error(`HTTP ${res.status}`);
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          console.error("[History] Clear failed:", message);
          if (get().records.length === 0 && prev.length > 0) {
            set({ records: prev });
          }
          set({ error: "清空记录失败" });
        }
      },
    }),
    {
      name: "eng-reader-history",
      // Only persist records to localStorage as a cache; server is the source of truth
      partialize: (state) => ({ records: state.records }),
    }
  )
);
