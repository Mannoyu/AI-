/* ===== Core Types ===== */

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface UserProfile {
  level: Difficulty;
  nickname: string;
  createdAt: string;
}

export interface ReadingMaterial {
  id: string;
  ocrText: string;
  title: string;
  createdAt: string;
  imageDataUrl?: string;
}

export interface WordMeaning {
  meaning: string;
  partOfSpeech: string;
  example: string;
}

export interface Article {
  title: string;
  content: string; // markdown with **word** bold
  meanings: WordMeaning[];
  difficulty: Difficulty;
  wordCount: number;
}

export interface HistoryRecord {
  id: string;
  readerId: string;
  word: string;
  articleTitle: string;
  articleContent: string;
  articleDifficulty?: Difficulty;
  meanings: WordMeaning[];
  pronunciationScore: number;
  incorrectWords: string[];
  createdAt: string;
}

export interface FeedbackToken {
  word: string;
  status: "correct" | "incorrect" | "target" | "pending";
  originalIndex: number;
}

export type RecordingState =
  | "idle"
  | "recording"
  | "processing"
  | "done";

export type PageView = "home" | "reader" | "word-learn" | "history" | "settings";
