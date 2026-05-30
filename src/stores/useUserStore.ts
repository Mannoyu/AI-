"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, Difficulty } from "@/types";

interface UserState {
  profile: UserProfile;
  setLevel: (level: Difficulty) => void;
  setNickname: (nickname: string) => void;
  isFirstVisit: boolean;
  markVisited: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: {
        level: "intermediate",
        nickname: "Learner",
        createdAt: new Date().toISOString(),
      },
      isFirstVisit: true,
      setLevel: (level) =>
        set((s) => ({ profile: { ...s.profile, level } })),
      setNickname: (nickname) =>
        set((s) => ({ profile: { ...s.profile, nickname } })),
      markVisited: () => set({ isFirstVisit: false }),
    }),
    { name: "eng-reader-user" }
  )
);
