import React from "react";
import { AlertTriangle, ArchiveX, CheckCircle2, Clock, XCircle } from "lucide-react";
import { HealthReason, HealthStatus } from "../types/inventory";
import { useLanguage } from "../lib/LanguageContext";
import { getHealthText } from "../lib/i18n";

interface HealthBadgeProps {
  status: HealthStatus;
  reason: HealthReason;
}

/**
 * Midnight Royal Status Chip:
 * Always pairs an icon + text label (never color alone, never gold).
 * Uses 12-14% opacity background, full-color icon, and 1px semantic border.
 */
export const HealthBadge: React.FC<HealthBadgeProps> = ({ status, reason }) => {
  const { t } = useLanguage();
  const label = getHealthText(t, status, reason);

  if (status === "critical") {
    const Icon =
      reason === "expiry_risk" ? Clock : reason === "dead_stock" ? ArchiveX : XCircle;
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-[#E5484D]/55 bg-[#E5484D]/[0.13] px-2.5 py-0.5 text-[11px] font-semibold text-[#B4232C] dark:text-[#FF7D82] whitespace-nowrap"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#E5484D]" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  if (status === "warning") {
    const Icon =
      reason === "expiry_risk" ? Clock : reason === "dead_stock" ? ArchiveX : AlertTriangle;
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-[#F5A524]/60 bg-[#F5A524]/[0.14] px-2.5 py-0.5 text-[11px] font-semibold text-[#14112B] dark:text-[#F8C25C] whitespace-nowrap"
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#D9820B] dark:text-[#F5A524]" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[#22C08A]/55 bg-[#22C08A]/[0.13] px-2.5 py-0.5 text-[11px] font-semibold text-[#0E7A55] dark:text-[#4AE0AB] whitespace-nowrap"
    >
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#22C08A]" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
