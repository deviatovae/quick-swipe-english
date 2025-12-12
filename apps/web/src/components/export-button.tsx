import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Word } from "@/types/word";

interface WordEntry {
  index: number;
  word: Word;
}

interface ExportButtonProps {
  knownEntries: WordEntry[];
  unknownEntries: WordEntry[];
  recentIndexes: number[];
}

export function ExportButton({
  knownEntries,
  unknownEntries,
  recentIndexes,
}: ExportButtonProps) {
  const [range, setRange] = useState<"all" | "today">("all");
  const reviewedSet = useMemo(() => new Set(recentIndexes), [recentIndexes]);

  const filterEntries = (entries: WordEntry[]) =>
    range === "all"
      ? entries
      : entries.filter((entry) => reviewedSet.has(entry.index));

  const handleExport = async () => {
    const filteredKnown = filterEntries(knownEntries);
    const filteredUnknown = filterEntries(unknownEntries);
    if (range === "today" && filteredKnown.length + filteredUnknown.length === 0) {
      window.alert("No words were reviewed today.");
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
    doc.text(
      `Generated on ${new Date().toLocaleString()}`,
      40,
      cursorY,
    );
    cursorY += 32;

    addList(
      range === "today" ? "Known today" : "Known words",
      filteredKnown,
    );
    cursorY += 16;
    addList(
      range === "today" ? "Need review today" : "Need review",
      filteredUnknown,
    );

    const suffix = range === "today" ? "-today" : "-all";
    doc.save(`vocabulary-quiz${suffix}.pdf`);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Export range</span>
        <select
          className="rounded-md border border-input bg-transparent px-2 py-1 text-sm"
          value={range}
          onChange={(event) => setRange(event.target.value as "all" | "today")}
        >
          <option value="all">All time</option>
          <option value="today">Reviewed today</option>
        </select>
      </div>
      <Button variant="secondary" className="w-full" onClick={handleExport}>
        Export results as PDF
      </Button>
    </div>
  );
}
