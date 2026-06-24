"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReadingMaterial } from "@/types";

const MAX_CACHED_READERS = 12;

type ReaderCache = Record<string, ReadingMaterial>;

interface ReaderState {
  currentReader: ReadingMaterial | null;
  readerCache: ReaderCache;
  selectedWord: string | null;
  ocrLoading: boolean;
  ocrError: string | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setReader: (reader: ReadingMaterial) => void;
  getReaderById: (id: string) => ReadingMaterial | null;
  removeReaderById: (id: string) => void;
  selectWord: (word: string | null) => void;
  setOcrLoading: (loading: boolean) => void;
  setOcrError: (error: string | null) => void;
  clearReader: () => void;
}

function getReaderCreatedAtMs(reader: ReadingMaterial): number {
  const timestamp = Date.parse(reader.createdAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function upsertReaderCache(
  readerCache: ReaderCache,
  reader: ReadingMaterial
): ReaderCache {
  const nextEntries = Object.values({
    ...readerCache,
    [reader.id]: reader,
  })
    .sort((left, right) => getReaderCreatedAtMs(right) - getReaderCreatedAtMs(left))
    .slice(0, MAX_CACHED_READERS)
    .map((item) => [item.id, item] as const);

  return Object.fromEntries(nextEntries);
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      currentReader: null,
      readerCache: {},
      selectedWord: null,
      ocrLoading: false,
      ocrError: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setReader: (reader) =>
        set((state) => ({
          currentReader: reader,
          readerCache: upsertReaderCache(state.readerCache, reader),
          ocrLoading: false,
          ocrError: null,
        })),
      getReaderById: (id) => {
        if (!id) {
          return null;
        }

        const { currentReader, readerCache } = get();
        if (currentReader?.id === id) {
          return currentReader;
        }

        return readerCache[id] ?? null;
      },
      removeReaderById: (id) =>
        set((state) => {
          if (!id) {
            return {};
          }

          const nextCache = { ...state.readerCache };
          delete nextCache[id];

          return {
            currentReader:
              state.currentReader?.id === id ? null : state.currentReader,
            readerCache: nextCache,
          };
        }),
      selectWord: (word) => set({ selectedWord: word }),
      setOcrLoading: (loading) => set({ ocrLoading: loading, ocrError: null }),
      setOcrError: (error) => set({ ocrError: error, ocrLoading: false }),
      clearReader: () =>
        set({
          currentReader: null,
          selectedWord: null,
          ocrLoading: false,
          ocrError: null,
        }),
    }),
    {
      name: "eng-reader-reader",
      partialize: (state) => ({
        currentReader: state.currentReader,
        readerCache: state.readerCache,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
