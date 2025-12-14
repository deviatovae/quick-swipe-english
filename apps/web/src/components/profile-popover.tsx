import { useState, useRef, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfilePopoverProps {
  email: string;
  onSignOut: () => void;
}

export function ProfilePopover({ email, onSignOut }: ProfilePopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition-colors hover:bg-white"
      >
        <User className="h-5 w-5 text-[#FF6B6B]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-[#FFD9C0] bg-white/95 p-4 shadow-xl backdrop-blur-xl">
          <p className="truncate text-sm font-medium text-[#3D2C29]">{email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-[#8B7355] hover:bg-[#FFE5B4]/30 hover:text-[#3D2C29]"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      )}
    </div>
  );
}
