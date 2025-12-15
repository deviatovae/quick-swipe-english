import { useEffect, useMemo, useCallback, useState } from "react";
import { X, Check, FastForward, RotateCcw, Send, HelpCircle } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { ProfilePopover } from "@/components/profile-popover";
import { QuizCard } from "@/components/quiz-card";
import { BottomDrawer } from "@/components/bottom-drawer";
import { RulesSidebar } from "@/components/rules-sidebar";
import { AuthForm } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
import { apiRequest } from "@/lib/api-client";
import { TELEGRAM_BOT_USERNAME } from "@/lib/telegram";

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
  const { user, loading: authLoading, signOutUser, token, isNewUser, clearNewUserFlag } = useAuth();
  const [linkLoading, setLinkLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-open sidebar for new users
  useEffect(() => {
    if (isNewUser) {
      setSidebarOpen(true);
      clearNewUserFlag();
    }
  }, [isNewUser, clearNewUserFlag]);

  useEffect(() => {
    if (words.length === 0) return;
    if (wordOrder.length !== words.length) {
      ensureSession(words.length);
    }
  }, [words.length, wordOrder.length, ensureSession]);

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
      swipe(decision, words.length, currentWord?.id);
    },
    [swipe, words.length, currentWord?.id],
  );
  const handleSkip = useCallback(() => {
    skip(words.length);
  }, [skip, words.length]);

  const completed = knownWordIds.length + unknownWordIds.length;

  const handleConnectTelegram = useCallback(async () => {
    if (!token || !TELEGRAM_BOT_USERNAME) return;

    setLinkLoading(true);
    try {
      const { code } = await apiRequest<{ code: string; expiresIn: number }>(
        "/telegram/link-code",
        {
          method: "POST",
          authToken: token,
          body: JSON.stringify({}),
        },
      );
      const telegramUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${code}`;
      window.open(telegramUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to generate Telegram link:", error);
    } finally {
      setLinkLoading(false);
    }
  }, [token]);

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
        <header className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition-colors hover:bg-white"
          >
            <HelpCircle className="h-5 w-5 text-[#8B7355]" />
          </button>
          <div className="flex flex-1 flex-col">
            <ProgressBar total={words.length} completed={completed} />
            <p className="mt-1 text-xs font-medium text-[#F5C49B]">
              {completed}/{words.length || 0}
            </p>
          </div>
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
              onSkip={handleSkip}
              isLoading={isLoading}
            />
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-300/50 text-rose-600 shadow-xl hover:bg-rose-500/30 transition-all"
              onClick={() => handleDecision("unknown")}
              disabled={!currentWord}
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-300/50 text-amber-600 shadow-xl hover:bg-amber-500/30 transition-all"
              onClick={handleSkip}
              disabled={!currentWord}
            >
              <FastForward className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-300/50 text-emerald-600 shadow-xl hover:bg-emerald-500/30 transition-all"
              onClick={() => handleDecision("known")}
              disabled={!currentWord}
            >
              <Check className="h-6 w-6" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full bg-slate-400/20 backdrop-blur-md border border-slate-300/50 text-slate-600 shadow-xl hover:bg-slate-400/30 transition-all"
                  disabled={!words.length}
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-[#FFD9C0] bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#3D2C29]">
                    Reset all progress?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[#8B7355]">
                    This will shuffle the deck and erase current known/unknown lists. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <AlertDialogAction
                    onClick={() => resetProgress(words.length)}
                    className="bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90"
                  >
                    Reset
                  </AlertDialogAction>
                  <AlertDialogCancel className="border-[#FFD9C0] text-[#3D2C29]">
                    Cancel
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            {TELEGRAM_BOT_USERNAME && (
              <Button
                variant="outline"
                className="w-full justify-center gap-2 rounded-2xl border-[#0088cc]/40 bg-white/90 text-[#0088cc] shadow-lg backdrop-blur hover:bg-[#0088cc] hover:text-white hover:border-[#0088cc]"
                onClick={handleConnectTelegram}
                disabled={linkLoading || !token}
              >
                <Send className="h-4 w-4" />
                {linkLoading ? "Opening..." : "Review in Telegram"}
              </Button>
            )}
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
      />

      <RulesSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

export default App;
