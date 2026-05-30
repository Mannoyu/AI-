"use client";

import { create } from "zustand";
import type { Article, FeedbackToken, RecordingState } from "@/types";

interface WordLearnState {
  article: Article | null;
  articleLoading: boolean;
  recordingState: RecordingState;
  selectedSentence: string | null;
  feedbackTokens: FeedbackToken[];
  score: number | null;
  setArticle: (article: Article) => void;
  setArticleLoading: (loading: boolean) => void;
  setRecordingState: (state: RecordingState) => void;
  selectSentence: (sentence: string | null) => void;
  setFeedbackTokens: (tokens: FeedbackToken[]) => void;
  setScore: (score: number | null) => void;
  resetLearn: () => void;
}

export const useWordLearnStore = create<WordLearnState>()((set) => ({
  article: null,
  articleLoading: false,
  recordingState: "idle",
  selectedSentence: null,
  feedbackTokens: [],
  score: null,
  setArticle: (article) => set({ article, articleLoading: false }),
  setArticleLoading: (loading) => set({ articleLoading: loading }),
  setRecordingState: (recordingState) => set({ recordingState }),
  selectSentence: (selectedSentence) => set({ selectedSentence }),
  setFeedbackTokens: (feedbackTokens) => set({ feedbackTokens }),
  setScore: (score) => set({ score }),
  resetLearn: () =>
    set({
      article: null,
      articleLoading: false,
      recordingState: "idle",
      selectedSentence: null,
      feedbackTokens: [],
      score: null,
    }),
}));
