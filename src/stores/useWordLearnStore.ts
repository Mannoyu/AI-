"use client";

import { create } from "zustand";
import type { Article, FeedbackToken, RecordingState } from "@/types";

interface WordLearnState {
  article: Article | null;
  articleLoading: boolean;
  articleError: string | null;
  recordingState: RecordingState;
  selectedSentence: string | null;
  feedbackTokens: FeedbackToken[];
  score: number | null;
  setArticle: (article: Article | null) => void;
  startArticleLoading: () => void;
  setArticleError: (error: string | null) => void;
  setRecordingState: (state: RecordingState) => void;
  selectSentence: (sentence: string | null) => void;
  setFeedbackTokens: (tokens: FeedbackToken[]) => void;
  setScore: (score: number | null) => void;
  setPracticeResult: (tokens: FeedbackToken[], score: number) => void;
  resetPractice: () => void;
  resetLearn: () => void;
}

export const useWordLearnStore = create<WordLearnState>()((set) => ({
  article: null,
  articleLoading: false,
  articleError: null,
  recordingState: "idle",
  selectedSentence: null,
  feedbackTokens: [],
  score: null,
  setArticle: (article) =>
    set({
      article,
      articleLoading: false,
      articleError: null,
    }),
  startArticleLoading: () =>
    set({
      article: null,
      articleLoading: true,
      articleError: null,
      recordingState: "idle",
      selectedSentence: null,
      feedbackTokens: [],
      score: null,
    }),
  setArticleError: (articleError) =>
    set({
      article: null,
      articleLoading: false,
      articleError,
      recordingState: "idle",
      selectedSentence: null,
      feedbackTokens: [],
      score: null,
    }),
  setRecordingState: (recordingState) => set({ recordingState }),
  selectSentence: (selectedSentence) =>
    set((state) => {
      if (state.selectedSentence === selectedSentence) {
        return state;
      }

      return {
        selectedSentence,
        recordingState: "idle",
        feedbackTokens: [],
        score: null,
      };
    }),
  setFeedbackTokens: (feedbackTokens) => set({ feedbackTokens }),
  setScore: (score) => set({ score }),
  setPracticeResult: (feedbackTokens, score) =>
    set({
      feedbackTokens,
      score,
      recordingState: "done",
    }),
  resetPractice: () =>
    set({
      recordingState: "idle",
      selectedSentence: null,
      feedbackTokens: [],
      score: null,
    }),
  resetLearn: () =>
    set({
      article: null,
      articleLoading: false,
      articleError: null,
      recordingState: "idle",
      selectedSentence: null,
      feedbackTokens: [],
      score: null,
    }),
}));
