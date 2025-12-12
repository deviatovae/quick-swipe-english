import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

import type { Word } from "@/types/word";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QuizCardProps {
  word: Word | null;
  position: number;
  total: number;
  onDecision: (decision: "known" | "unknown") => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function QuizCard({
  word,
  position,
  total,
  onDecision,
  onSkip,
  isLoading,
}: QuizCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const [isDragging, setDragging] = useState(false);

  useEffect(() => {
    if (!word) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        onDecision("known");
      } else if (event.key === "ArrowLeft") {
        onDecision("unknown");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDecision, word]);

  const remaining = useMemo(
    () => Math.max(total - position - 1, 0),
    [total, position],
  );

  if (isLoading) {
    return <Card className="h-[460px] w-full animate-pulse bg-muted" />;
  }

  if (!word) {
    return (
      <Card className="flex h-[460px] flex-col items-center justify-center text-center">
        <CardContent className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            All words reviewed
          </p>
          <p className="text-3xl font-semibold">Great job!</p>
          <p className="text-muted-foreground">
            Reset progress to start again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    setDragging(false);
    if (info.offset.x > 120) {
      onDecision("known");
    } else if (info.offset.x < -120) {
      onDecision("unknown");
    }
    x.set(0);
  };

  return (
    <div className="space-y-4">
      <motion.div
        drag="x"
        style={{ x, rotate }}
        dragElastic={0.2}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing"
      >
        <Card className="relative h-[460px] select-none overflow-hidden">
          <CardContent className="flex h-full flex-col justify-between p-8">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Word {position + 1} / {total}
              </p>
              <p className="text-5xl font-bold tracking-tight">{word.word}</p>
              <div className="inline-flex gap-3 text-sm text-muted-foreground">
                <span>{word.pos}</span>
                <span>•</span>
                <span>{word.level}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Remaining: {remaining}</span>
              <span>{isDragging ? "Release to decide" : "Drag or use the buttons"}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-12 border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => onDecision("unknown")}
        >
          Don't know
        </Button>
        <Button className="h-12" onClick={() => onDecision("known")}>
          I know this
        </Button>
        <Button
          variant="ghost"
          className="h-12 border border-border"
          onClick={onSkip}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
