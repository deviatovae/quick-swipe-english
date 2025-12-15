import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, FileDown, Check, X, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export function BottomDrawer({
  known,
  unknown,
  total,
  knownEntries,
  unknownEntries,
  recentIndexes,
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
        className="mx-auto flex w-full max-w-sm items-center justify-between rounded-t-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-xl"
      >
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE5B4]/60 text-[#8B7355]"
        >
          <ChevronUp className="h-4 w-4" />
        </motion.div>
        <div className="flex items-center gap-4 text-sm font-medium text-[#3D2C29]">
          <div className="flex items-center gap-1 text-emerald-600">
            <Check className="h-4 w-4" />
            <span>{known}</span>
          </div>
          <div className="flex items-center gap-1 text-rose-500">
            <X className="h-4 w-4" />
            <span>{unknown}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <Clock3 className="h-4 w-4" />
            <span>{notSeen}</span>
          </div>
        </div>
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
                    <Check className="h-4 w-4 text-emerald-600" />
                    {known}
                  </div>
                  <p className="text-xs text-emerald-600/70">Known</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <div className="flex items-center justify-center gap-1 text-lg font-semibold text-rose-500">
                    <X className="h-4 w-4 text-rose-500" />
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
                <div className="relative flex-1">
                  <select
                    className="w-full appearance-none rounded-xl border border-[#FFD9C0] bg-white/80 px-3 py-2 pr-8 text-sm text-[#3D2C29]"
                    value={range}
                    onChange={(e) => setRange(e.target.value as "all" | "today")}
                  >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                  </select>
                  <ChevronUp className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-180 text-[#8B7355]" />
                </div>
                <Button
                  size="sm"
                  className="gap-2 rounded-xl bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90"
                  onClick={handleExport}
                  disabled={knownEntries.length + unknownEntries.length === 0}
                >
                  <FileDown className="h-4 w-4 text-white" />
                  Export
                </Button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
