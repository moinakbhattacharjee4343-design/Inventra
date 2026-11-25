import React, { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  PackageCheck,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AbcClass,
  AbcXyzCode,
  ALL_DEPARTMENTS,
  AnomalyAlert,
  HealthStatus,
  Product,
  ProductCategory,
  ProductSummary,
  XyzClass,
} from "../types/inventory";
import { HealthBadge } from "./HealthBadge";
import { HelpTip } from "./HelpTip";
import { NavTab } from "./DemoTourModal";
import { ProductAvatar } from "./ProductAvatar";
import { useLanguage } from "../lib/LanguageContext";
import { getChartTokens, getDepartmentColor, useCountUp } from "../lib/themeTokens";

interface DashboardViewProps {
  products: Product[];
  summaries: Map<string, ProductSummary>;
  anomalies: AnomalyAlert[];
  onNavigate: (tab: NavTab, productId?: string) => void;
  darkMode: boolean;
  isComputing?: boolean;
}

type SortField = "impact" | "cover" | "order" | "wape";

const SCORECARD_PAGE_SIZE = 12;

const ABC_ROWS: AbcClass[] = ["A", "B", "C"];
const XYZ_COLS: XyzClass[] = ["X", "Y", "Z"];

const MATRIX_HINT: Record<AbcXyzCode, string> = {
  AX: "Core · Tight JIT",
  AY: "Core · Seasonal",
  AZ: "Core · High Buffer",
  BX: "Mid · Auto-ROP",
  BY: "Mid · Periodic",
  BZ: "Mid · Watch",
  CX: "Tail · Low Touch",
  CY: "Tail · Batch",
  CZ: "Tail · Trim / Hold",
};

