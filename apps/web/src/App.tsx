import { useEffect, useMemo, useCallback } from "react";
import { X, Check, SkipForward } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { ProfilePopover } from "@/components/profile-popover";
import { QuizCard } from "@/components/quiz-card";
import { BottomDrawer } from "@/components/bottom-drawer";
import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { useWords } from "@/hooks/use-words";
import type { Word } from "@/types/word";
import {
  useQuizStore,
  selectWordOrder,
  selectCurrentIndex,
  selectKnownWordIds,
  selectUnknownWordIds,
  selectReviewedToday,
  selectEnsureSession,
  selectSwipe,
  selectSkip,
  selectResetProgress,
} from "@/store/use-quiz-store";
import { useAuth } from "@/context/auth-context";

function App() {
  const { words, isLoading, error } = useWords();
  const wordOrder = useQuizStore(selectWordOrder);
  const currentIndex = useQuizStore(selectCurrentIndex);
  const knownWordIds = useQuizStore(selectKnownWordIds);
  const unknownWordIds = useQuizStore(selectUnknownWordIds);
  const reviewedToday = useQuizStore(selectReviewedToday);
  const ensureSession = useQuizStore(selectEnsureSession);
  const swipe = useQuizStore(selectSwipe);
  const skip = useQuizStore(selectSkip);
  const resetProgress = useQuizStore(selectResetProgress);
  const { user, loading: authLoading, signOutUser } = useAuth();

  useEffect(() => {
    if (words.length > 0) {
      ensureSession(words.length);
    }
  }, [words.length, ensureSession]);

  const currentWord = useMemo(() => {
    if (!wordOrder.length || !words.length) return null;
    return words[wordOrder[currentIndex]] ?? null;
  }, [wordOrder, words, currentIndex]);

  const knownEntries = useMemo(
    () =>
      knownWordIds
        .map((idx) => {
          const word = words[idx];
          if (!word) return null;
          return { index: idx, word };
        })
        .filter((entry): entry is { index: number; word: Word } => Boolean(entry)),
    [knownWordIds, words],
  );
  const unknownEntries = useMemo(
    () =>
      unknownWordIds
        .map((idx) => {
          const word = words[idx];
          if (!word) return null;
          return { index: idx, word };
        })
        .filter((entry): entry is { index: number; word: Word } => Boolean(entry)),
    [unknownWordIds, words],
  );

  const handleDecision = useCallback(
    (decision: "known" | "unknown") => {
      swipe(decision, words.length);
    },
    [swipe, words.length],
  );
  const handleSkip = useCallback(() => {
    skip(words.length);
  }, [skip, words.length]);

  const completed = knownWordIds.length + unknownWordIds.length;

  if (authLoading) {
    return (
      <div className="bg-sunset-gradient flex min-h-screen items-center justify-center">
        <p className="text-[#3D2C29]/60">Checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-sunset-gradient flex min-h-screen items-center justify-center px-4">
        <AuthForm />
      </div>
    );
  }

  return (
    <div className="bg-sunset-gradient flex min-h-screen flex-col overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pb-32 pt-6">
        <header className="flex items-center gap-4">
          <ProgressBar total={words.length} completed={completed} />
          <ProfilePopover email={user.email} onSignOut={signOutUser} />
        </header>

        {error && (
          <p className="mt-4 rounded-xl border border-red-300/50 bg-red-100/80 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="mt-6 flex flex-1 flex-col items-center justify-center">
          <div className="w-full">
            <QuizCard
              word={currentWord}
              onDecision={handleDecision}
              isLoading={isLoading}
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full border-red-300 bg-white/80 text-red-500 shadow-lg backdrop-blur hover:bg-red-50 hover:text-red-600"
              onClick={() => handleDecision("unknown")}
              disabled={!currentWord}
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-amber-300 bg-white/80 text-amber-600 shadow-md backdrop-blur hover:bg-amber-50"
              onClick={handleSkip}
              disabled={!currentWord}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full border-green-300 bg-white/80 text-green-500 shadow-lg backdrop-blur hover:bg-green-50 hover:text-green-600"
              onClick={() => handleDecision("known")}
              disabled={!currentWord}
            >
              <Check className="h-6 w-6" />
            </Button>
          </div>
        </section>
      </div>

      <BottomDrawer
        known={knownWordIds.length}
        unknown={unknownWordIds.length}
        total={words.length}
        knownEntries={knownEntries}
        unknownEntries={unknownEntries}
        recentIndexes={reviewedToday}
        onReset={() => resetProgress(words.length)}
      />
    </div>
  );
}

export default App;
