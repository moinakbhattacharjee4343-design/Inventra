import React, { useState, useRef, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export type GlossaryKey =
  | "safetyStock"
  | "rop"
  | "eoq"
  | "wape"
  | "daysOfCover"
  | "monteCarlo"
  | "serviceLevel";

export const HelpTip: React.FC<{ term: GlossaryKey }> = ({ term }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const entry = t.glossary[term];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (!entry) return null;

  return (
    <div ref={ref} className="relative inline-flex items-center align-middle">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={entry.title}
        aria-expanded={open}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded text-[#6B6785] hover:text-[#4B3FD6] dark:text-[#A09CB5] dark:hover:text-[#E3C16F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] dark:focus-visible:ring-[#8B7CFF] transition-colors"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={entry.title}
          className="absolute left-0 top-7 z-40 w-72 rounded-xl border border-[#ECE6D8] bg-white/95 p-3.5 text-left shadow-xl backdrop-blur-md dark:border-[#2A2A44] dark:bg-[#12121F]/95"
        >
          <p className="font-display text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
            {entry.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#6B6785] dark:text-[#A09CB5]">
            {entry.body}
          </p>
        </div>
      )}
    </div>
  );
};
