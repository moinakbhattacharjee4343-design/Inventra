import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Printer,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AiExplanationResponse,
  ALL_DEPARTMENTS,
  ForecastResult,
  HealthStatus,
  LanguageCode,
  OptimizationResult,
  Product,
  ProductSummary,
  SupplierPurchaseOrder,
} from "../types/inventory";
import { buildSupplierPurchaseOrders } from "../lib/inventoryMath";
import { exportPurchaseOrdersCsv } from "../lib/csvUtils";
import { requestProductExplanation } from "../lib/aiClient";
import { HealthBadge } from "./HealthBadge";
import { HelpTip } from "./HelpTip";
import { PurchaseOrderPrintModal } from "./PurchaseOrderPrintModal";
import { ProductAvatar } from "./ProductAvatar";
import { useLanguage } from "../lib/LanguageContext";
import { getChartTokens, getDepartmentColor } from "../lib/themeTokens";

interface InventoryViewProps {
  products: Product[];
  summaries: Map<string, ProductSummary>;
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
  forecast: ForecastResult;
  optimization: OptimizationResult;
  customPoQuantities: Map<string, number>;
  onUpdatePoQuantity: (productId: string, qty: number) => void;
  bulkPoSelectedIds: Set<string>;
  onChangeBulkPoSelectedIds: (next: Set<string>) => void;
  darkMode: boolean;
}

