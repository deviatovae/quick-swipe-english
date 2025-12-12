import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Decision = 'known' | 'unknown';

interface QuizState {
  wordOrder: number[];
  currentIndex: number;
  knownWordIds: number[];
  unknownWordIds: number[];
  sessionDate: string;
  reviewedToday: number[];
  ensureSession: (totalWords: number) => void;
  swipe: (decision: Decision, totalWords: number) => void;
  skip: (totalWords: number) => void;
  resetProgress: (totalWords: number) => void;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

const shuffleRange = (length: number) => {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const shuffleList = (indices: number[]) => {
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const withSessionReset = (state: QuizState): QuizState => {
  const key = todayKey();
  if (state.sessionDate === key) {
    return state;
  }
  return {
    ...state,
    sessionDate: key,
    reviewedToday: [],
  };
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      wordOrder: [],
      currentIndex: 0,
      knownWordIds: [],
      unknownWordIds: [],
      sessionDate: todayKey(),
      reviewedToday: [],
      ensureSession: (totalWords) => {
        if (!totalWords) return;
        set((prev) => {
          const state = withSessionReset(prev);
          if (state.wordOrder.length === totalWords) {
            return state;
          }
          return {
            ...state,
            wordOrder: shuffleRange(totalWords),
            currentIndex: 0,
            knownWordIds: [],
            unknownWordIds: [],
          };
        });
      },
      swipe: (decision, totalWords) => {
        if (!totalWords) return;
        set((prev) => {
          const state = withSessionReset(prev);

          if (!state.wordOrder.length) {
            return {
              ...state,
              wordOrder: shuffleRange(totalWords),
              currentIndex: 0,
            };
          }

          const currentWordIndex = state.wordOrder[state.currentIndex];
          if (currentWordIndex === undefined) {
            return state;
          }

          const knownSet = new Set(state.knownWordIds);
          const unknownSet = new Set(state.unknownWordIds);
          knownSet.delete(currentWordIndex);
          unknownSet.delete(currentWordIndex);
          if (decision === 'known') {
            knownSet.add(currentWordIndex);
          } else {
            unknownSet.add(currentWordIndex);
          }

          let nextIndex = state.currentIndex + 1;
          let nextOrder = state.wordOrder;
          if (nextIndex >= state.wordOrder.length) {
            if (unknownSet.size > 0) {
              nextOrder = shuffleList(Array.from(unknownSet));
              nextIndex = 0;
            } else {
              nextIndex = state.wordOrder.length;
            }
          }

          const reviewedSet = new Set(state.reviewedToday);
          reviewedSet.add(currentWordIndex);

          return {
            ...state,
            wordOrder: nextOrder,
            currentIndex: nextIndex,
            knownWordIds: Array.from(knownSet),
            unknownWordIds: Array.from(unknownSet),
            reviewedToday: Array.from(reviewedSet),
          };
        });
      },
      skip: (totalWords) => {
        if (!totalWords) return;
        set((prev) => {
          const state = withSessionReset(prev);
          if (!state.wordOrder.length) {
            return {
              ...state,
              wordOrder: shuffleRange(totalWords),
              currentIndex: 0,
            };
          }

          const currentWordIndex = state.wordOrder[state.currentIndex];
          if (currentWordIndex === undefined) {
            return state;
          }

          const nextOrder = [...state.wordOrder];
          nextOrder.splice(state.currentIndex, 1);
          const remaining = nextOrder.length;
          const insertBase = Math.min(remaining, state.currentIndex);
          const insertionOffset =
            remaining - insertBase > 0
              ? Math.floor(Math.random() * (remaining - insertBase + 1))
              : 0;
          const insertionIndex = insertBase + insertionOffset;
          nextOrder.splice(insertionIndex, 0, currentWordIndex);
          const nextIndex = Math.min(state.currentIndex, nextOrder.length - 1);

          return {
            ...state,
            wordOrder: nextOrder,
            currentIndex: nextIndex,
          };
        });
      },
      resetProgress: (totalWords) => {
        set({
          wordOrder: shuffleRange(totalWords),
          currentIndex: 0,
          knownWordIds: [],
          unknownWordIds: [],
          sessionDate: todayKey(),
          reviewedToday: [],
        });
      },
    }),
    {
      name: 'quiz-store',
      storage: createJSONStorage(() => localStorage),
      partialize: ({
        wordOrder,
        currentIndex,
        knownWordIds,
        unknownWordIds,
        sessionDate,
        reviewedToday,
      }) => ({
        wordOrder,
        currentIndex,
        knownWordIds,
        unknownWordIds,
        sessionDate,
        reviewedToday,
      }),
    }
  )
);

export const selectWordOrder = (state: QuizState) => state.wordOrder;
export const selectCurrentIndex = (state: QuizState) => state.currentIndex;
export const selectKnownWordIds = (state: QuizState) => state.knownWordIds;
export const selectUnknownWordIds = (state: QuizState) => state.unknownWordIds;
export const selectReviewedToday = (state: QuizState) => state.reviewedToday;
export const selectEnsureSession = (state: QuizState) => state.ensureSession;
export const selectSwipe = (state: QuizState) => state.swipe;
export const selectSkip = (state: QuizState) => state.skip;
export const selectResetProgress = (state: QuizState) => state.resetProgress;