const MiniSparkline: React.FC<{ points: number[]; color: string; id: string }> = ({
  points,
  color,
  id,
}) => {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const width = 76;
  const height = 22;

  const coordsList = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / span) * (height - 4) - 2;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
  });

  const linePoints = coordsList.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M ${coordsList[0].x},${height} L ${coordsList
    .map((p) => `${p.x},${p.y}`)
    .join(" L ")} L ${coordsList[coordsList.length - 1].x},${height} Z`;

  const gradId = `spark-${id.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
      />
    </svg>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  summaries,
  anomalies,
  onNavigate,
  darkMode,
  isComputing = false,
}) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [supplierFilter, setSupplierFilter] = useState<string>("All");
  const [abcXyzFilter, setAbcXyzFilter] = useState<string>("All");
  const [healthFilter, setHealthFilter] = useState<"all" | HealthStatus>("all");
  const [sortBy, setSortBy] = useState<SortField>("impact");
  const [page, setPage] = useState(1);

  const chartTokens = useMemo(() => getChartTokens(darkMode), [darkMode]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const suppliers = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.supplier))).sort()],
    [products]
  );

  const kpis = useMemo(() => {
    let stockoutRiskCount = 0;
    let atRiskRevenue = 0;
    let overstockValue = 0;
    let overstockCount = 0;
    let projected30dRevenue = 0;
    let totalOnHandValue = 0;
    let wapeSum = 0;
    let wapeCount = 0;
    let pendingOrderSpend = 0;
    let pendingOrderSkus = 0;
    let topOverstockId = products[0]?.id ?? "";
    let topOverstockAmt = -1;

    for (const p of products) {
      const sum = summaries.get(p.id);
      if (!sum) continue;

      totalOnHandValue += p.currentStock * p.unitCost;
      if (sum.healthReason === "stockout_risk" || sum.healthReason === "approaching_rop") {
        if (sum.healthStatus === "critical") stockoutRiskCount++;
        atRiskRevenue += sum.costOfStockout30d;
      }
      if (sum.overstockValue > 0) {
        overstockValue += sum.overstockValue;
        if (sum.healthReason === "overstock_risk") overstockCount++;
        if (sum.overstockValue > topOverstockAmt) {
          topOverstockAmt = sum.overstockValue;
          topOverstockId = p.id;
        }
      }
      if (sum.recommendedOrderQty > 0) {
        pendingOrderSkus++;
        pendingOrderSpend += sum.recommendedOrderQty * p.unitCost;
      }
      projected30dRevenue += sum.projected30DayRevenue;
      wapeSum += sum.wape;
      wapeCount++;
    }

    const avgWape = wapeCount > 0 ? Number((wapeSum / wapeCount).toFixed(1)) : 0;
    const accuracyPct = Number(Math.max(0, 100 - avgWape).toFixed(1));

    return {
      stockoutRiskCount,
      atRiskRevenue,
      overstockValue,
      overstockCount,
      projected30dRevenue,
      totalOnHandValue: Math.round(totalOnHandValue),
      avgWape,
      accuracyPct,
      pendingOrderSpend: Math.round(pendingOrderSpend),
      pendingOrderSkus,
      topOverstockId,
    };
  }, [products, summaries]);

  const animHeroRev = useCountUp(kpis.projected30dRevenue, 520);
  const animStockoutCount = useCountUp(kpis.stockoutRiskCount, 400);
  const animOverstockVal = useCountUp(kpis.overstockValue, 480);
  const animProjRev = useCountUp(kpis.projected30dRevenue, 480);
  const animAccuracy = useCountUp(kpis.accuracyPct, 420);

  const departmentRollups = useMemo(() => {
    const map = new Map<
      string,
      {
        department: ProductCategory;
        shortLabel: string;
        color: string;
        skuCount: number;
        criticalCount: number;
        stockoutCount: number;
        revenue30d: number;
        overstockCapital: number;
      }
    >();

    const deptOrder = Array.from(
      new Set([...ALL_DEPARTMENTS, ...products.map((p) => p.category)])
    ) as ProductCategory[];

    for (const dept of deptOrder) {
      const items = products.filter((p) => p.category === dept);
      if (items.length === 0) continue;
      let criticalCount = 0;
      let stockoutCount = 0;
      let revenue30d = 0;
      let overstockCapital = 0;

      for (const p of items) {
        const sum = summaries.get(p.id);
        if (!sum) continue;
        if (sum.healthStatus === "critical") criticalCount++;
        if (sum.healthReason === "stockout_risk") stockoutCount++;
        revenue30d += sum.projected30DayRevenue;
        overstockCapital += sum.overstockValue;
      }

      map.set(dept, {
        department: dept,
        shortLabel: dept.split("&")[0].split(",")[0].trim(),
        color: getDepartmentColor(dept),
        skuCount: items.length,
        criticalCount,
        stockoutCount,
        revenue30d: Math.round(revenue30d),
        overstockCapital: Math.round(overstockCapital),
      });
    }

    return Array.from(map.values());
  }, [products, summaries]);

  const abcXyzMatrix = useMemo(() => {
    const cells = new Map<
      AbcXyzCode,
      { code: AbcXyzCode; count: number; impactTotal: number; criticalCount: number }
    >();
    for (const a of ABC_ROWS) {
      for (const x of XYZ_COLS) {
        const code: AbcXyzCode = `${a}${x}`;
        cells.set(code, { code, count: 0, impactTotal: 0, criticalCount: 0 });
      }
    }
    for (const p of products) {
      const sum = summaries.get(p.id);
      if (!sum) continue;
      const cell = cells.get(sum.abcXyz);
      if (!cell) continue;
      cell.count += 1;
      cell.impactTotal += sum.financialImpact;
      if (sum.healthStatus === "critical") cell.criticalCount += 1;
    }
    return cells;
  }, [products, summaries]);

  const healthDistribution = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let healthy = 0;
    for (const p of products) {
      const sum = summaries.get(p.id);
      if (!sum) continue;
      if (sum.healthStatus === "critical") critical++;
      else if (sum.healthStatus === "warning") warning++;
      else healthy++;
    }
    return [
      { key: "healthy" as HealthStatus, name: t.health.optimal, value: healthy, color: "#22C08A" },
      { key: "warning" as HealthStatus, name: t.health.warning, value: warning, color: "#F5A524" },
      { key: "critical" as HealthStatus, name: t.health.critical, value: critical, color: "#E5484D" },
    ].filter((d) => d.value > 0);
  }, [products, summaries, t]);

  const top10Actions = useMemo(() => {
    const items: Array<{
      id: string;
      product: Product;
      summary: ProductSummary;
      title: string;
      detail: string;
      severity: "critical" | "warning";
      ctaLabel: string;
      impact: number;
    }> = [];

    for (const p of products) {
      const sum = summaries.get(p.id);
      if (!sum) continue;
      if (sum.healthStatus === "healthy" && sum.recommendedOrderQty === 0) continue;

      const ctaLabel =
        sum.healthReason === "stockout_risk"
          ? t.dashboard.reviewAndOrder
          : sum.healthReason === "overstock_risk" ||
              sum.healthReason === "expiry_risk" ||
              sum.healthReason === "dead_stock"
            ? t.dashboard.inspectStock
            : t.dashboard.planOrder;

      items.push({
        id: `act-${p.id}`,
        product: p,
        summary: sum,
        title: `${p.name} · ${sum.actionSummary}`,
        detail: sum.actionReason,
        severity: sum.healthStatus === "critical" ? "critical" : "warning",
        ctaLabel,
        impact: sum.financialImpact,
      });
    }

    return items.sort((a, b) => b.impact - a.impact).slice(0, 10);
  }, [products, summaries, t]);

  const activeAnomalies = useMemo(
    () => anomalies.filter((a) => !a.dismissed),
    [anomalies]
  );

  const filteredProducts = useMemo(() => {
    const statusOrder: Record<HealthStatus, number> = {
      critical: 0,
      warning: 1,
      healthy: 2,
    };

    return products
      .filter((p) => {
        const sum = summaries.get(p.id);
        if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
        if (supplierFilter !== "All" && p.supplier !== supplierFilter) return false;
        if (abcXyzFilter !== "All" && sum?.abcXyz !== abcXyzFilter) return false;
        if (healthFilter !== "all" && sum?.healthStatus !== healthFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !p.name.toLowerCase().includes(q) &&
            !p.sku.toLowerCase().includes(q) &&
            !p.supplier.toLowerCase().includes(q) &&
            !p.category.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const sumA = summaries.get(a.id);
        const sumB = summaries.get(b.id);
        if (!sumA || !sumB) return 0;

        if (sortBy === "cover") return sumA.daysOfCover - sumB.daysOfCover;
        if (sortBy === "order") return sumB.recommendedOrderQty - sumA.recommendedOrderQty;
        if (sortBy === "wape") return sumA.wape - sumB.wape;
        if (statusOrder[sumA.healthStatus] !== statusOrder[sumB.healthStatus]) {
          return statusOrder[sumA.healthStatus] - statusOrder[sumB.healthStatus];
        }
        return sumB.financialImpact - sumA.financialImpact;
      });
  }, [
    products,
    summaries,
    categoryFilter,
    supplierFilter,
    abcXyzFilter,
    healthFilter,
    search,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, supplierFilter, abcXyzFilter, healthFilter, search, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / SCORECARD_PAGE_SIZE)
  );
  const safePage = Math.min(page, totalPages);
  const pagedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (safePage - 1) * SCORECARD_PAGE_SIZE,
        safePage * SCORECARD_PAGE_SIZE
      ),
    [filteredProducts, safePage]
  );

  const totalHistoryRows = useMemo(
    () => products.reduce((sum, p) => sum + p.dailySales.length, 0),
    [products]
  );

  const showSkeleton = isComputing && summaries.size === 0;

  return (
    <div className="space-y-6">
      {/* Midnight Royal Hero Banner: Royal Aurora Gradient + 1px Gold Hairline + 6% Dotted Texture */}
      <section
        aria-label="Store executive summary"
        className="mr-royal-aurora relative overflow-hidden rounded-2xl px-6 py-6 sm:px-8 sm:py-7"
      >
        <div className="mr-hero-dots pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#E3C16F]/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0 space-y-2.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E3C16F]/40 bg-[#120C2E]/60 px-3 py-1 text-[11px] font-semibold text-[#F6E7B4]">
              <Sparkles className="h-3.5 w-3.5 text-[#E3C16F]" aria-hidden="true" />
              <span>
                {t.dashboard.briefKicker} · {products.length} {t.dashboard.skusMonitored} ·{" "}
                {departmentRollups.length} Departments
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl tabular-nums">
                ₹{Math.round(animHeroRev).toLocaleString("en-IN")}
              </p>
              <span className="text-xs font-medium text-[#E3C16F]">
                {t.dashboard.kpiRevenueTitle}
              </span>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-[#F3EFE6]/90 text-balance">
              {kpis.pendingOrderSkus} {t.dashboard.briefLine1}{" "}
              <span className="font-mono font-bold text-white underline decoration-[#E3C16F] decoration-2 underline-offset-4 tabular-nums">
                ₹{kpis.pendingOrderSpend.toLocaleString("en-IN")}
              </span>{" "}
              {t.dashboard.briefLine2}{" "}
              <span className="font-mono font-bold text-[#F6E7B4] tabular-nums">
                ₹{kpis.overstockValue.toLocaleString("en-IN")}
              </span>{" "}
              {t.dashboard.briefLine3}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("top-10-actions");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="mr-gold-cta inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6E7B4] whitespace-nowrap"
            >
              <span>{t.dashboard.viewTop10Btn}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("advisor")}
              className="btn-lavish-glass inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F] whitespace-nowrap"
            >
              {t.dashboard.askAdvisorBtn}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              className="btn-lavish-ivory inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F] whitespace-nowrap"
            >
              {t.dashboard.reviewPosBtn}
            </button>
          </div>
        </div>
      </section>

      {/* KPI Strip */}
      <section aria-label="Store health overview">
        {showSkeleton ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="mr-card rounded-xl p-5 space-y-3">
                <div className="mr-skeleton h-3.5 w-32 rounded" />
                <div className="mr-skeleton h-8 w-28 rounded" />
                <div className="mr-skeleton h-3 w-44 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setHealthFilter(healthFilter === "critical" ? "all" : "critical")}
              className="mr-card group rounded-xl p-5 text-left hover:border-[#E5484D]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] dark:focus-visible:ring-[#8B7CFF]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                  {t.dashboard.kpiStockoutTitle}
                </p>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#B4232C] dark:text-[#FF7D82] tabular-nums whitespace-nowrap">
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#E5484D]" aria-hidden="true" />
                  ₹{kpis.atRiskRevenue.toLocaleString("en-IN")} {t.dashboard.kpiAtRisk}
                </span>
              </div>
              <p className="mt-2.5 font-display text-[30px] font-bold leading-none tracking-tight text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                {Math.round(animStockoutCount)} SKUs
              </p>
              <p className="mt-3 border-t border-[#ECE6D8] pt-2.5 text-xs text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                {healthFilter === "critical" ? t.dashboard.kpiStockoutActiveFoot : t.dashboard.kpiStockoutFoot}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("inventory", kpis.topOverstockId)}
              className="mr-card group rounded-xl p-5 text-left hover:border-[#F5A524]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] dark:focus-visible:ring-[#8B7CFF]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                  {t.dashboard.kpiOverstockTitle}
                </p>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#9A5B00] dark:text-[#F5A524] tabular-nums whitespace-nowrap">
                  <ArrowDownRight className="h-3.5 w-3.5 text-[#F5A524]" aria-hidden="true" />
                  {kpis.overstockCount} {t.dashboard.kpiExcessSkus}
                </span>
              </div>
              <p className="mt-2.5 font-display text-[30px] font-bold leading-none tracking-tight text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                ₹{Math.round(animOverstockVal).toLocaleString("en-IN")}
              </p>
              <p className="mt-3 border-t border-[#ECE6D8] pt-2.5 text-xs text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                {t.dashboard.kpiOverstockFoot}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("scenarios")}
              className="mr-card group rounded-xl p-5 text-left hover:border-[#4B3FD6]/60 dark:hover:border-[#8B7CFF]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] dark:focus-visible:ring-[#8B7CFF]"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                  {t.dashboard.kpiRevenueTitle}
                </p>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#0E7A55] dark:text-[#22C08A] tabular-nums whitespace-nowrap">
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#22C08A]" aria-hidden="true" />
                  +6.4% · {products.length} SKUs
                </span>
              </div>
              <p className="mt-2.5 font-display text-[30px] font-bold leading-none tracking-tight text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                ₹{Math.round(animProjRev).toLocaleString("en-IN")}
              </p>
              <p className="mt-3 border-t border-[#ECE6D8] pt-2.5 text-xs text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                {t.dashboard.kpiRevenueFoot}
              </p>
            </button>

            <div className="mr-card rounded-xl p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                  <span>{t.dashboard.kpiAccuracyTitle}</span>
                  <HelpTip term="wape" />
                </div>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums whitespace-nowrap">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  {kpis.avgWape}% WAPE
                </span>
              </div>
              <p className="mt-2.5 font-display text-[30px] font-bold leading-none tracking-tight text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                {animAccuracy.toFixed(1)}%
              </p>
              <p className="mt-3 border-t border-[#ECE6D8] pt-2.5 text-xs text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                {t.dashboard.kpiAccuracyFoot}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 10 Department Roll-Up Cards */}
      <section aria-label={t.scale.deptOverviewTitle} className="mr-card rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              <Layers className="h-4 w-4 text-[#4B3FD6] dark:text-[#8B7CFF]" aria-hidden="true" />
              {t.scale.deptOverviewTitle}
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.scale.deptOverviewSub}
            </p>
          </div>
          {categoryFilter !== "All" && (
            <button
              type="button"
              onClick={() => setCategoryFilter("All")}
              className="text-xs font-semibold text-[#4B3FD6] hover:underline dark:text-[#8B7CFF]"
            >
              {t.dashboard.allCategories}
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {departmentRollups.map((dept) => {
            const active = categoryFilter === dept.department;
            return (
              <button
                key={dept.department}
                type="button"
                onClick={() => setCategoryFilter(active ? "All" : dept.department)}
                className={`rounded-xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] dark:focus-visible:ring-[#8B7CFF] ${
                  active
                    ? "border-[#4B3FD6] bg-[#4B3FD6]/[0.07] ring-1 ring-[#4B3FD6]/30 dark:border-[#8B7CFF] dark:bg-[#8B7CFF]/12 dark:ring-[#8B7CFF]/30"
                    : "border-[#ECE6D8] bg-[#F4F0E6]/60 hover:border-[#B8912B]/55 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/55 dark:hover:border-[#E3C16F]/45"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dept.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                      {dept.department}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                    {dept.skuCount}
                  </span>
                </div>
                <p className="mt-2 font-mono text-sm font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                  ₹{Math.round(dept.revenue30d / 1000).toLocaleString("en-IN")}k{" "}
                  <span className="font-sans text-[10px] font-normal text-[#6B6785] dark:text-[#A09CB5]">
                    30d
                  </span>
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] tabular-nums">
                  <span
                    className={
                      dept.criticalCount > 0
                        ? "font-semibold text-[#B4232C] dark:text-[#FF7D82]"
                        : "text-[#0E7A55] dark:text-[#22C08A]"
                    }
                  >
                    {dept.criticalCount} critical
                  </span>
                  <span className="font-mono text-[#9A5B00] dark:text-[#F5A524]">
                    ₹{Math.round(dept.overstockCapital / 1000)}k excess
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Visual Analytics Row: 10-Department Chart + Catalog Health Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label="Department revenue and overstock capital chart"
          className="mr-card rounded-xl p-6 lg:col-span-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                {t.dashboard.catChartTitle}
              </h2>
              <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {t.dashboard.catChartSub}
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium text-[#6B6785] dark:text-[#A09CB5]">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{ backgroundColor: chartTokens.historical }}
                  aria-hidden="true"
                />
                {t.dashboard.legendRevenue}
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{ backgroundColor: chartTokens.forecast }}
                  aria-hidden="true"
                />
                {t.dashboard.legendOverstock}
              </span>
            </div>
          </div>

          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentRollups}
                margin={{ top: 8, right: 10, left: 4, bottom: 20 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke={chartTokens.gridStroke}
                />
                <XAxis
                  dataKey="shortLabel"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                  height={46}
                  tick={{ fontSize: 10, fill: chartTokens.axisTick }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                  tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: darkMode ? "rgba(255,255,255,0.03)" : "rgba(20,17,43,0.03)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const row = payload[0]?.payload as (typeof departmentRollups)[number];
                    return (
                      <div
                        style={chartTokens.tooltipStyle}
                        className="p-3 text-xs"
                      >
                        <p className="flex items-center gap-2 font-display font-bold text-[#14112B] dark:text-[#F3EFE6]">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.department} ({row.skuCount} SKUs)
                        </p>
                        <p className="mt-1 font-mono text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                          {t.dashboard.legendRevenue}: ₹{row.revenue30d.toLocaleString("en-IN")}
                        </p>
                        <p className="mt-0.5 font-mono text-[#B8912B] dark:text-[#E3C16F] tabular-nums">
                          {t.dashboard.legendOverstock}: ₹{row.overstockCapital.toLocaleString("en-IN")}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="revenue30d"
                  fill={chartTokens.historical}
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="overstockCapital"
                  fill={chartTokens.forecast}
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Catalog Health Donut + Anomaly Snapshot */}
        <section
          aria-label="Catalog health distribution"
          className="mr-card flex flex-col justify-between rounded-xl p-6 lg:col-span-5"
        >
          <div>
            <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.dashboard.donutTitle}
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.dashboard.donutSub}{" "}
              <span className="font-mono font-semibold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                ₹{kpis.totalOnHandValue.toLocaleString("en-IN")}
              </span>
            </p>
          </div>

          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {healthDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} SKUs`, String(name)]}
                    contentStyle={chartTokens.tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                  {products.length}
                </span>
                <span className="text-[11px] font-medium text-[#6B6785] dark:text-[#A09CB5]">
                  {t.dashboard.totalSkus}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {healthDistribution.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setHealthFilter(healthFilter === item.key ? "all" : item.key)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-[#F4F0E6] dark:hover:bg-[#1A1A2E]"
                >
                  <span className="flex items-center gap-2 font-medium text-[#14112B] dark:text-[#F3EFE6]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    {item.name}
                  </span>
                  <span className="font-mono font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                    {item.value} SKUs
                  </span>
                </button>
              ))}
              <div className="flex items-center justify-between border-t border-[#ECE6D8] pt-2.5 text-[11px] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                <span>
                  {activeAnomalies.length} {t.dashboard.anomaliesUnderWatch}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate("alerts")}
                  className="font-semibold text-[#4B3FD6] hover:underline dark:text-[#8B7CFF]"
                >
                  {t.dashboard.viewAll}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ABC-XYZ 3x3 Interactive Matrix + Top 10 Actions Today (Ranked by ₹ Impact) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label={t.scale.abcXyzTitle}
          className="mr-card rounded-xl p-6 lg:col-span-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                {t.scale.abcXyzTitle}
              </h2>
              <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {t.scale.abcXyzSub}
              </p>
            </div>
            {abcXyzFilter !== "All" && (
              <button
                type="button"
                onClick={() => setAbcXyzFilter("All")}
                className="text-xs font-semibold text-[#4B3FD6] hover:underline dark:text-[#8B7CFF]"
              >
                {t.scale.abcXyzClear}
              </button>
            )}
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold text-[#6B6785] dark:text-[#A09CB5]">
              <div />
              <div>X (Steady)</div>
              <div>Y (Seasonal)</div>
              <div className="text-[#B8912B] dark:text-[#E3C16F]">Z (Volatile)</div>
            </div>

            <div className="mt-1.5 space-y-2">
              {ABC_ROWS.map((rowClass) => (
                <div key={rowClass} className="grid grid-cols-4 items-stretch gap-2">
                  <div className="flex flex-col justify-center rounded-lg bg-[#F4F0E6]/80 px-2.5 py-2 text-left dark:bg-[#1A1A2E]/70">
                    <span className="font-mono text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                      Class {rowClass}
                    </span>
                    <span className="text-[10px] text-[#6B6785] dark:text-[#A09CB5]">
                      {rowClass === "A"
                        ? "Top 20% rev"
                        : rowClass === "B"
                          ? "Next 30% rev"
                          : "Tail 50% rev"}
                    </span>
                  </div>

                  {XYZ_COLS.map((colClass) => {
                    const code: AbcXyzCode = `${rowClass}${colClass}`;
                    const cell = abcXyzMatrix.get(code)!;
                    const active = abcXyzFilter === code;
                    const isErratic = colClass === "Z";
                    const depthBg =
                      rowClass === "A"
                        ? "bg-[#4B3FD6]/[0.11] dark:bg-[#8B7CFF]/[0.16]"
                        : rowClass === "B"
                          ? "bg-[#4B3FD6]/[0.06] dark:bg-[#8B7CFF]/[0.09]"
                          : "bg-[#F4F0E6]/60 dark:bg-[#1A1A2E]/45";

                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setAbcXyzFilter(active ? "All" : code)}
                        className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] dark:focus-visible:ring-[#8B7CFF] ${depthBg} ${
                          active
                            ? "border-[#4B3FD6] ring-2 ring-[#4B3FD6]/35 dark:border-[#8B7CFF] dark:ring-[#8B7CFF]/35"
                            : isErratic
                              ? "border-[#B8912B]/65 dark:border-[#E3C16F]/55 hover:border-[#B8912B] dark:hover:border-[#E3C16F]"
                              : "border-[#ECE6D8] hover:border-[#4B3FD6]/50 dark:border-[#2A2A44] dark:hover:border-[#8B7CFF]/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isErratic
                                ? "text-[#B8912B] dark:text-[#E3C16F]"
                                : "text-[#4B3FD6] dark:text-[#8B7CFF]"
                            }`}
                          >
                            {code}
                          </span>
                          <span className="font-mono text-sm font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                            {cell.count}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] leading-tight text-[#6B6785] dark:text-[#A09CB5]">
                          {MATRIX_HINT[code]}
                        </p>
                        {cell.criticalCount > 0 && (
                          <p className="mt-1 font-mono text-[10px] font-semibold text-[#B4232C] dark:text-[#FF7D82] tabular-nums">
                            {cell.criticalCount} critical
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Compact Anomaly Feed Snapshot underneath ABC-XYZ */}
          <div className="mt-6 border-t border-[#ECE6D8] pt-4 dark:border-[#2A2A44]">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                {t.dashboard.anomalyWatchTitle} ({activeAnomalies.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate("alerts")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#4B3FD6] hover:underline dark:text-[#8B7CFF]"
              >
                {t.dashboard.viewAll}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {activeAnomalies.length === 0 ? (
              <p className="mt-2 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {t.dashboard.noAnomaliesTitle}
              </p>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {activeAnomalies.slice(0, 4).map((al) => (
                  <li
                    key={al.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => onNavigate("alerts")}
                      className="inline-flex min-w-0 items-center gap-1.5 truncate text-left font-medium text-[#14112B] hover:text-[#4B3FD6] dark:text-[#F3EFE6] dark:hover:text-[#8B7CFF]"
                    >
                      <AlertOctagon
                        className={`h-3.5 w-3.5 shrink-0 ${
                          al.severityLabel === "Critical"
                            ? "text-[#E5484D]"
                            : "text-[#F5A524]"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">
                        {al.productName}: {al.title}
                      </span>
                    </button>
                    <span className="shrink-0 font-mono text-[11px] text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                      {al.severityScore}/100
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Top 10 Actions Today Ranked Strictly by ₹ Financial Impact */}
        <section
          id="top-10-actions"
          aria-label={t.scale.top10ActionsTitle}
          className="mr-card rounded-xl p-6 lg:col-span-7 scroll-mt-20"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                {t.scale.top10ActionsTitle}
              </h2>
              <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {t.scale.top10ActionsSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4B3FD6] hover:text-[#3B30B8] dark:text-[#8B7CFF] dark:hover:text-[#A99DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
            >
              {t.dashboard.openPurchasePlan}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {top10Actions.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
              <PackageCheck className="h-8 w-8 text-[#22C08A]" />
              <p className="mt-2 text-sm font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                {t.dashboard.allHealthyTitle}
              </p>
              <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {t.dashboard.allHealthySub}
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {top10Actions.map((item, idx) => (
                <li
                  key={item.id}
                  className={`flex flex-col justify-between gap-3 rounded-xl p-3 sm:flex-row sm:items-center ${
                    idx === 0
                      ? "mr-card-featured"
                      : "border border-[#ECE6D8] bg-[#F4F0E6]/45 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/40"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-1 w-5 shrink-0 font-mono text-xs font-bold text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                      #{idx + 1}
                    </span>
                    <ProductAvatar
                      src={item.product.imageUrl}
                      name={item.product.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <HealthBadge
                          status={item.summary.healthStatus}
                          reason={item.summary.healthReason}
                        />
                        <p className="text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                          {item.title}
                        </p>
                        <span className="font-mono text-[11px] font-semibold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                          {t.scale.financialImpact}: ₹{item.impact.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-relaxed text-[#6B6785] dark:text-[#A09CB5]">
                        <span
                          className="inline-block h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: getDepartmentColor(item.product.category) }}
                          aria-hidden="true"
                        />
                        <span>
                          {item.product.sku} · {item.product.category} · {item.summary.abcXyz} —{" "}
                          {item.detail}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate("inventory", item.product.id)}
                    className="btn-lavish-secondary shrink-0 self-start rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap sm:self-center"
                  >
                    {item.ctaLabel}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Product Health Scorecard Table (Searchable, Multi-Filterable, Paginated) */}
      <section aria-label="Product health score table" className="mr-card rounded-xl">
        <div className="flex flex-col justify-between gap-4 border-b border-[#ECE6D8] p-5 dark:border-[#2A2A44]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                {t.dashboard.scorecardTitle} ({filteredProducts.length})
              </h2>
              <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {t.dashboard.scorecardSub}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-[#F4F0E6] p-1 dark:bg-[#1A1A2E]">
              {(
                [
                  { id: "all", label: t.dashboard.filterAll },
                  { id: "critical", label: t.dashboard.filterCritical },
                  { id: "warning", label: t.dashboard.filterWarning },
                  { id: "healthy", label: t.dashboard.filterHealthy },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setHealthFilter(item.id)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap ${
                    healthFilter === item.id
                      ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                      : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.dashboard.searchPlaceholder}
                aria-label={t.dashboard.searchPlaceholder}
                className="min-h-[38px] w-52 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 pl-8 pr-3 text-xs text-[#14112B] placeholder:text-[#6B6785] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:placeholder:text-[#A09CB5] dark:focus:border-[#8B7CFF]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label={t.dashboard.allCategories}
              className="min-h-[38px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? t.dashboard.allCategories : cat}
                </option>
              ))}
            </select>

            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              aria-label={t.scale.allSuppliers}
              className="min-h-[38px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
            >
              {suppliers.map((sup) => (
                <option key={sup} value={sup}>
                  {sup === "All" ? t.scale.allSuppliers : sup}
                </option>
              ))}
            </select>

            <select
              value={abcXyzFilter}
              onChange={(e) => setAbcXyzFilter(e.target.value)}
              aria-label={t.scale.allAbcXyz}
              className="min-h-[38px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
            >
              <option value="All">{t.scale.allAbcXyz}</option>
              {ABC_ROWS.flatMap((a) =>
                XYZ_COLS.map((x) => {
                  const code = `${a}${x}`;
                  return (
                    <option key={code} value={code}>
                      {code} · {MATRIX_HINT[code as AbcXyzCode]}
                    </option>
                  );
                })
              )}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              aria-label={t.dashboard.sortPriority}
              className="min-h-[38px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
            >
              <option value="impact">{t.dashboard.sortPriority}</option>
              <option value="cover">{t.dashboard.sortCover}</option>
              <option value="order">{t.dashboard.sortOrder}</option>
              <option value="wape">{t.dashboard.sortAccuracy}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="mr-table-head sticky top-0 z-10 border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                <th className="px-5 py-3 font-semibold">{t.dashboard.colProduct}</th>
                <th className="px-4 py-3 font-semibold">{t.dashboard.colHealth}</th>
                <th className="px-4 py-3 font-semibold">{t.dashboard.colTrend}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.dashboard.colStockRop}</th>
                <th className="px-4 py-3 text-right font-semibold">
                  {t.dashboard.colCover} <HelpTip term="daysOfCover" />
                </th>
                <th className="px-4 py-3 text-right font-semibold">{t.dashboard.colRecOrder}</th>
                <th className="px-4 py-3 text-right font-semibold">{t.dashboard.colConfidence}</th>
                <th className="px-5 py-3 text-right font-semibold">{t.dashboard.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
              {pagedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <p className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
                      {t.dashboard.noMatch}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setCategoryFilter("All");
                        setSupplierFilter("All");
                        setAbcXyzFilter("All");
                        setHealthFilter("all");
                      }}
                      className="btn-lavish-secondary mt-3 rounded-lg px-3.5 py-1.5 text-xs font-semibold"
                    >
                      {t.dashboard.filterAll}
                    </button>
                  </td>
                </tr>
              ) : (
                pagedProducts.map((p) => {
                  const sum = summaries.get(p.id);
                  if (!sum) return null;

                  const ropRatio = Math.min(
                    100,
                    Math.round((p.currentStock / Math.max(1, sum.reorderPoint * 1.6)) * 100)
                  );
                  const barColor =
                    sum.healthStatus === "critical"
                      ? sum.healthReason === "overstock_risk"
                        ? "bg-[#F5A524]"
                        : "bg-[#E5484D]"
                      : sum.healthStatus === "warning"
                        ? "bg-[#F5A524]"
                        : "bg-[#22C08A]";

                  return (
                    <tr
                      key={p.id}
                      className="mr-zebra-row transition-colors hover:bg-[#F4F0E6]/65 dark:hover:bg-[#1A1A2E]/65"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProductAvatar src={p.imageUrl} name={p.name} size="sm" />
                          <div>
                            <button
                              type="button"
                              onClick={() => onNavigate("forecasts", p.id)}
                              className="text-left font-semibold text-[#14112B] hover:text-[#4B3FD6] dark:text-[#F3EFE6] dark:hover:text-[#8B7CFF]"
                            >
                              {p.name}
                            </button>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: getDepartmentColor(p.category) }}
                                aria-hidden="true"
                              />
                              <span>
                                {p.sku} · {p.category} · {sum.abcXyz} · {p.leadTimeDays}d lead
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <HealthBadge status={sum.healthStatus} reason={sum.healthReason} />
                      </td>
                      <td className="px-4 py-3.5">
                        <MiniSparkline
                          id={p.id}
                          points={sum.sparkline12w}
                          color={chartTokens.historical}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="ml-auto w-24">
                          <div className="flex justify-between font-mono text-[11px] tabular-nums">
                            <span className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                              {p.currentStock}
                            </span>
                            <span className="text-[#6B6785] dark:text-[#A09CB5]">
                              /{sum.reorderPoint}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#F4F0E6] dark:bg-[#1A1A2E]">
                            <div
                              className={`h-full rounded-full ${barColor}`}
                              style={{ width: `${ropRatio}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#14112B] dark:text-[#F3EFE6]">
                        {sum.daysOfCover}d
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                        {sum.recommendedOrderQty > 0 ? (
                          <span className="text-[#4B3FD6] dark:text-[#8B7CFF]">
                            +{sum.recommendedOrderQty} ({sum.recommendedOrderDate})
                          </span>
                        ) : (
                          <span className="text-[#6B6785] dark:text-[#A09CB5]">
                            {t.dashboard.hold}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                        {sum.confidence} · {sum.wape}%
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onNavigate("forecasts", p.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#4B3FD6] hover:bg-[#4B3FD6]/10 dark:text-[#8B7CFF] dark:hover:bg-[#8B7CFF]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
                          >
                            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                            {t.dashboard.btnForecast}
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("inventory", p.id)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-[#B8912B] hover:bg-[#B8912B]/12 dark:text-[#E3C16F] dark:hover:bg-[#E3C16F]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8912B] whitespace-nowrap"
                          >
                            {t.dashboard.btnOptimize}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[#ECE6D8] px-5 py-3 text-xs dark:border-[#2A2A44]">
            <span className="text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
              {t.scale.showingRange} {(safePage - 1) * SCORECARD_PAGE_SIZE + 1}–
              {Math.min(filteredProducts.length, safePage * SCORECARD_PAGE_SIZE)} /{" "}
              {filteredProducts.length}
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
      </section>

      {/* How It Works Pipeline + Assumptions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-label="How Inventra works pipeline"
          className="mr-card rounded-xl p-5 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.dashboard.howItWorks}
            </h2>
            <span className="font-mono text-xs text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
              {totalHistoryRows.toLocaleString("en-IN")} {t.dashboard.dailyRowsAnalyzed}
            </span>
          </div>
          <ol className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
            {t.dashboard.pipeline.map((node, idx) => (
              <li
                key={node.step}
                className="border-t border-[#ECE6D8] pt-2 sm:border-t-0 sm:border-l sm:pl-3 sm:pt-0 first:border-0 first:pl-0 first:pt-0 dark:border-[#2A2A44]"
              >
                <p className="font-display text-xs font-bold text-[#4B3FD6] dark:text-[#8B7CFF]">
                  {node.step}
                </p>
                <p className="mt-0.5 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                  {idx === 0 ? `${products.length} ${node.detail}` : node.detail}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-label="Model assumptions and limitations"
          className="mr-card rounded-xl p-5 lg:col-span-5"
        >
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#4C9AFF]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
                {t.dashboard.assumptionsTitle}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#6B6785] dark:text-[#A09CB5]">
                {t.dashboard.assumptionsBody}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
