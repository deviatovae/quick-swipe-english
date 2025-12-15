import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, ArrowUp, Send, CheckCircle } from "lucide-react";

interface RulesSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function RulesSidebar({ open, onClose }: RulesSidebarProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-white/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#3D2C29]">
                  How to Use
                </h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFE5B4]/60 text-[#8B7355] transition-colors hover:bg-[#FFE5B4]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Web App Rules */}
              <section className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#FF6B6B]">
                  Web App
                </h3>
                <ul className="mt-3 space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                      <ArrowLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[#3D2C29]">
                        Swipe left / ←
                      </p>
                      <p className="text-sm text-[#8B7355]">
                        I don't know this word
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[#3D2C29]">
                        Swipe right / →
                      </p>
                      <p className="text-sm text-[#8B7355]">I know this word</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <ArrowUp className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[#3D2C29]">Swipe up / ↑</p>
                      <p className="text-sm text-[#8B7355]">
                        Skip for now, review later
                      </p>
                    </div>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-[#8B7355]">
                  Buttons below the card duplicate these actions.
                </p>
              </section>

              {/* Telegram Bot Rules */}
              <section className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0088cc]">
                  Telegram Bot
                </h3>
                <ul className="mt-3 space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0088cc]/10 text-[#0088cc]">
                      <Send className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[#3D2C29]">
                        Review in Telegram
                      </p>
                      <p className="text-sm text-[#8B7355]">
                        Tap to connect your Telegram account
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="mt-4 space-y-2 text-sm text-[#8B7355]">
                  <p>
                    Words marked as "don't know" are sent to the bot for spaced
                    repetition (SM-2 algorithm).
                  </p>
                  <p className="font-medium text-[#3D2C29]">Inline buttons:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      <code className="rounded bg-[#FFE5B4]/50 px-1">✅ I know it</code>{" "}
                      — reinforce a word and increase its next review interval
                    </li>
                    <li>
                      <code className="rounded bg-[#FFE5B4]/50 px-1">❌ Don't know</code>{" "}
                      — reset it to the next day
                    </li>
                    <li>
                      <code className="rounded bg-[#FFE5B4]/50 px-1">🏁 Learned</code>{" "}
                      — remove it from your progress entirely
                    </li>
                  </ul>
                  <p className="font-medium text-[#3D2C29]">Bot commands:</p>
                  <ul className="ml-4 list-disc space-y-1">
                    <li>
                      <code className="rounded bg-[#FFE5B4]/50 px-1">/review</code>{" "}
                      — start reviewing words
                    </li>
                    <li>
                      <code className="rounded bg-[#FFE5B4]/50 px-1">/stats</code>{" "}
                      — view your statistics
                    </li>
                    <li>
                      <code className="rounded bg-[#FFE5B4]/50 px-1">/help</code>{" "}
                      — show available commands
                    </li>
                  </ul>
                </div>
              </section>

              {/* Footer */}
              <div className="mt-8 rounded-xl bg-[#FFE5B4]/30 p-4">
                <p className="text-center text-sm text-[#8B7355]">
                  Tip: Words you struggle with come back sooner for review!
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

