import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookmarkPlus, Layers, Package, RotateCcw, Trash2, Truck } from "lucide-react";
import {
  ALL_DEPARTMENTS,
  BulkScenarioSummary,
  FestivalEvent,
  ForecastResult,
  OptimizationResult,
  Product,
  ProductSummary,
  ScenarioAnalysisResult,
  ScenarioParams,
} from "../types/inventory";
import {
  FESTIVAL_LIFTS,
  runBulkScenarioAnalysisAsync,
  runScenarioAnalysis,
} from "../lib/simulation";
import { getChartTokens } from "../lib/themeTokens";
import { HelpTip } from "./HelpTip";
import { ProductAvatar } from "./ProductAvatar";
import { useLanguage } from "../lib/LanguageContext";

interface SavedScenarioEntry {
  id: string;
  name: string;
  productName: string;
  params: ScenarioParams;
  result: ScenarioAnalysisResult;
}

interface ScenariosViewProps {
  products: Product[];
  summaries: Map<string, ProductSummary>;
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
  forecast: ForecastResult;
  baselineOpt: OptimizationResult;
  darkMode: boolean;
}

const DEFAULT_PARAMS: ScenarioParams = {
  id: "draft",
  name: "Diwali + Delay Stress Test",
  demandChangePct: 10,
  supplierDelayDays: 3,
  priceChangePct: 0,
  promotionActive: false,
  festivalEvent: "diwali",
  budgetCap: null,
  supplyDisruption: false,
};

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  products,
  summaries,
  selectedProductId,
  onSelectProduct,
  forecast,
  baselineOpt,
  darkMode,
}) => {
  const { t } = useLanguage();
  const [scope, setScope] = useState<"single" | "department" | "supplier">("single");
  const [selectedDept, setSelectedDept] = useState<string>(ALL_DEPARTMENTS[0]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>(
    () => products[0]?.supplier ?? ""
  );

  const [params, setParams] = useState<ScenarioParams>(DEFAULT_PARAMS);
  const [scenarioName, setScenarioName] = useState("Diwali + 3d Delay");
  const [budgetEnabled, setBudgetEnabled] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(35000);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenarioEntry[]>([]);

  const [bulkSummary, setBulkSummary] = useState<BulkScenarioSummary | null>(null);
  const [bulkProgress, setBulkProgress] = useState<number>(0);
  const [bulkRunning, setBulkRunning] = useState<boolean>(false);

  const chartTokens = useMemo(() => getChartTokens(darkMode), [darkMode]);

  const product = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? products[0],
    [products, selectedProductId]
  );

  const departments = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const suppliers = useMemo(
    () => Array.from(new Set(products.map((p) => p.supplier))).sort(),
    [products]
  );

  const effectiveParams: ScenarioParams = useMemo(
    () => ({
      ...params,
      budgetCap: budgetEnabled ? budgetAmount : null,
    }),
    [params, budgetEnabled, budgetAmount]
  );

  const analysis = useMemo(
    () =>
      scope === "single"
        ? runScenarioAnalysis(product, forecast, baselineOpt, effectiveParams, 1000)
        : null,
    [scope, product, forecast, baselineOpt, effectiveParams]
  );

  useEffect(() => {
    if (scope === "single") {
      setBulkSummary(null);
      setBulkRunning(false);
      return;
    }

    const targetProducts =
      scope === "department"
        ? products.filter((p) => p.category === selectedDept)
        : products.filter((p) => p.supplier === selectedSupplier);

    const scopeLabel = scope === "department" ? selectedDept : selectedSupplier;
    const signal = { cancelled: false };
    setBulkRunning(true);
    setBulkProgress(10);

    void runBulkScenarioAnalysisAsync(
      targetProducts,
      summaries,
      effectiveParams,
      scopeLabel,
      (pct) => {
        if (!signal.cancelled) setBulkProgress(pct);
      },
      signal
    ).then((res) => {
      if (!signal.cancelled) {
        setBulkSummary(res);
        setBulkProgress(100);
        setBulkRunning(false);
      }
    });

    return () => {
      signal.cancelled = true;
    };
  }, [scope, selectedDept, selectedSupplier, products, summaries, effectiveParams]);

  const handleSaveScenario = () => {
    if (!analysis) return;
    const label = scenarioName.trim() || `Scenario ${savedScenarios.length + 1}`;
    const entry: SavedScenarioEntry = {
      id: `${Date.now()}`,
      name: label,
      productName: product.name,
      params: effectiveParams,
      result: analysis,
    };
    setSavedScenarios((prev) => [entry, ...prev].slice(0, 3));
  };

  const handleReset = () => {
    setParams({
      ...DEFAULT_PARAMS,
      demandChangePct: 0,
      supplierDelayDays: 0,
      priceChangePct: 0,
      promotionActive: false,
      festivalEvent: "none",
      supplyDisruption: false,
    });
    setBudgetEnabled(false);
  };

  const SCENARIO_COLORS = chartTokens.scenarios;
  const BASELINE_COLOR = chartTokens.baseline;

  const comparisonChartData = useMemo(() => {
    if (!analysis) return [];
    const rows = [
      {
        name: t.scenarios.colBaseline,
        stockoutProb: analysis.baseline.stockoutProbabilityPct,
        serviceLevel: analysis.baseline.expectedServiceLevelPct,
        fill: BASELINE_COLOR,
      },
      {
        name: scenarioName.trim() || t.scenarios.colScenario,
        stockoutProb: analysis.scenario.stockoutProbabilityPct,
        serviceLevel: analysis.scenario.expectedServiceLevelPct,
        fill: SCENARIO_COLORS[0],
      },
    ];
    savedScenarios.forEach((sc, idx) => {
      rows.push({
        name: sc.name,
        stockoutProb: sc.result.scenario.stockoutProbabilityPct,
        serviceLevel: sc.result.scenario.expectedServiceLevelPct,
        fill: SCENARIO_COLORS[idx % SCENARIO_COLORS.length],
      });
    });
    return rows;
  }, [analysis, savedScenarios, scenarioName, t, BASELINE_COLOR, SCENARIO_COLORS]);

  return (
    <div className="space-y-6">
      {/* Scope Switcher Banner */}
      <div className="mr-card flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-3.5">
        <div
          className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F4F0E6] p-1 dark:bg-[#1A1A2E]"
          role="group"
          aria-label="Simulation scope"
        >
          <button
            type="button"
            onClick={() => setScope("single")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              scope === "single"
                ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            {t.scale.scopeSingle}
          </button>
          <button
            type="button"
            onClick={() => setScope("department")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              scope === "department"
                ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            {t.scale.scopeDepartment}
          </button>
          <button
            type="button"
            onClick={() => setScope("supplier")}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              scope === "supplier"
                ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            {t.scale.scopeSupplier}
          </button>
        </div>

        {scope !== "single" && bulkRunning && (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-medium text-[#4B3FD6] dark:text-[#8B7CFF]">
              Running async Monte Carlo...
            </span>
            <div className="h-2 w-32 overflow-hidden rounded-full bg-[#F4F0E6] dark:bg-[#1A1A2E]">
              <div
                className="h-full rounded-full bg-[#4B3FD6] transition-all dark:bg-[#E3C16F]"
                style={{ width: `${bulkProgress}%` }}
              />
            </div>
            <span className="font-mono font-semibold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
              {bulkProgress}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Interactive What-If Controls */}
        <section
          aria-label="What-if scenario parameters"
          className="mr-card rounded-xl p-6 lg:col-span-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.scenarios.title}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setScenarioName(t.scenarios.presetDiwali);
                  setParams({
                    ...DEFAULT_PARAMS,
                    demandChangePct: 20,
                    supplierDelayDays: 4,
                    festivalEvent: "diwali",
                    promotionActive: false,
                    supplyDisruption: false,
                  });
                }}
                className="rounded-md bg-[#4B3FD6]/10 px-2.5 py-1 text-[11px] font-semibold text-[#4B3FD6] hover:bg-[#4B3FD6]/16 dark:bg-[#8B7CFF]/15 dark:text-[#A99DFF] dark:hover:bg-[#8B7CFF]/25 transition-colors whitespace-nowrap"
              >
                {t.scenarios.presetDiwali}
              </button>
              <button
                type="button"
                onClick={() => {
                  setScenarioName(t.scenarios.presetShock);
                  setParams({
                    ...DEFAULT_PARAMS,
                    demandChangePct: 10,
                    supplierDelayDays: 9,
                    festivalEvent: "none",
                    promotionActive: false,
                    supplyDisruption: true,
                  });
                }}
                className="rounded-md border border-[#E5484D]/30 bg-[#E5484D]/12 px-2.5 py-1 text-[11px] font-semibold text-[#B8282D] hover:bg-[#E5484D]/18 dark:text-[#FF7A7E] dark:hover:bg-[#E5484D]/25 transition-colors whitespace-nowrap"
              >
                {t.scenarios.presetShock}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#6B6785] hover:bg-[#F4F0E6] dark:text-[#A09CB5] dark:hover:bg-[#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
              >
                <RotateCcw className="h-3 w-3" />
                {t.scenarios.reset}
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {scope === "single" ? (
              <div className="flex items-center gap-3 border-b border-[#ECE6D8] pb-3.5 dark:border-[#2A2A44]">
                <ProductAvatar src={product.imageUrl} name={product.name} size="md" />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="scenario-sku"
                    className="block text-[11px] font-semibold text-[#6B6785] dark:text-[#A09CB5]"
                  >
                    {t.scenarios.targetProduct}
                  </label>
                  <select
                    id="scenario-sku"
                    value={product.id}
                    onChange={(e) => onSelectProduct(e.target.value)}
                    className="mt-0.5 w-full rounded-md border border-[#ECE6D8] bg-[#F4F0E6] px-2.5 py-1.5 text-sm font-semibold text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="dark:bg-[#1A1A2E]">
                        {p.name} ({p.sku} · {p.currentStock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : scope === "department" ? (
              <div className="border-b border-[#ECE6D8] pb-3.5 dark:border-[#2A2A44]">
                <label
                  htmlFor="scenario-dept"
                  className="block text-[11px] font-semibold text-[#6B6785] dark:text-[#A09CB5]"
                >
                  {t.scale.scopeDepartment}
                </label>
                <select
                  id="scenario-dept"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-[#ECE6D8] bg-[#F4F0E6] px-2.5 py-1.5 text-sm font-semibold text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d} ({products.filter((p) => p.category === d).length} SKUs)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="border-b border-[#ECE6D8] pb-3.5 dark:border-[#2A2A44]">
                <label
                  htmlFor="scenario-supplier"
                  className="block text-[11px] font-semibold text-[#6B6785] dark:text-[#A09CB5]"
                >
                  {t.scale.scopeSupplier}
                </label>
                <select
                  id="scenario-supplier"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-[#ECE6D8] bg-[#F4F0E6] px-2.5 py-1.5 text-sm font-semibold text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
                >
                  {suppliers.map((s) => (
                    <option key={s} value={s}>
                      {s} ({products.filter((p) => p.supplier === s).length} SKUs)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="slider-demand" className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                  {t.scenarios.demandChange}
                </label>
                <span className="font-mono font-semibold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                  {params.demandChangePct >= 0
                    ? `+${params.demandChangePct}%`
                    : `${params.demandChangePct}%`}
                </span>
              </div>
              <input
                id="slider-demand"
                type="range"
                min={-40}
                max={80}
                step={5}
                value={params.demandChangePct}
                onChange={(e) =>
                  setParams((p) => ({ ...p, demandChangePct: Number(e.target.value) }))
                }
                className="mt-1.5 w-full accent-[#4B3FD6] dark:accent-[#8B7CFF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="slider-delay" className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                  {t.scenarios.supplierDelay}
                </label>
                <span className="font-mono font-semibold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                  +{params.supplierDelayDays}d
                </span>
              </div>
              <input
                id="slider-delay"
                type="range"
                min={0}
                max={14}
                step={1}
                value={params.supplierDelayDays}
                onChange={(e) =>
                  setParams((p) => ({ ...p, supplierDelayDays: Number(e.target.value) }))
                }
                className="mt-1.5 w-full accent-[#4B3FD6] dark:accent-[#8B7CFF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <label htmlFor="slider-price" className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                  {t.scenarios.priceChange}
                </label>
                <span className="font-mono font-semibold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                  {params.priceChangePct >= 0
                    ? `+${params.priceChangePct}%`
                    : `${params.priceChangePct}%`}
                </span>
              </div>
              <input
                id="slider-price"
                type="range"
                min={-25}
                max={25}
                step={5}
                value={params.priceChangePct}
                onChange={(e) =>
                  setParams((p) => ({ ...p, priceChangePct: Number(e.target.value) }))
                }
                className="mt-1.5 w-full accent-[#4B3FD6] dark:accent-[#8B7CFF]"
              />
            </div>

            <div>
              <label
                htmlFor="select-festival"
                className="block text-xs font-medium text-[#14112B] dark:text-[#F3EFE6]"
              >
                {t.scenarios.festivalEvent}
              </label>
              <select
                id="select-festival"
                value={params.festivalEvent}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    festivalEvent: e.target.value as FestivalEvent,
                  }))
                }
                className="mt-1 min-h-[40px] w-full rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 text-xs font-medium text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
              >
                {(Object.keys(FESTIVAL_LIFTS) as FestivalEvent[]).map((key) => (
                  <option key={key} value={key}>
                    {FESTIVAL_LIFTS[key].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5 border-t border-[#ECE6D8] pt-3 dark:border-[#2A2A44]">
              <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                  {t.scenarios.promoToggle}
                </span>
                <input
                  type="checkbox"
                  checked={params.promotionActive}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, promotionActive: e.target.checked }))
                  }
                  className="h-4 w-4 shrink-0 rounded accent-[#4B3FD6] dark:accent-[#8B7CFF]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                  {t.scenarios.disruptionToggle}
                </span>
                <input
                  type="checkbox"
                  checked={params.supplyDisruption}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, supplyDisruption: e.target.checked }))
                  }
                  className="h-4 w-4 shrink-0 rounded accent-[#E5484D]"
                />
              </label>

              <div className="space-y-2">
                <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-[#14112B] dark:text-[#F3EFE6]">
                    {t.scenarios.budgetToggle}
                  </span>
                  <input
                    type="checkbox"
                    checked={budgetEnabled}
                    onChange={(e) => setBudgetEnabled(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded accent-[#4B3FD6] dark:accent-[#8B7CFF]"
                  />
                </label>
                {budgetEnabled && (
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="range"
                      min={5000}
                      max={100000}
                      step={2500}
                      value={budgetAmount}
                      aria-label={t.scenarios.budgetToggle}
                      onChange={(e) => setBudgetAmount(Number(e.target.value))}
                      className="w-full accent-[#B8912B] dark:accent-[#E3C16F]"
                    />
                    <span className="font-mono text-xs font-semibold text-[#14112B] dark:text-[#F3EFE6] tabular-nums whitespace-nowrap">
                      ₹{budgetAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {scope === "single" && (
              <div className="flex items-center gap-2 border-t border-[#ECE6D8] pt-4 dark:border-[#2A2A44]">
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder={t.scenarios.scenarioNamePlaceholder}
                  aria-label={t.scenarios.scenarioNamePlaceholder}
                  className="min-h-[40px] flex-1 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 text-xs text-[#14112B] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
                />
                <button
                  type="button"
                  onClick={handleSaveScenario}
                  className="btn-lavish-primary inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  {t.scenarios.saveBtn} ({savedScenarios.length}/3)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right: Single-SKU vs Bulk Department/Supplier Output */}
        <div className="space-y-6 lg:col-span-7">
          {scope === "single" && analysis ? (
            <>
              <section
                aria-label="Baseline vs scenario comparison"
                className="mr-card rounded-xl p-6"
              >
                <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  {t.scenarios.comparisonTitle}
                </h2>
                <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                  {t.scenarios.comparisonSub}
                </p>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="mr-table-head">
                      <tr className="border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                        <th className="px-2 py-2.5 font-semibold">{t.scenarios.colMetric}</th>
                        <th className="px-2 py-2.5 text-right font-semibold">{t.scenarios.colBaseline}</th>
                        <th className="px-2 py-2.5 text-right font-semibold text-[#4B3FD6] dark:text-[#8B7CFF]">
                          {t.scenarios.colScenario}
                        </th>
                        <th className="px-2 py-2.5 text-right font-semibold">{t.scenarios.colDelta}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
                      <tr className="mr-zebra-row">
                        <td className="px-2 py-3 font-medium text-[#14112B] dark:text-[#F3EFE6]">
                          {t.scenarios.mStockoutProb}
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {analysis.baseline.stockoutProbabilityPct}%
                        </td>
                        <td className="px-2 py-3 text-right font-mono font-bold text-[#B8282D] dark:text-[#FF7A7E] tabular-nums">
                          {analysis.scenario.stockoutProbabilityPct}%
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {(
                            analysis.scenario.stockoutProbabilityPct -
                            analysis.baseline.stockoutProbabilityPct
                          ).toFixed(1)}
                          %
                        </td>
                      </tr>
                      <tr className="mr-zebra-row">
                        <td className="px-2 py-3 font-medium text-[#14112B] dark:text-[#F3EFE6]">
                          {t.scenarios.mServiceLevel} <HelpTip term="serviceLevel" />
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {analysis.baseline.expectedServiceLevelPct}%
                        </td>
                        <td className="px-2 py-3 text-right font-mono font-bold text-[#0F805A] dark:text-[#22C08A] tabular-nums">
                          {analysis.scenario.expectedServiceLevelPct}%
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {(
                            analysis.scenario.expectedServiceLevelPct -
                            analysis.baseline.expectedServiceLevelPct
                          ).toFixed(1)}
                          %
                        </td>
                      </tr>
                      <tr className="mr-zebra-row">
                        <td className="px-2 py-3 font-medium text-[#14112B] dark:text-[#F3EFE6]">
                          {t.scenarios.mLostSales}
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          ₹{analysis.baseline.expectedLostSalesValue.toLocaleString("en-IN")} (
                          {analysis.baseline.expectedLostSalesUnits} u)
                        </td>
                        <td className="px-2 py-3 text-right font-mono font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                          ₹{analysis.scenario.expectedLostSalesValue.toLocaleString("en-IN")} (
                          {analysis.scenario.expectedLostSalesUnits} u)
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {analysis.scenario.expectedLostSalesValue -
                            analysis.baseline.expectedLostSalesValue >=
                          0
                            ? "+"
                            : ""}
                          ₹
                          {(
                            analysis.scenario.expectedLostSalesValue -
                            analysis.baseline.expectedLostSalesValue
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="mr-zebra-row">
                        <td className="px-2 py-3 font-medium text-[#14112B] dark:text-[#F3EFE6]">
                          {t.scenarios.mHoldingCost}
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          ₹{analysis.baseline.holdingCost30d.toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-3 text-right font-mono font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                          ₹{analysis.scenario.holdingCost30d.toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {analysis.scenario.holdingCost30d - analysis.baseline.holdingCost30d >=
                          0
                            ? "+"
                            : ""}
                          ₹
                          {(
                            analysis.scenario.holdingCost30d - analysis.baseline.holdingCost30d
                          ).toLocaleString("en-IN")}
                        </td>
                      </tr>
                      <tr className="mr-zebra-row">
                        <td className="px-2 py-3 font-medium text-[#14112B] dark:text-[#F3EFE6]">
                          {t.scenarios.mRecOrder}
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {analysis.baseline.recommendedOrderQty} u
                        </td>
                        <td className="px-2 py-3 text-right font-mono font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                          {analysis.scenario.recommendedOrderQty} u
                        </td>
                        <td className="px-2 py-3 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                          {analysis.scenario.recommendedOrderQty -
                            analysis.baseline.recommendedOrderQty >=
                          0
                            ? "+"
                            : ""}
                          {analysis.scenario.recommendedOrderQty -
                            analysis.baseline.recommendedOrderQty}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                aria-label="Monte Carlo distribution chart"
                className="mr-card-featured rounded-xl p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="flex items-center font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                      {t.scenarios.mcTitle}
                      <HelpTip term="monteCarlo" />
                    </h2>
                    <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                      {t.scenarios.mcSub}
                    </p>
                  </div>
                  <div className="font-mono text-xs text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                    P5: {analysis.scenario.p5EndingStock} · Median: {analysis.scenario.p50EndingStock} · P95:{" "}
                    {analysis.scenario.p95EndingStock}
                  </div>
                </div>

                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analysis.histogram}
                      margin={{ top: 8, right: 10, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke={chartTokens.gridStroke}
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: chartTokens.axisTick }}
                        interval={1}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                        width={38}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const b = payload[0].payload as (typeof analysis.histogram)[number];
                          return (
                            <div
                              style={chartTokens.tooltipStyle}
                              className="p-2.5 text-xs"
                            >
                              <p className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                                {b.label} u
                              </p>
                              <p className="mt-1 font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                                {b.frequency} / 1,000 ({((b.frequency / 1000) * 100).toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="frequency" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                        {analysis.histogram.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={entry.isStockout ? chartTokens.anomaly : chartTokens.historical}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          ) : (
            <section
              aria-label="Bulk Department or Supplier Monte Carlo Summary"
              className="mr-card rounded-xl p-6"
            >
              <div>
                <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  Bulk Stress Test: {bulkSummary?.scopeLabel ?? "Computing..."}
                </h2>
                <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                  Asynchronous 400-trial Monte Carlo per SKU across {bulkSummary?.skuCount ?? 0} products
                </p>
              </div>

              {bulkSummary && (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] p-3 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/70">
                      <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                        Avg Stockout Risk
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-[#B8282D] dark:text-[#FF7A7E] tabular-nums">
                        {bulkSummary.avgScenarioStockoutProb}%
                      </p>
                      <p className="font-mono text-[10px] text-[#6B6785] dark:text-[#A09CB5]">
                        Base: {bulkSummary.avgBaselineStockoutProb}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] p-3 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/70">
                      <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                        Avg Service Level
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-[#0F805A] dark:text-[#22C08A] tabular-nums">
                        {bulkSummary.avgScenarioServiceLevel}%
                      </p>
                      <p className="font-mono text-[10px] text-[#6B6785] dark:text-[#A09CB5]">
                        Base: {bulkSummary.avgBaselineServiceLevel}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] p-3 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/70">
                      <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                        Total Lost Sales
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                        ₹{bulkSummary.totalExpectedLostSalesValue.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] p-3 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/70">
                      <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                        Total Rec. PO Spend
                      </p>
                      <p className="mt-1 font-mono text-lg font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                        ₹{bulkSummary.totalRecommendedOrderCost.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="mr-table-head sticky top-0 z-10">
                        <tr className="border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                          <th className="px-2 py-2.5 font-semibold">{t.dashboard.colProduct}</th>
                          <th className="px-2 py-2.5 text-right font-semibold">Base Risk</th>
                          <th className="px-2 py-2.5 text-right font-semibold">Scenario Risk</th>
                          <th className="px-2 py-2.5 text-right font-semibold">Lost Sales</th>
                          <th className="px-2 py-2.5 text-right font-semibold">Rec. Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
                        {bulkSummary.items.map((item) => (
                          <tr key={item.productId} className="mr-zebra-row">
                            <td className="px-2 py-2.5">
                              <p className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                                {item.productName}
                              </p>
                              <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                                {item.sku} · {item.supplier}
                              </p>
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono tabular-nums text-[#6B6785] dark:text-[#A09CB5]">
                              {item.baselineStockoutProb}%
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono font-bold tabular-nums text-[#B8282D] dark:text-[#FF7A7E]">
                              {item.scenarioStockoutProb}%
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono tabular-nums text-[#14112B] dark:text-[#F3EFE6]">
                              ₹{item.expectedLostSalesValue.toLocaleString("en-IN")}
                            </td>
                            <td className="px-2 py-2.5 text-right font-mono font-semibold tabular-nums text-[#4B3FD6] dark:text-[#8B7CFF]">
                              {item.recommendedOrderQty} u
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Saved Scenarios Comparison Matrix (Single SKU Mode) */}
      {scope === "single" && (
        <section
          aria-label="Saved scenarios comparison"
          className="mr-card rounded-xl p-6"
        >
          <div>
            <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.scenarios.savedTitle}
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {t.scenarios.savedSub}
            </p>
          </div>

          <div className="mt-4 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonChartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={chartTokens.gridStroke} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  formatter={(val) => [`${val}%`, t.scenarios.mServiceLevel]}
                  contentStyle={chartTokens.tooltipStyle}
                />
                <Bar
                  dataKey="serviceLevel"
                  radius={[5, 5, 0, 0]}
                  barSize={32}
                  isAnimationActive={false}
                >
                  {comparisonChartData.map((entry, idx) => (
                    <Cell key={`comp-${idx}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {savedScenarios.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#ECE6D8] p-6 text-center text-xs text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
              {t.scenarios.savedEmpty}
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {savedScenarios.map((sc, idx) => {
                const scColor = SCENARIO_COLORS[idx % SCENARIO_COLORS.length];
                return (
                  <div
                    key={sc.id}
                    className="rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/50 p-4 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-xs"
                          style={{ backgroundColor: scColor }}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
                            {sc.name}
                          </p>
                          <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                            {sc.productName}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete scenario ${sc.name}`}
                        onClick={() =>
                          setSavedScenarios((prev) => prev.filter((x) => x.id !== sc.id))
                        }
                        className="rounded p-1 text-[#6B6785] hover:bg-[#ECE6D8]/60 hover:text-[#E5484D] dark:text-[#A09CB5] dark:hover:bg-[#12121F]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <dl className="mt-3 space-y-1.5 border-t border-[#ECE6D8] pt-3 text-xs dark:border-[#2A2A44]">
                      <div className="flex justify-between">
                        <dt className="text-[#6B6785] dark:text-[#A09CB5]">
                          {t.scenarios.mStockoutProb}
                        </dt>
                        <dd className="font-mono font-semibold text-[#B8282D] dark:text-[#FF7A7E] tabular-nums">
                          {sc.result.scenario.stockoutProbabilityPct}%
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#6B6785] dark:text-[#A09CB5]">
                          {t.scenarios.mServiceLevel}
                        </dt>
                        <dd className="font-mono font-semibold text-[#0F805A] dark:text-[#22C08A] tabular-nums">
                          {sc.result.scenario.expectedServiceLevelPct}%
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#6B6785] dark:text-[#A09CB5]">
                          {t.scenarios.mLostSales}
                        </dt>
                        <dd className="font-mono tabular-nums text-[#14112B] dark:text-[#F3EFE6]">
                          ₹{sc.result.scenario.expectedLostSalesValue.toLocaleString("en-IN")}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[#6B6785] dark:text-[#A09CB5]">
                          {t.scenarios.mRecOrder}
                        </dt>
                        <dd className="font-mono font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                          {sc.result.scenario.recommendedOrderQty} u
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
