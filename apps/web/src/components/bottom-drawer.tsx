import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, FileDown, RotateCcw, Check, X } from "lucide-react";
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
import type { Word } from "@/types/word";

interface WordEntry {
  index: number;
  word: Word;
}

interface BottomDrawerProps {
  known: number;
  unknown: number;
  total: number;
  knownEntries: WordEntry[];
  unknownEntries: WordEntry[];
  recentIndexes: number[];
  onReset: () => void;
}

export function BottomDrawer({
  known,
  unknown,
  total,
  knownEntries,
  unknownEntries,
  recentIndexes,
  onReset,
}: BottomDrawerProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<"all" | "today">("all");
  const reviewedSet = useMemo(() => new Set(recentIndexes), [recentIndexes]);

  const filterEntries = (entries: WordEntry[]) =>
    range === "all"
      ? entries
      : entries.filter((entry) => reviewedSet.has(entry.index));

  const handleExport = async () => {
    const filteredKnown = filterEntries(knownEntries);
    const filteredUnknown = filterEntries(unknownEntries);

    if (filteredKnown.length + filteredUnknown.length === 0) {
      return;
    }

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt" });
    let cursorY = 40;

    const addHeading = (text: string) => {
      doc.setFontSize(18);
      doc.text(text, 40, cursorY);
      cursorY += 24;
    };

    const addList = (title: string, entries: WordEntry[]) => {
      addHeading(title);
      doc.setFontSize(12);
      if (!entries.length) {
        doc.text("—", 50, cursorY);
        cursorY += 18;
        return;
      }
      entries.forEach(({ word }, index) => {
        if (cursorY > 760) {
          doc.addPage();
          cursorY = 40;
        }
        doc.text(
          `${index + 1}. ${word.word} (${word.pos}, ${word.level})`,
          50,
          cursorY,
        );
        cursorY += 18;
      });
    };

    addHeading("Vocabulary quiz results");
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 40, cursorY);
    cursorY += 32;

    addList(range === "today" ? "Known today" : "Known words", filteredKnown);
    cursorY += 16;
    addList(
      range === "today" ? "Need review today" : "Need review",
      filteredUnknown,
    );

    const suffix = range === "today" ? "-today" : "-all";
    doc.save(`vocabulary-quiz${suffix}.pdf`);
  };

  const notSeen = Math.max(total - (known + unknown), 0);
  const accuracy =
    known + unknown === 0 ? 0 : Math.round((known / (known + unknown)) * 100);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-t-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl"
      >
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronUp className="h-5 w-5 text-[#8B7355]" />
        </motion.div>
        <span className="text-sm text-[#8B7355]">
          {known} ✓ · {unknown} ✗ · {notSeen} left
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden bg-white/95 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-sm space-y-4 px-4 pb-6 pt-2">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <div className="flex items-center justify-center gap-1 text-lg font-semibold text-emerald-600">
                    <Check className="h-4 w-4" />
                    {known}
                  </div>
                  <p className="text-xs text-emerald-600/70">Known</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <div className="flex items-center justify-center gap-1 text-lg font-semibold text-rose-500">
                    <X className="h-4 w-4" />
                    {unknown}
                  </div>
                  <p className="text-xs text-rose-500/70">Review</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-lg font-semibold text-amber-600">
                    {notSeen}
                  </p>
                  <p className="text-xs text-amber-600/70">Left</p>
                </div>
                <div className="rounded-xl bg-[#FFE5B4]/50 p-3">
                  <p className="text-lg font-semibold text-[#3D2C29]">
                    {accuracy}%
                  </p>
                  <p className="text-xs text-[#8B7355]">Acc</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  className="flex-1 rounded-xl border border-[#FFD9C0] bg-white/80 px-3 py-2 text-sm text-[#3D2C29]"
                  value={range}
                  onChange={(e) => setRange(e.target.value as "all" | "today")}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                </select>
                <Button
                  size="sm"
                  className="gap-2 rounded-xl bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90"
                  onClick={handleExport}
                  disabled={knownEntries.length + unknownEntries.length === 0}
                >
                  <FileDown className="h-4 w-4" />
                  Export
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-[#8B7355] hover:bg-[#FFE5B4]/30 hover:text-[#3D2C29]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset progress
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-[#FFD9C0] bg-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#3D2C29]">
                      Reset all progress?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#8B7355]">
                      This will shuffle the deck and erase current known/unknown
                      lists. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <AlertDialogAction
                      onClick={onReset}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
