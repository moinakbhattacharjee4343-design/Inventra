import React from "react";
import { useLanguage } from "../lib/LanguageContext";

interface InventraLogoProps {
  compact?: boolean;
  showTagline?: boolean;
  surface?: "dark" | "auto" | "print";
  shimmerOnMount?: boolean;
}

export const InventraLogo: React.FC<InventraLogoProps> = ({
  compact = false,
  showTagline = false,
  surface = "auto",
  shimmerOnMount = true,
}) => {
  const { t } = useLanguage();
  const isDarkSurface = surface === "dark";
  const isPrintSurface = surface === "print";

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg mr-gold-foil shadow-sm ring-1 ring-[#F6E7B4]/60 ${
          shimmerOnMount && !isPrintSurface ? "mr-logo-shimmer" : ""
        }`}
        aria-hidden="true"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 16.5L9.5 10.5L13.5 13.5L19.5 6"
            stroke="#14112B"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19.5" cy="6" r="2.1" fill="#14112B" />
          <path
            d="M4.5 19.5H19.5"
            stroke="#14112B"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-display text-[18px] font-bold tracking-tight whitespace-nowrap ${
              isPrintSurface
                ? "text-[#14112B]"
                : isDarkSurface
                  ? "text-[#F3EFE6]"
                  : "text-[#14112B] dark:text-[#F3EFE6]"
            }`}
          >
            Inventra
          </span>
          {showTagline && (
            <span
              className={`mt-1 max-w-[172px] truncate text-[11px] font-medium ${
                isPrintSurface
                  ? "text-[#6B6785]"
                  : isDarkSurface
                    ? "text-[#A09CB5]"
                    : "text-[#6B6785] dark:text-[#A09CB5]"
              }`}
            >
              {t.brandTagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
