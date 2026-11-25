import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  FilterX,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { AnomalyAlert, AnomalyType, Product } from "../types/inventory";
import { NavTab } from "./DemoTourModal";
import { ProductAvatar } from "./ProductAvatar";
import { useLanguage } from "../lib/LanguageContext";

interface AlertsViewProps {
  alerts: AnomalyAlert[];
  products: Product[];
  onToggleDismiss: (alertId: string) => void;
  onToggleExcludeFromForecast: (productId: string, date: string) => void;
  onNavigate: (tab: NavTab, productId?: string) => void;
}

const TYPE_LABELS: Record<AnomalyType, string> = {
  sales_spike: "Sales Spike / Typo",
  sales_drop: "Zero-Sales Outage",
  negative_stock: "Negative Stock Ledger",
  shrinkage: "Unexplained Shrinkage",
  supplier_delay: "Supplier Delay Risk",
};

const PAGE_SIZE = 12;

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  products,
  onToggleDismiss,
  onToggleExcludeFromForecast,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState<"all" | AnomalyType>("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const productImageMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    for (const p of products) {
      map.set(p.id, p.imageUrl);
    }
    return map;
  }, [products]);

  const visibleAlerts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return alerts.filter((a) => {
      if (!showDismissed && a.dismissed) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (
        q &&
        !a.productName.toLowerCase().includes(q) &&
        !a.sku.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [alerts, showDismissed, typeFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, showDismissed, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(visibleAlerts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedAlerts = useMemo(
    () => visibleAlerts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [visibleAlerts, safePage]
  );

  const activeCount = alerts.filter((a) => !a.dismissed).length;
  const criticalCount = alerts.filter(
    (a) => !a.dismissed && a.severityLabel === "Critical"
  ).length;

  return (
    <div className="space-y-6">
      <div className="mr-card flex flex-col justify-between gap-4 rounded-xl p-6 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-display text-lg font-bold text-[#14112B] dark:text-[#F3EFE6]">
            {t.alerts.title}
          </h2>
          <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
            <span className="font-mono font-semibold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
              {activeCount} / {criticalCount}
            </span>{" "}
            · {t.alerts.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6785] dark:text-[#A09CB5]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.alerts.searchPlaceholder}
              aria-label={t.alerts.searchPlaceholder}
              className="min-h-[40px] w-48 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] pl-8 pr-3 text-xs text-[#14112B] placeholder:text-[#6B6785] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:placeholder:text-[#A09CB5] dark:focus:border-[#8B7CFF]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "all" | AnomalyType)}
            aria-label={t.alerts.allTypes}
            className="min-h-[40px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 text-xs font-medium text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
          >
            <option value="all">{t.alerts.allTypes}</option>
            <option value="negative_stock">Negative Stock Ledger</option>
            <option value="shrinkage">Unexplained Shrinkage</option>
            <option value="sales_spike">Sales Spike / Typo</option>
            <option value="sales_drop">Zero-Sales Outage</option>
            <option value="supplier_delay">Supplier Delay Risk</option>
          </select>

          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#6B6785] dark:text-[#A09CB5] whitespace-nowrap shrink-0">
            <input
              type="checkbox"
              checked={showDismissed}
              onChange={(e) => setShowDismissed(e.target.checked)}
              className="h-4 w-4 rounded accent-[#4B3FD6] dark:accent-[#8B7CFF]"
            />
            {t.alerts.showDismissed}
          </label>
        </div>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="mr-royal-aurora relative overflow-hidden rounded-xl p-12 text-center text-[#F3EFE6]">
          <div className="mr-hero-dots pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative z-10 mx-auto max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#22C08A]/45 bg-[#22C08A]/14 text-[#22C08A]">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-white">
              {t.alerts.allClearTitle}
            </p>
            <p className="mt-1.5 text-xs text-[#E4DFEC]">
              {t.alerts.allClearSub}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pagedAlerts.map((alert) => {
            const isCritical = alert.severityLabel === "Critical";
            const isHigh = alert.severityLabel === "High";
            const chipClasses = isCritical
              ? "border-[#E5484D]/45 bg-[#E5484D]/12 text-[#B8282D] dark:text-[#FF7A7E]"
              : isHigh
                ? "border-[#F5A524]/50 bg-[#F5A524]/14 text-[#14112B] dark:text-[#F5A524]"
                : "border-[#4C9AFF]/40 bg-[#4C9AFF]/12 text-[#1E62BD] dark:text-[#4C9AFF]";

            return (
              <article
                key={alert.id}
                className={`mr-card rounded-xl p-6 transition-opacity ${
                  alert.dismissed ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex items-start gap-4">
                    <ProductAvatar
                      src={productImageMap.get(alert.productId)}
                      name={alert.productName}
                      size="md"
                      className="mt-0.5 hidden sm:flex"
                    />

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${chipClasses}`}
                        >
                          {isCritical ? (
                            <XCircle className="h-3.5 w-3.5 shrink-0 text-[#E5484D]" aria-hidden="true" />
                          ) : isHigh ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#F5A524]" aria-hidden="true" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#4C9AFF]" aria-hidden="true" />
                          )}
                          <span>
                            {alert.severityLabel} · {alert.severityScore}/100
                          </span>
                        </span>
                        <span aria-hidden="true" className="text-[#ECE6D8] dark:text-[#2A2A44]">
                          ·
                        </span>
                        <span className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                          {TYPE_LABELS[alert.type]}
                        </span>
                        <span aria-hidden="true" className="text-[#ECE6D8] dark:text-[#2A2A44]">
                          ·
                        </span>
                        <span className="font-mono text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                          {alert.date} · {alert.sku}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                        {alert.productName} — {alert.title}
                      </h3>

                      <p className="text-xs leading-relaxed text-[#6B6785] dark:text-[#A09CB5]">
                        <strong className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                          {t.alerts.whyFlagged}{" "}
                        </strong>
                        {alert.whyFlagged}
                      </p>

                      <p className="text-xs leading-relaxed text-[#0F805A] dark:text-[#22C08A]">
                        <strong className="font-semibold">{t.alerts.nextStep} </strong>
                        {alert.suggestedAction}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate("forecasts", alert.productId)}
                      className="btn-lavish-secondary min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
                    >
                      {t.alerts.inspectForecast}
                    </button>

                    {(alert.type === "sales_spike" || alert.type === "sales_drop") && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleExcludeFromForecast(alert.productId, alert.date)
                        }
                        className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] transition-colors whitespace-nowrap ${
                          alert.excludedFromForecast
                            ? "border border-[#22C08A] bg-[#22C08A]/14 text-[#0F805A] dark:text-[#22C08A]"
                            : "border border-[#ECE6D8] bg-[#F4F0E6] text-[#4B3FD6] hover:border-[#4B3FD6] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#8B7CFF]"
                        }`}
                      >
                        <FilterX className="h-3.5 w-3.5" />
                        {alert.excludedFromForecast
                          ? t.alerts.excludedBtn
                          : t.alerts.excludeBtn}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleDismiss(alert.id)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#ECE6D8] px-3 py-1.5 text-xs font-medium text-[#6B6785] hover:bg-[#F4F0E6] hover:text-[#14112B] dark:border-[#2A2A44] dark:text-[#A09CB5] dark:hover:bg-[#1A1A2E] dark:hover:text-[#F3EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      {alert.dismissed ? t.alerts.restoreBtn : t.alerts.dismissBtn}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {totalPages > 1 && (
            <div className="mr-card flex items-center justify-between rounded-xl px-5 py-3 text-xs">
              <span className="text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                {t.scale.showingRange} {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(visibleAlerts.length, safePage * PAGE_SIZE)} /{" "}
                {visibleAlerts.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-lavish-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  {t.scale.prevPage}
                </button>
                <span className="font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                  {t.scale.pageOf} {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="btn-lavish-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium disabled:opacity-40"
                >
                  {t.scale.nextPage}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