const QUEUE_PAGE_SIZE = 10;

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  summaries,
  selectedProductId,
  onSelectProduct,
  forecast,
  optimization: opt,
  customPoQuantities,
  onUpdatePoQuantity,
  bulkPoSelectedIds,
  onChangeBulkPoSelectedIds,
  darkMode,
}) => {
  const { language: globalLang, t } = useLanguage();
  const [language, setLanguage] = useState<LanguageCode>(globalLang);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplain, setAiExplain] = useState<AiExplanationResponse | null>(null);
  const [explainedKey, setExplainedKey] = useState<string>("");
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [queueSearch, setQueueSearch] = useState("");
  const [queueDept, setQueueDept] = useState("All");
  const [queueStatus, setQueueStatus] = useState<"all" | HealthStatus>("all");
  const [queueSupplier, setQueueSupplier] = useState("All");
  const [queuePage, setQueuePage] = useState(1);
  const [poScope, setPoScope] = useState<"all" | "selected">("all");

  const chartTokens = useMemo(() => getChartTokens(darkMode), [darkMode]);

  useEffect(() => {
    setLanguage(globalLang);
  }, [globalLang]);

  const product = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? products[0],
    [products, selectedProductId]
  );
  const productSummary = summaries.get(product.id);

  const suppliers = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.supplier))).sort()],
    [products]
  );

  const filteredQueue = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    return products
      .filter((p) => {
        const sum = summaries.get(p.id);
        if (queueDept !== "All" && p.category !== queueDept) return false;
        if (queueSupplier !== "All" && p.supplier !== queueSupplier) return false;
        if (queueStatus !== "all" && sum?.healthStatus !== queueStatus) return false;
        if (
          q &&
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q) &&
          !p.supplier.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const sA = summaries.get(a.id)?.financialImpact ?? 0;
        const sB = summaries.get(b.id)?.financialImpact ?? 0;
        return sB - sA;
      });
  }, [products, summaries, queueSearch, queueDept, queueSupplier, queueStatus]);

  useEffect(() => {
    setQueuePage(1);
  }, [queueSearch, queueDept, queueSupplier, queueStatus]);

  const totalQueuePages = Math.max(
    1,
    Math.ceil(filteredQueue.length / QUEUE_PAGE_SIZE)
  );
  const safeQueuePage = Math.min(queuePage, totalQueuePages);
  const pagedQueue = useMemo(
    () =>
      filteredQueue.slice(
        (safeQueuePage - 1) * QUEUE_PAGE_SIZE,
        safeQueuePage * QUEUE_PAGE_SIZE
      ),
    [filteredQueue, safeQueuePage]
  );

  const currentPoQty = customPoQuantities.has(product.id)
    ? customPoQuantities.get(product.id)!
    : opt.recommendedOrderQty;

  const purchaseOrders: SupplierPurchaseOrder[] = useMemo(() => {
    const scopeIds =
      poScope === "selected" && bulkPoSelectedIds.size > 0
        ? bulkPoSelectedIds
        : undefined;
    return buildSupplierPurchaseOrders(
      products,
      summaries,
      customPoQuantities,
      scopeIds
    );
  }, [products, summaries, customPoQuantities, poScope, bulkPoSelectedIds]);

  const totalPoSpend = useMemo(
    () => purchaseOrders.reduce((s, po) => s + po.subtotal, 0),
    [purchaseOrders]
  );

  const handleExplain = async (targetLang: LanguageCode = language) => {
    setAiLoading(true);
    const result = await requestProductExplanation(product, forecast, opt, targetLang);
    setAiExplain(result);
    setExplainedKey(`${product.id}::${targetLang}`);
    setAiLoading(false);
  };

  const handleLanguageSwitch = (lang: LanguageCode) => {
    setLanguage(lang);
    if (aiExplain && explainedKey.startsWith(`${product.id}::`)) {
      void handleExplain(lang);
    }
  };

  const toggleSelectSku = (id: string) => {
    const next = new Set(bulkPoSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChangeBulkPoSelectedIds(next);
  };

  const handleSelectCritical = () => {
    const next = new Set<string>();
    for (const p of products) {
      const sum = summaries.get(p.id);
      if (sum && (sum.healthStatus === "critical" || sum.recommendedOrderQty > 0)) {
        if (sum.healthReason === "stockout_risk" || sum.healthReason === "approaching_rop") {
          next.add(p.id);
        }
      }
    }
    onChangeBulkPoSelectedIds(next);
  };

  const handleGenerateBulkPo = () => {
    if (bulkPoSelectedIds.size === 0) return;
    setPoScope("selected");
    const el = document.getElementById("po-plan-section");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const tradeOffMax = Math.max(1, opt.costOfStockout30d, opt.costOfHolding30d);
  const stockoutBarPct = Math.round((opt.costOfStockout30d / tradeOffMax) * 100);
  const holdingBarPct = Math.round((opt.costOfHolding30d / tradeOffMax) * 100);

  const gaugeMax = Math.max(
    product.currentStock,
    opt.reorderPoint + opt.eoq,
    10
  );
  const currentPct = Math.min(100, Math.round((product.currentStock / gaugeMax) * 100));
  const safetyPct = Math.min(100, Math.round((opt.safetyStock / gaugeMax) * 100));
  const ropPct = Math.min(100, Math.round((opt.reorderPoint / gaugeMax) * 100));

  const tierChartData = opt.reasoning.options.map((tierOpt) => ({
    tier: tierOpt.tier,
    quantity: tierOpt.quantity,
    cost: tierOpt.estimatedCost,
    service: tierOpt.targetServiceLevel,
  }));

  return (
    <div className="space-y-6">
      {/* Product Optimization Header with Photo & Stock Gauge */}
      <section className="mr-card rounded-xl p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ECE6D8] pb-5 md:flex-row md:items-center dark:border-[#2A2A44]">
          <div className="flex flex-wrap items-center gap-4">
            <ProductAvatar src={product.imageUrl} name={product.name} size="lg" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  id="inv-product-select"
                  aria-label="Inspect product SKU"
                  value={product.id}
                  onChange={(e) => {
                    onSelectProduct(e.target.value);
                    setAiExplain(null);
                  }}
                  className="min-h-[38px] max-w-xs rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-sm font-semibold text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <HealthBadge status={opt.healthStatus} reason={opt.healthReason} />
                {productSummary && (
                  <span className="font-mono text-xs font-bold text-[#4B3FD6] dark:text-[#8B7CFF]">
                    {productSummary.abcXyz}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {t.inventory.supplier}:{" "}
                <span className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                  {product.supplier}
                </span>{" "}
                · {t.inventory.leadTime}:{" "}
                <span className="font-mono font-medium tabular-nums">
                  {product.leadTimeDays}d
                </span>{" "}
                · {t.scale.moqLabel}:{" "}
                <span className="font-mono font-medium tabular-nums">
                  {product.moq} u
                </span>{" "}
                · {t.inventory.unitMargin}:{" "}
                <span className="font-mono font-medium text-[#0E7A55] dark:text-[#22C08A] tabular-nums">
                  ₹{product.sellingPrice - product.unitCost} (
                  {Math.round(
                    ((product.sellingPrice - product.unitCost) /
                      Math.max(1, product.sellingPrice)) *
                      100
                  )}
                  %)
                </span>
                {product.shelfLifeDays && (
                  <>
                    {" "}
                    · {t.inventory.shelfLife}:{" "}
                    <span className="font-mono font-medium tabular-nums">
                      {product.shelfLifeDays}d
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-1 rounded-lg bg-[#F4F0E6] p-1 dark:bg-[#1A1A2E]"
              role="group"
              aria-label="Explanation language"
            >
              {(
                [
                  { code: "en", label: "English" },
                  { code: "hi", label: "हिन्दी" },
                  { code: "bn", label: "বাংলা" },
                ] as const
              ).map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleLanguageSwitch(l.code)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap ${
                    language === l.code
                      ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                      : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void handleExplain(language)}
              disabled={aiLoading}
              className="btn-lavish-primary inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t.inventory.thinking}
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#E3C16F]" />
                  {t.inventory.explainBtn}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Plain-language Action Headline */}
        <div className="mt-5">
          <h2 className="font-display text-2xl font-bold text-[#14112B] dark:text-[#F3EFE6]">
            {opt.actionSummary}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#6B6785] dark:text-[#A09CB5]">
            {opt.actionReason}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {opt.shelfLifeCapped && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A5B00] dark:text-[#F5A524]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {t.inventory.shelfLifeWarning} ({product.shelfLifeDays}d)
              </p>
            )}
            {product.supplierLateRisk && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B4232C] dark:text-[#FF7D82]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {t.scale.lateSupplierWarn}
              </p>
            )}
          </div>
        </div>

        {/* Visual Stock Position Gauge */}
        <div className="mt-6 border-t border-[#ECE6D8] pt-5 dark:border-[#2A2A44]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
              {t.inventory.visualGaugeTitle}
            </span>
            <span className="font-mono text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
              {t.inventory.onHand}: {product.currentStock} · {t.inventory.safetyStock}:{" "}
              {opt.safetyStock} · ROP: {opt.reorderPoint} · {t.inventory.targetMax}:{" "}
              {gaugeMax}
            </span>
          </div>
          <div className="relative mt-3 h-4 w-full overflow-hidden rounded-full bg-[#F4F0E6] dark:bg-[#1A1A2E]">
            <div
              className="absolute inset-y-0 left-0 bg-[#E5484D]/20"
              style={{ width: `${safetyPct}%` }}
            />
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                product.currentStock <= opt.reorderPoint
                  ? "bg-[#E5484D]"
                  : opt.healthReason === "overstock_risk"
                    ? "bg-[#F5A524]"
                    : "bg-[#22C08A]"
              }`}
              style={{ width: `${currentPct}%` }}
            />
            <div
              title={`${t.inventory.safetyStock}: ${opt.safetyStock}`}
              className="absolute inset-y-0 w-0.5 bg-[#E5484D]"
              style={{ left: `${safetyPct}%` }}
            />
            <div
              title={`${t.inventory.reorderPoint}: ${opt.reorderPoint}`}
              className="absolute inset-y-0 w-0.5 bg-[#4B3FD6] dark:bg-[#8B7CFF]"
              style={{ left: `${ropPct}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
            <span>{t.inventory.zeroStockout}</span>
            <span className="inline-flex items-center gap-3">
              <span>
                {t.inventory.redSafetyLine} ({opt.safetyStock})
              </span>
              <span>·</span>
              <span>
                {t.inventory.blueRopLine} ({opt.reorderPoint})
              </span>
            </span>
            <span>
              {gaugeMax} ({t.inventory.targetMax})
            </span>
          </div>
        </div>

        {/* AI Explanation Drawer */}
        {aiExplain && (
          <div className="mt-5 rounded-xl border border-[#4B3FD6]/30 border-l-2 border-l-[#B8912B] bg-[#4B3FD6]/[0.06] p-4 dark:border-[#8B7CFF]/30 dark:border-l-[#E3C16F] dark:bg-[#8B7CFF]/[0.08]">
            {aiExplain.errorNotice && (
              <p className="mb-2 text-[11px] font-medium text-[#9A5B00] dark:text-[#F5A524]">
                Live notice: {aiExplain.errorNotice} (Displaying rule-based fallback summary.)
              </p>
            )}
            <p className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {aiExplain.headline}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#14112B] dark:text-[#F3EFE6]">
              {aiExplain.explanation}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {aiExplain.citedFigures.map((fig) => (
                <span key={fig.label} className="font-mono tabular-nums">
                  <span className="font-sans text-[#6B6785] dark:text-[#A09CB5]">
                    {fig.label}:{" "}
                  </span>
                  <strong className="text-[#4B3FD6] dark:text-[#E3C16F]">
                    {fig.value}
                  </strong>
                </span>
              ))}
            </div>
            <p className="mt-2.5 border-t border-[#4B3FD6]/20 pt-2 text-xs text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
              {aiExplain.uncertaintyNote}
            </p>
          </div>
        )}

        {/* Optimization Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#ECE6D8] pt-5 sm:grid-cols-5 dark:border-[#2A2A44]">
          <div>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.inventory.currentStock}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
              {product.currentStock} u
            </p>
          </div>
          <div>
            <p className="flex items-center text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.inventory.safetyStock} <HelpTip term="safetyStock" />
            </p>
            <p className="mt-1 font-display text-xl font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
              {opt.safetyStock} u
            </p>
          </div>
          <div>
            <p className="flex items-center text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.inventory.reorderPoint} <HelpTip term="rop" />
            </p>
            <p className="mt-1 font-display text-xl font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
              {opt.reorderPoint} u
            </p>
          </div>
          <div>
            <p className="flex items-center text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.inventory.eoqBatch} <HelpTip term="eoq" />
            </p>
            <p className="mt-1 font-display text-xl font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
              {opt.eoq} u
            </p>
          </div>
          <div>
            <p className="flex items-center text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.inventory.daysOfCover} <HelpTip term="daysOfCover" />
            </p>
            <p className="mt-1 font-display text-xl font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
              {opt.daysOfCover} d
            </p>
          </div>
        </div>
      </section>

      {/* Reasoning Under Uncertainty + Cost Trade-Off */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label="Reasoning under uncertainty"
          className="mr-card rounded-xl p-6 lg:col-span-8"
        >
          <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
            {t.inventory.reasoningTitle}
          </h2>
          <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
            {t.inventory.reasoningSub}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-[#6B6785] dark:text-[#A09CB5]">
                {t.inventory.bestEstimate}
              </p>
              <p className="mt-1 font-mono text-base font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                {opt.reasoning.bestEstimateUnits} u · ₹
                {(opt.reasoning.bestEstimateUnits * product.unitCost).toLocaleString(
                  "en-IN"
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B6785] dark:text-[#A09CB5]">
                {t.inventory.demandRange}
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                80%: {opt.reasoning.demandRange80[0]}–{opt.reasoning.demandRange80[1]} · 95%:{" "}
                {opt.reasoning.demandRange95[0]}–{opt.reasoning.demandRange95[1]}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[#ECE6D8] pt-4 sm:grid-cols-2 dark:border-[#2A2A44]">
            <div>
              <p className="text-xs font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                {t.inventory.keyAssumptions}
              </p>
              <ul className="mt-1.5 space-y-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {opt.reasoning.keyAssumptions.map((a, idx) => (
                  <li key={idx}>• {a}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                {t.inventory.whatWouldChange}
              </p>
              <ul className="mt-1.5 space-y-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {opt.reasoning.whatWouldChange.map((w, idx) => (
                  <li key={idx}>• {w}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5 border-t border-[#ECE6D8] pt-4 dark:border-[#2A2A44]">
            <p className="text-xs font-semibold text-[#14112B] dark:text-[#F3EFE6]">
              {t.inventory.chooseRiskPosture}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {opt.reasoning.options.map((tier) => {
                const isSelected = currentPoQty === tier.quantity;
                return (
                  <button
                    key={tier.tier}
                    type="button"
                    onClick={() => onUpdatePoQuantity(product.id, tier.quantity)}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] ${
                      isSelected
                        ? "border-[#4B3FD6] bg-[#4B3FD6]/[0.08] ring-1 ring-[#4B3FD6]/30 dark:border-[#8B7CFF] dark:bg-[#8B7CFF]/12 dark:ring-[#8B7CFF]/30"
                        : "border-[#ECE6D8] bg-[#F4F0E6]/45 hover:border-[#B8912B]/55 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/45 dark:hover:border-[#E3C16F]/45"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                          {tier.tier}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-[#0E7A55] dark:text-[#22C08A] tabular-nums">
                          {tier.targetServiceLevel}% {t.inventory.service}
                        </span>
                      </div>
                      <p className="mt-2 font-mono text-lg font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                        {tier.quantity} u
                      </p>
                      <p className="font-mono text-xs text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                        ₹{tier.estimatedCost.toLocaleString("en-IN")}{" "}
                        {t.inventory.costLabel}
                      </p>
                    </div>
                    <p className="mt-2.5 text-[11px] leading-snug text-[#6B6785] dark:text-[#A09CB5]">
                      {tier.stockoutRiskNote}. {tier.overstockRiskNote}.
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Cost Trade-Off + Tier Visual Bar Chart */}
        <section
          aria-label="Stockout vs holding cost trade-off"
          className="mr-card flex flex-col justify-between gap-6 rounded-xl p-6 lg:col-span-4"
        >
          <div>
            <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.inventory.tradeOffTitle}
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.inventory.tradeOffSub}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-[#B4232C] dark:text-[#FF7D82]">
                    {t.inventory.costOfStockout}
                  </span>
                  <span className="font-mono font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                    ₹{opt.costOfStockout30d.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#F4F0E6] dark:bg-[#1A1A2E]">
                  <div
                    className="h-full rounded-full bg-[#E5484D]"
                    style={{ width: `${stockoutBarPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-[#0E7A55] dark:text-[#22C08A]">
                    {t.inventory.costOfHolding}
                  </span>
                  <span className="font-mono font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                    ₹{opt.costOfHolding30d.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-[#F4F0E6] dark:bg-[#1A1A2E]">
                  <div
                    className="h-full rounded-full bg-[#22C08A]"
                    style={{ width: `${holdingBarPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#ECE6D8] pt-4 dark:border-[#2A2A44]">
            <p className="text-xs font-semibold text-[#14112B] dark:text-[#F3EFE6]">
              {t.inventory.orderSpendChart}
            </p>
            <div className="mt-2 h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tierChartData}
                  margin={{ top: 6, right: 6, left: -12, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke={chartTokens.gridStroke}
                  />
                  <XAxis
                    dataKey="tier"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: chartTokens.axisTick }}
                    tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip
                    cursor={{
                      fill: darkMode ? "rgba(255,255,255,0.03)" : "rgba(20,17,43,0.03)",
                    }}
                    formatter={(val) => [
                      `₹${Number(val).toLocaleString("en-IN")}`,
                      t.inventory.costLabel,
                    ]}
                    contentStyle={chartTokens.tooltipStyle}
                  />
                  <Bar
                    dataKey="cost"
                    fill={chartTokens.historical}
                    radius={[5, 5, 0, 0]}
                    barSize={34}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Multi-Select 100-SKU Replenishment Queue */}
      <section aria-label="Catalog replenishment selection queue" className="mr-card rounded-xl">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ECE6D8] p-5 dark:border-[#2A2A44]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                <CheckSquare className="h-4 w-4 text-[#4B3FD6] dark:text-[#8B7CFF]" />
                Catalog Replenishment Queue ({filteredQueue.length})
              </h2>
              <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                Click any product to inspect or check multiple SKUs to build a combined multi-supplier PO.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectCritical}
                className="btn-lavish-secondary min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
              >
                {t.scale.selectCritical}
              </button>
              {bulkPoSelectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeBulkPoSelectedIds(new Set());
                      setPoScope("all");
                    }}
                    className="min-h-[36px] rounded-lg border border-[#ECE6D8] px-3 py-1.5 text-xs font-medium text-[#6B6785] hover:text-[#14112B] dark:border-[#2A2A44] dark:text-[#A09CB5]"
                  >
                    {t.scale.clearSelection} ({bulkPoSelectedIds.size})
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateBulkPo}
                    className="btn-lavish-primary min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap"
                  >
                    {t.scale.generateCombinedPo} ({bulkPoSelectedIds.size})
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6785] dark:text-[#A09CB5]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                placeholder={t.dashboard.searchPlaceholder}
                aria-label={t.dashboard.searchPlaceholder}
                className="min-h-[36px] w-48 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 pl-8 pr-3 text-xs text-[#14112B] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
              />
            </div>

            <select
              value={queueDept}
              onChange={(e) => setQueueDept(e.target.value)}
              aria-label={t.dashboard.allCategories}
              className="min-h-[36px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
            >
              <option value="All">{t.dashboard.allCategories}</option>
              {ALL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={queueSupplier}
              onChange={(e) => setQueueSupplier(e.target.value)}
              aria-label={t.scale.allSuppliers}
              className="min-h-[36px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
            >
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? t.scale.allSuppliers : s}
                </option>
              ))}
            </select>

            <select
              value={queueStatus}
              onChange={(e) => setQueueStatus(e.target.value as "all" | HealthStatus)}
              aria-label={t.dashboard.colHealth}
              className="min-h-[36px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
            >
              <option value="all">{t.dashboard.filterAll}</option>
              <option value="critical">{t.dashboard.filterCritical}</option>
              <option value="warning">{t.dashboard.filterWarning}</option>
              <option value="healthy">{t.dashboard.filterHealthy}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="mr-table-head sticky top-0 border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all on current page"
                    checked={
                      pagedQueue.length > 0 &&
                      pagedQueue.every((p) => bulkPoSelectedIds.has(p.id))
                    }
                    onChange={(e) => {
                      const next = new Set(bulkPoSelectedIds);
                      for (const p of pagedQueue) {
                        if (e.target.checked) next.add(p.id);
                        else next.delete(p.id);
                      }
                      onChangeBulkPoSelectedIds(next);
                    }}
                    className="h-4 w-4 rounded accent-[#4B3FD6]"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">{t.dashboard.colProduct}</th>
                <th className="px-4 py-3 font-semibold">{t.dashboard.colHealth}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.inventory.colStockRop}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.scale.moqLabel}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.dashboard.colRecOrder}</th>
                <th className="px-5 py-3 text-right font-semibold">{t.scale.financialImpact}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
              {pagedQueue.map((p) => {
                const sum = summaries.get(p.id);
                if (!sum) return null;
                const checked = bulkPoSelectedIds.has(p.id);
                const activeRow = p.id === product.id;
                return (
                  <tr
                    key={p.id}
                    className={`mr-zebra-row transition-colors ${
                      activeRow
                        ? "bg-[#4B3FD6]/[0.07] dark:bg-[#8B7CFF]/[0.12]"
                        : "hover:bg-[#F4F0E6]/65 dark:hover:bg-[#1A1A2E]/60"
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        aria-label={`Select ${p.name} for combined PO`}
                        onChange={() => toggleSelectSku(p.id)}
                        className="h-4 w-4 rounded accent-[#4B3FD6]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductAvatar src={p.imageUrl} name={p.name} size="sm" />
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProduct(p.id);
                              setAiExplain(null);
                            }}
                            className="text-left font-semibold text-[#14112B] hover:text-[#4B3FD6] dark:text-[#F3EFE6] dark:hover:text-[#8B7CFF]"
                          >
                            {p.name}
                          </button>
                          <p className="flex items-center gap-1.5 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: getDepartmentColor(p.category) }}
                              aria-hidden="true"
                            />
                            {p.sku} · {p.supplier} · {sum.abcXyz}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <HealthBadge status={sum.healthStatus} reason={sum.healthReason} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                      {p.currentStock} / {sum.reorderPoint}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                      {p.moq}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                      {sum.recommendedOrderQty > 0 ? (
                        <span className="text-[#4B3FD6] dark:text-[#8B7CFF]">
                          +{sum.recommendedOrderQty} u
                        </span>
                      ) : (
                        <span className="text-[#6B6785] dark:text-[#A09CB5]">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold tabular-nums text-[#14112B] dark:text-[#F3EFE6]">
                      ₹{sum.financialImpact.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalQueuePages > 1 && (
          <div className="flex items-center justify-between border-t border-[#ECE6D8] px-5 py-3 text-xs dark:border-[#2A2A44]">
            <span className="text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
              {t.scale.showingRange} {(safeQueuePage - 1) * QUEUE_PAGE_SIZE + 1}–
              {Math.min(filteredQueue.length, safeQueuePage * QUEUE_PAGE_SIZE)} /{" "}
              {filteredQueue.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeQueuePage <= 1}
                onClick={() => setQueuePage((p) => Math.max(1, p - 1))}
                className="btn-lavish-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t.scale.prevPage}
              </button>
              <span className="font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                {t.scale.pageOf} {safeQueuePage} / {totalQueuePages}
              </span>
              <button
                type="button"
                disabled={safeQueuePage >= totalQueuePages}
                onClick={() => setQueuePage((p) => Math.min(totalQueuePages, p + 1))}
                className="btn-lavish-secondary inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium disabled:opacity-40"
              >
                {t.scale.nextPage}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Consolidated Supplier Purchase Plan */}
      <section
        id="po-plan-section"
        aria-label="Consolidated supplier purchase order plan"
        className="mr-card-featured rounded-xl"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-[#ECE6D8] p-6 sm:flex-row sm:items-center dark:border-[#2A2A44]">
          <div>
            <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.inventory.poPlanTitle}
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.inventory.totalSpend}{" "}
              <span className="font-mono font-bold text-[#B8912B] dark:text-[#E3C16F] tabular-nums">
                ₹{totalPoSpend.toLocaleString("en-IN")}
              </span>{" "}
              ({purchaseOrders.filter((p) => p.subtotal > 0).length}{" "}
              {t.inventory.acrossSuppliers})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {bulkPoSelectedIds.size > 0 && (
              <div className="flex items-center gap-1 rounded-lg bg-[#F4F0E6] p-1 dark:bg-[#1A1A2E]">
                <button
                  type="button"
                  onClick={() => setPoScope("all")}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                    poScope === "all"
                      ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                      : "text-[#6B6785] dark:text-[#A09CB5]"
                  }`}
                >
                  {t.scale.poScopeAll}
                </button>
                <button
                  type="button"
                  onClick={() => setPoScope("selected")}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap ${
                    poScope === "selected"
                      ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                      : "text-[#6B6785] dark:text-[#A09CB5]"
                  }`}
                >
                  {t.scale.poScopeSelected} ({bulkPoSelectedIds.size})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => exportPurchaseOrdersCsv(purchaseOrders)}
              className="btn-lavish-secondary inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              {t.inventory.exportCsv}
            </button>
            {/* Gold Foil CTA accent on Download / Print Purchase Plan button */}
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="mr-gold-cta inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8912B] whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              {t.inventory.printPdf}
            </button>
          </div>
        </div>

        {purchaseOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6B6785] dark:text-[#A09CB5]">
            {t.inventory.noPoNeeded}
          </div>
        ) : (
          <div className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
            {purchaseOrders.map((po) => (
              <div key={po.supplier} className="p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
                        {po.supplier}
                      </h3>
                      {po.supplierLateRisk && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#E5484D]/55 bg-[#E5484D]/[0.12] px-2 py-0.5 text-[11px] font-semibold text-[#B4232C] dark:text-[#FF7D82]">
                          <AlertTriangle className="h-3 w-3 text-[#E5484D]" />
                          Delay risk (+3d)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                      {t.inventory.leadTime}: {po.leadTimeDays}d · {t.inventory.estDelivery}:{" "}
                      {po.expectedDeliveryDate}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                    {t.inventory.subtotal}: ₹{po.subtotal.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="mr-table-head sticky top-0 border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                        <th className="py-2 font-medium">{t.dashboard.colProduct}</th>
                        <th className="py-2 text-right font-medium">{t.inventory.colStockRop}</th>
                        <th className="py-2 text-right font-medium">{t.scale.moqLabel}</th>
                        <th className="py-2 text-right font-medium">{t.inventory.colSuggested}</th>
                        <th className="py-2 text-right font-medium">{t.inventory.colOrderQty}</th>
                        <th className="py-2 text-right font-medium">{t.inventory.colUnitCost}</th>
                        <th className="py-2 text-right font-medium">{t.inventory.colLineTotal}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
                      {po.lines.map((line) => {
                        const lineProd = products.find((p) => p.id === line.productId);
                        return (
                          <tr key={line.productId} className="mr-zebra-row">
                            <td className="py-2.5">
                              <div className="flex items-center gap-2.5">
                                <ProductAvatar
                                  src={lineProd?.imageUrl}
                                  name={line.productName}
                                  size="sm"
                                />
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => onSelectProduct(line.productId)}
                                    className="font-semibold text-[#14112B] hover:text-[#4B3FD6] dark:text-[#F3EFE6] dark:hover:text-[#8B7CFF] text-left"
                                  >
                                    {line.productName}
                                  </button>
                                  <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                                    {line.sku}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                              {line.currentStock} / {line.reorderPoint}
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                              {line.moq}
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                              {line.recommendedQty}
                            </td>
                            <td className="py-2.5 text-right">
                              <input
                                type="number"
                                min={0}
                                max={5000}
                                value={line.selectedQty}
                                aria-label={`Order quantity for ${line.productName}`}
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    Math.round(Number(e.target.value) || 0)
                                  );
                                  onUpdatePoQuantity(line.productId, val);
                                }}
                                className="w-20 rounded-md border border-[#ECE6D8] bg-[#F4F0E6]/60 px-2 py-1 text-right font-mono text-xs font-semibold text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF] tabular-nums"
                              />
                            </td>
                            <td className="py-2.5 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                              ₹{line.unitCost.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-[#14112B] dark:text-[#F3EFE6]">
                              ₹{line.lineTotal.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showPrintModal && (
        <PurchaseOrderPrintModal
          orders={purchaseOrders}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
