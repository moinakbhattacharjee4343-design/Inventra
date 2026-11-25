import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  Moon,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sun,
  Truck,
  Upload,
} from "lucide-react";
import {
  ALL_DEPARTMENTS,
  CsvValidationReport,
  Product,
} from "../types/inventory";
import {
  CSV_TEMPLATE_CONTENT,
  downloadTextFile,
  parseAndValidateCsv,
} from "../lib/csvUtils";
import { getDepartmentColor } from "../lib/themeTokens";
import { ProductAvatar } from "./ProductAvatar";
import { useLanguage } from "../lib/LanguageContext";

interface DataViewProps {
  products: Product[];
  isDemoData: boolean;
  onLoadDemoData: () => void;
  onImportProducts: (products: Product[]) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  reduceEffects?: boolean;
  onToggleReduceEffects?: () => void;
}

const LEDGER_PAGE_SIZE = 15;

export const DataView: React.FC<DataViewProps> = ({
  products,
  isDemoData,
  onLoadDemoData,
  onImportProducts,
  onUpdateStock,
  darkMode = true,
  onToggleDarkMode,
  reduceEffects = false,
  onToggleReduceEffects,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationReport, setValidationReport] = useState<CsvValidationReport | null>(
    null
  );

  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerDept, setLedgerDept] = useState("All");
  const [ledgerPage, setLedgerPage] = useState(1);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationReport(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMsg("Please upload a .csv file. Download the template below if needed.");
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseAndValidateCsv(text, file.name);
      onImportProducts(parsed.products);
      setValidationReport(parsed.report);
      setSuccessMsg(
        `Loaded ${parsed.report.productsCount} products (${parsed.report.acceptedRows} valid rows) from ${file.name}.`
      );
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not parse the uploaded CSV file."
      );
    }
  };

  const filteredLedger = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (ledgerDept !== "All" && p.category !== ledgerDept) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.sku.toLowerCase().includes(q) &&
        !p.supplier.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [products, ledgerSearch, ledgerDept]);

  useEffect(() => {
    setLedgerPage(1);
  }, [ledgerSearch, ledgerDept]);

  const totalPages = Math.max(1, Math.ceil(filteredLedger.length / LEDGER_PAGE_SIZE));
  const safePage = Math.min(ledgerPage, totalPages);
  const pagedLedger = useMemo(
    () =>
      filteredLedger.slice(
        (safePage - 1) * LEDGER_PAGE_SIZE,
        safePage * LEDGER_PAGE_SIZE
      ),
    [filteredLedger, safePage]
  );

  const supplierReliability = useMemo(() => {
    const map = new Map<
      string,
      { supplier: string; skuCount: number; avgLead: number; lateRisk: boolean }
    >();
    for (const p of products) {
      const curr = map.get(p.supplier) ?? {
        supplier: p.supplier,
        skuCount: 0,
        avgLead: 0,
        lateRisk: false,
      };
      curr.avgLead =
        (curr.avgLead * curr.skuCount + p.leadTimeDays) / (curr.skuCount + 1);
      curr.skuCount += 1;
      if (p.supplierLateRisk) curr.lateRisk = true;
      map.set(p.supplier, curr);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.lateRisk === b.lateRisk ? b.skuCount - a.skuCount : a.lateRisk ? -1 : 1
    );
  }, [products]);

  const totalRows = useMemo(
    () => products.reduce((s, p) => s + p.dailySales.length, 0),
    [products]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label={t.data.uploadTitle}
          className="mr-card rounded-xl p-6 lg:col-span-7"
        >
          <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
            {t.data.uploadTitle}
          </h2>
          <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
            {t.data.requiredCols}{" "}
            <code className="font-mono text-[#4B3FD6] dark:text-[#E3C16F]">
              date, product, units_sold, price, stock_on_hand
            </code>{" "}
            (up to 100 products)
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragOver
                ? "border-[#4B3FD6] bg-[#4B3FD6]/5 dark:border-[#8B7CFF] dark:bg-[#8B7CFF]/10"
                : "border-[#ECE6D8] bg-[#F4F0E6]/60 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/45"
            }`}
          >
            <Upload className="h-8 w-8 text-[#4B3FD6] dark:text-[#8B7CFF]" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-[#14112B] dark:text-[#F3EFE6]">
              {t.data.dragDrop}
            </p>
            <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.data.optionalCols}, moq
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-lavish-primary inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {t.data.chooseCsv}
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile("inventra-sales-template.csv", CSV_TEMPLATE_CONTENT)
                }
                className="btn-lavish-secondary inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                {t.data.downloadTemplate}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-[#E5484D]/40 bg-[#E5484D]/12 p-3 text-xs text-[#B8282D] dark:text-[#FF7A7E]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#22C08A]/40 bg-[#22C08A]/12 p-3 text-xs text-[#0F805A] dark:text-[#22C08A]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* CSV Validation Report Card */}
          {validationReport && (
            <div className="mt-4 rounded-xl border border-[#ECE6D8] bg-[#F4F0E6]/70 p-4 text-xs dark:border-[#2A2A44] dark:bg-[#1A1A2E]/70">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE6D8] pb-2.5 dark:border-[#2A2A44]">
                <span className="font-display font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  {t.scale.validationTitle}: {validationReport.fileName}
                </span>
                <span className="font-mono text-[11px] text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                  {validationReport.productsCount} SKUs · {validationReport.totalRows} total rows
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                    {t.scale.acceptedRows}
                  </p>
                  <p className="font-mono text-base font-bold text-[#0F805A] dark:text-[#22C08A] tabular-nums">
                    {validationReport.acceptedRows}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                    {t.scale.rejectedRows}
                  </p>
                  <p
                    className={`font-mono text-base font-bold tabular-nums ${
                      validationReport.rejectedRows > 0
                        ? "text-[#B8282D] dark:text-[#FF7A7E]"
                        : "text-[#14112B] dark:text-[#F3EFE6]"
                    }`}
                  >
                    {validationReport.rejectedRows}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                    Products Imported
                  </p>
                  <p className="font-mono text-base font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                    {validationReport.productsCount} / 100
                  </p>
                </div>
              </div>

              {validationReport.warnings.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-[#ECE6D8] pt-2.5 text-[11px] text-[#14112B] dark:border-[#2A2A44] dark:text-[#F5A524]">
                  {validationReport.warnings.map((w, i) => (
                    <p key={i}>• {w}</p>
                  ))}
                </div>
              )}

              {validationReport.rejectionReasons.length > 0 && (
                <div className="mt-3 border-t border-[#ECE6D8] pt-2.5 dark:border-[#2A2A44]">
                  <p className="font-semibold text-[#B8282D] dark:text-[#FF7A7E]">
                    {t.scale.rejectionReasons} ({validationReport.rejectionReasons.length})
                  </p>
                  <ul className="mt-1.5 max-h-32 space-y-1 overflow-y-auto font-mono text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                    {validationReport.rejectionReasons.slice(0, 20).map((r, i) => (
                      <li key={i}>
                        Row {r.rowNumber}: {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section
          aria-label={t.data.datasetStatus}
          className="mr-card flex flex-col justify-between rounded-xl p-6 lg:col-span-5"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4B3FD6] dark:text-[#E3C16F]">
              <Database className="h-4 w-4" />
              <span>{t.data.datasetStatus}</span>
            </div>
            <h2 className="mt-2 font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {isDemoData ? t.data.demoActive : t.data.customActive}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#6B6785] dark:text-[#A09CB5]">
              {t.data.demoDescription}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] p-3 text-xs dark:border-[#2A2A44] dark:bg-[#1A1A2E]/70">
              <div>
                <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">SKUs</p>
                <p className="font-mono font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                  {products.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">Daily Rows</p>
                <p className="font-mono font-bold text-[#4B3FD6] dark:text-[#E3C16F] tabular-nums">
                  {totalRows.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">Suppliers</p>
                <p className="font-mono font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                  {supplierReliability.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[#ECE6D8] pt-4 dark:border-[#2A2A44]">
            <button
              type="button"
              onClick={() => {
                onLoadDemoData();
                setErrorMsg(null);
                setValidationReport(null);
                setSuccessMsg("Restored 100-SKU mall retail synthetic dataset.");
              }}
              className="btn-lavish-secondary inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.data.loadDemoBtn}
            </button>
          </div>
        </section>
      </div>

      {/* Settings & Visual Preferences */}
      <section
        aria-label={t.data.prefsTitle}
        className="mr-card rounded-xl p-6"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              <SlidersHorizontal className="h-4 w-4 text-[#4B3FD6] dark:text-[#E3C16F]" aria-hidden="true" />
              {t.data.prefsTitle}
            </h2>
            <p className="mt-0.5 text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.data.prefsSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-pressed={darkMode}
                className="btn-lavish-secondary inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
              >
                {darkMode ? (
                  <Moon className="h-3.5 w-3.5 text-[#E3C16F]" aria-hidden="true" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-[#B8912B]" aria-hidden="true" />
                )}
                <span>{t.data.themeModeLabel}:</span>
                <span className="font-mono text-[#4B3FD6] dark:text-[#E3C16F]">
                  {darkMode ? "Dark" : "Light"}
                </span>
              </button>
            )}

            {onToggleReduceEffects && (
              <button
                type="button"
                role="switch"
                aria-checked={reduceEffects}
                onClick={onToggleReduceEffects}
                className={`inline-flex min-h-[40px] items-center gap-3 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  reduceEffects
                    ? "border-[#4B3FD6] bg-[#4B3FD6]/10 text-[#4B3FD6] dark:border-[#8B7CFF] dark:bg-[#8B7CFF]/15 dark:text-[#A99DFF]"
                    : "border-[#ECE6D8] bg-[#F4F0E6] text-[#14112B] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
                }`}
              >
                <span className="text-left">
                  <span className="block leading-tight">{t.data.reduceEffectsLabel}</span>
                  <span className="block text-[10px] font-normal text-[#6B6785] dark:text-[#A09CB5]">
                    {t.data.reduceEffectsSub}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    reduceEffects ? "bg-[#4B3FD6] dark:bg-[#8B7CFF]" : "bg-[#CBD5E1] dark:bg-[#334155]"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      reduceEffects ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Supplier Network Reliability Matrix */}
      <section
        aria-label="Supplier network lead time and delivery reliability"
        className="mr-card rounded-xl p-6"
      >
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#4B3FD6] dark:text-[#8B7CFF]" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
            Supplier Network ({supplierReliability.length} Suppliers)
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {supplierReliability.map((sup) => (
            <div
              key={sup.supplier}
              className={`rounded-lg border p-3 text-xs ${
                sup.lateRisk
                  ? "border-[#E5484D]/40 bg-[#E5484D]/10 dark:border-[#E5484D]/45 dark:bg-[#E5484D]/12"
                  : "border-[#ECE6D8] bg-[#F4F0E6]/65 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/60"
              }`}
            >
              <p className="truncate font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                {sup.supplier}
              </p>
              <p className="mt-1 font-mono text-[11px] text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                {sup.skuCount} SKUs · {sup.avgLead.toFixed(1)}d avg lead
              </p>
              {sup.lateRisk && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#E5484D]/40 bg-[#E5484D]/12 px-2 py-0.5 text-[10px] font-semibold text-[#B8282D] dark:text-[#FF7A7E]">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-[#E5484D]" aria-hidden="true" />
                  <span>Late-delivery risk (+3d)</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Live Inventory Ledger (Searchable & Paginated) */}
      <section
        aria-label={t.data.ledgerTitle}
        className="mr-card rounded-xl"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-[#ECE6D8] p-6 sm:flex-row sm:items-center dark:border-[#2A2A44]">
          <div>
            <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.data.ledgerTitle} ({filteredLedger.length})
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.data.ledgerSub}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6785] dark:text-[#A09CB5]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                placeholder={t.dashboard.searchPlaceholder}
                aria-label={t.dashboard.searchPlaceholder}
                className="min-h-[38px] w-48 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] pl-8 pr-3 text-xs text-[#14112B] placeholder:text-[#6B6785] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
              />
            </div>

            <select
              value={ledgerDept}
              onChange={(e) => setLedgerDept(e.target.value)}
              aria-label={t.dashboard.allCategories}
              className="min-h-[38px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 text-xs font-medium text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
            >
              <option value="All">{t.dashboard.allCategories}</option>
              {ALL_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="mr-table-head sticky top-0 z-10">
              <tr className="border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                <th className="px-5 py-3 font-semibold">{t.data.colSku}</th>
                <th className="px-4 py-3 font-semibold">{t.data.colProduct}</th>
                <th className="px-4 py-3 font-semibold">{t.data.colCategory}</th>
                <th className="px-4 py-3 font-semibold">{t.data.colSupplier}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.scale.moqLabel}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.data.colHistoryDays}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.data.colCostPrice}</th>
                <th className="px-5 py-3 text-right font-semibold">{t.data.colStockOnHand}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
              {pagedLedger.map((p) => {
                const deptDot = getDepartmentColor(p.category);
                return (
                  <tr
                    key={p.id}
                    className="mr-zebra-row transition-colors hover:bg-[#F4F0E6]/65 dark:hover:bg-[#1A1A2E]/60"
                  >
                    <td className="px-5 py-3 font-mono text-[#6B6785] dark:text-[#A09CB5]">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                      <div className="flex items-center gap-3">
                        <ProductAvatar src={p.imageUrl} name={p.name} size="sm" />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6B6785] dark:text-[#A09CB5]">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: deptDot }}
                          aria-hidden="true"
                        />
                        <span>{p.category}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6785] dark:text-[#A09CB5]">
                      {p.supplier} ({p.leadTimeDays}d{p.supplierLateRisk ? " · Late Risk" : ""})
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                      {p.moq}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                      {p.dailySales.length}d
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                      ₹{p.unitCost} / ₹{p.sellingPrice}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={p.currentStock}
                        aria-label={`Current stock for ${p.name}`}
                        onChange={(e) => {
                          const val = Math.max(0, Math.round(Number(e.target.value) || 0));
                          onUpdateStock(p.id, val);
                        }}
                        className="w-24 rounded-md border border-[#ECE6D8] bg-[#F4F0E6] px-2.5 py-1.5 text-right font-mono text-xs font-semibold text-[#14112B] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF] tabular-nums"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#ECE6D8] px-5 py-3 text-xs dark:border-[#2A2A44]">
            <span className="text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
              {t.scale.showingRange} {(safePage - 1) * LEDGER_PAGE_SIZE + 1}–
              {Math.min(filteredLedger.length, safePage * LEDGER_PAGE_SIZE)} /{" "}
              {filteredLedger.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setLedgerPage((p) => Math.min(totalPages, p + 1))}
                className="btn-lavish-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium disabled:opacity-40"
              >
                {t.scale.nextPage}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
