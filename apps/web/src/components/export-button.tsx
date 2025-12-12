import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
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
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);
  const [emptyDialogContent, setEmptyDialogContent] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingExport, setPendingExport] = useState<{
    known: WordEntry[];
    unknown: WordEntry[];
  } | null>(null);
  const reviewedSet = useMemo(() => new Set(recentIndexes), [recentIndexes]);

  const filterEntries = (entries: WordEntry[]) =>
    range === "all"
      ? entries
      : entries.filter((entry) => reviewedSet.has(entry.index));

  const performExport = async (filteredKnown: WordEntry[], filteredUnknown: WordEntry[]) => {
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
    setPendingExport(null);
  };

  const handleExport = () => {
    const hasAnyWords = knownEntries.length + unknownEntries.length > 0;
    const filteredKnown = filterEntries(knownEntries);
    const filteredUnknown = filterEntries(unknownEntries);
    const hasFilteredWords = filteredKnown.length + filteredUnknown.length > 0;

    if (!hasAnyWords) {
      setEmptyDialogContent({
        title: "No progress yet",
        description: "Start reviewing words before exporting a report.",
      });
      setShowEmptyDialog(true);
      return;
    }

    if (!hasFilteredWords) {
      setEmptyDialogContent({
        title: "No words in this range",
        description: "Switch to “All time” or review some words first.",
      });
      setShowEmptyDialog(true);
      return;
    }
    setPendingExport({ known: filteredKnown, unknown: filteredUnknown });
    setShowConfirmDialog(true);
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

      <AlertDialog open={showEmptyDialog} onOpenChange={setShowEmptyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{emptyDialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {emptyDialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowEmptyDialog(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export PDF?</AlertDialogTitle>
            <AlertDialogDescription>
              This will download your {range === "today" ? "today's" : "full"} results as a PDF file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={async () => {
                if (pendingExport) {
                  await performExport(pendingExport.known, pendingExport.unknown);
                }
                setShowConfirmDialog(false);
              }}
            >
              Export
            </AlertDialogAction>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
