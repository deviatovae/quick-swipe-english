import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

import type { Word } from "@/types/word";

interface QuizCardProps {
  word: Word | null;
  onDecision: (decision: "known" | "unknown") => void;
  isLoading: boolean;
}

export function QuizCard({ word, onDecision, isLoading }: QuizCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const [isDragging, setDragging] = useState(false);

  // Color overlays based on drag direction
  const greenOpacity = useTransform(x, [0, 80, 200], [0, 0.2, 0.4]);
  const redOpacity = useTransform(x, [-200, -80, 0], [0.4, 0.2, 0]);

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

  if (isLoading) {
    return (
      <div className="aspect-[3/4] w-full animate-pulse rounded-3xl bg-white/50 shadow-xl backdrop-blur-xl" />
    );
  }

  if (!word) {
    return (
      <div className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-3xl bg-white/85 text-center shadow-xl backdrop-blur-xl">
        <div className="space-y-3">
          <p className="text-5xl">🎉</p>
          <p className="text-xl font-semibold text-[#3D2C29]">All done!</p>
          <p className="text-sm text-[#8B7355]">Reset to start again</p>
        </div>
      </div>
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
    <motion.div
      drag="x"
      style={{ x, rotate }}
      dragElastic={0.2}
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={() => setDragging(true)}
      onDragEnd={handleDragEnd}
      className="cursor-grab active:cursor-grabbing"
    >
      <div className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-3xl bg-white/85 shadow-xl backdrop-blur-xl">
        {/* Green overlay for "known" (drag right) */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl bg-emerald-400"
          style={{ opacity: greenOpacity }}
        />
        {/* Red/coral overlay for "unknown" (drag left) */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl bg-rose-400"
          style={{ opacity: redOpacity }}
        />

        <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
          <p className="text-4xl font-bold tracking-tight text-[#3D2C29]">
            {word.word}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-[#8B7355]">
            <span>{word.pos}</span>
            <span>•</span>
            <span>{word.level}</span>
          </div>
          {isDragging && (
            <p className="mt-6 text-xs text-[#8B7355]">Release to decide</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
