import { useEffect, useMemo, useCallback } from "react";
import { ExportButton } from "@/components/export-button";
import { ProgressOverview } from "@/components/progress-overview";
import { QuizCard } from "@/components/quiz-card";
import { StatisticsGrid } from "@/components/statistics-grid";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <main className="mx-auto max-w-6xl px-4 py-12">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          3,000-word Quiz
          </p>
          <p className="text-muted-foreground">
            Swipe cards, export progress, then continue spaced repetition in the Telegram bot.
          </p>
        </header>

        {error && (
          <p className="mt-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            {error}
          </p>
        )}

        <section className="mt-10 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <QuizCard
            word={currentWord}
            position={currentIndex}
            total={words.length}
            onDecision={handleDecision}
            onSkip={handleSkip}
            isLoading={isLoading}
          />
          <aside className="space-y-4">
            <ProgressOverview
              total={words.length}
              completed={completed}
              onReset={() => resetProgress(words.length)}
            />
            <StatisticsGrid
              known={knownWordIds.length}
              unknown={unknownWordIds.length}
              total={words.length}
            />
            <ExportButton
              knownEntries={knownEntries}
              unknownEntries={unknownEntries}
              recentIndexes={reviewedToday}
            />
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
