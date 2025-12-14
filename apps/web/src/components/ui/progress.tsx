import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
};

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  return (
    <div
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full border border-[#FFD9C0] bg-amber-50/60 shadow-[inset_0_0_25px_rgba(255,255,255,0.6)]",
        className,
      )}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-[#FF6B6B] to-[#F59E0B] shadow-[0_0_15px_rgba(255,107,107,0.4)] transition-all"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </div>
  );
}
