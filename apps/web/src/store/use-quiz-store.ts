import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiRequest } from '@/lib/api-client';

type Decision = 'known' | 'unknown';

const TOKEN_KEY = 'ai-workshop-token';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function syncUnknownWord(wordId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  try {
    await apiRequest(`/progress/${wordId}`, {
      method: 'POST',
      authToken: token,
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.error('Failed to sync word progress:', err);
  }
}

async function syncKnownWord(wordId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  try {
    await apiRequest(`/progress/${wordId}`, {
      method: 'PUT',
      authToken: token,
      body: JSON.stringify({ status: 'known', quality: 4 }),
    });
  } catch (err) {
    console.error('Failed to sync known word:', err);
  }
}

async function syncResetProgress(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  try {
    await apiRequest('/progress', {
      method: 'DELETE',
      authToken: token,
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.error('Failed to reset progress:', err);
  }
}

interface QuizState {
  wordOrder: number[];
  currentIndex: number;
  knownWordIds: number[];
  unknownWordIds: number[];
  sessionDate: string;
  reviewedToday: number[];
  ensureSession: (totalWords: number) => void;
  swipe: (decision: Decision, totalWords: number, wordId?: number) => void;
  skip: (totalWords: number) => void;
  resetProgress: (totalWords: number) => void;
  hydrateFromServer: (
    indexes: { known: number[]; unknown: number[] },
    totalWords: number
  ) => void;
}

const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const shuffleRange = (length: number) => {
  const arr = Array.from({ length }, (_, i) => i);
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
      swipe: (decision, totalWords, wordId) => {
        if (!totalWords) return;

        if (decision === 'unknown' && wordId !== undefined) {
          void syncUnknownWord(wordId);
        } else if (decision === 'known' && wordId !== undefined) {
          void syncKnownWord(wordId);
        }

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

          const reviewedSet = new Set(state.reviewedToday);
          reviewedSet.add(currentWordIndex);

          let nextIndex = state.currentIndex + 1;
          if (nextIndex > state.wordOrder.length) {
            nextIndex = state.wordOrder.length;
          }

          return {
            ...state,
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

          if (state.wordOrder.length <= 1) {
            return state;
          }

          const nextOrder = [...state.wordOrder];
          nextOrder.splice(state.currentIndex, 1);
          const remaining = nextOrder.length;

          let nextIndex = state.currentIndex;
          if (nextIndex >= remaining) {
            nextIndex = 0;
          }

          const minInsert = Math.min(remaining, nextIndex + 1);
          const maxInsert = remaining;
          const span = maxInsert - minInsert + 1;
          const insertionIndex =
            span > 0 ? minInsert + Math.floor(Math.random() * span) : remaining;
          nextOrder.splice(insertionIndex, 0, currentWordIndex);

          return {
            ...state,
            wordOrder: nextOrder,
            currentIndex: nextIndex,
          };
        });
      },
      resetProgress: (totalWords) => {
        void syncResetProgress();
        set({
          wordOrder: shuffleRange(totalWords),
          currentIndex: 0,
          knownWordIds: [],
          unknownWordIds: [],
          sessionDate: todayKey(),
          reviewedToday: [],
        });
      },
      hydrateFromServer: (unknownIndexes, totalWords) => {
        if (!totalWords) return;
        const uniqueUnknown = Array.from(new Set(unknownIndexes.unknown)).filter(
          (idx) => idx >= 0 && idx < totalWords
        );
        const uniqueKnown = Array.from(new Set(unknownIndexes.known)).filter(
          (idx) => idx >= 0 && idx < totalWords
        );
        set({
          wordOrder: shuffleRange(totalWords),
          currentIndex: 0,
          knownWordIds: uniqueKnown,
          unknownWordIds: uniqueUnknown,
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
export const selectHydrateFromServer = (state: QuizState) =>
  state.hydrateFromServer;
