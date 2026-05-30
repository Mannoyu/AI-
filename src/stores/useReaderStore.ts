"use client";

import { create } from "zustand";
import type { ReadingMaterial } from "@/types";

interface ReaderState {
  currentReader: ReadingMaterial | null;
  selectedWord: string | null;
  ocrLoading: boolean;
  ocrError: string | null;
  setReader: (reader: ReadingMaterial) => void;
  selectWord: (word: string | null) => void;
  setOcrLoading: (loading: boolean) => void;
  setOcrError: (error: string | null) => void;
  clearReader: () => void;
}

export const useReaderStore = create<ReaderState>()((set) => ({
  currentReader: null,
  selectedWord: null,
  ocrLoading: false,
  ocrError: null,
  setReader: (reader) => set({ currentReader: reader, ocrLoading: false }),
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
}));
