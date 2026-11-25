import React, { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  CheckCircle2,
  GitCompare,
  Search,
  ShieldAlert,
  TrendingUp,
  X,
} from "lucide-react";
import {
  ALL_DEPARTMENTS,
  AnomalyAlert,
  ForecastResult,
  Product,
  ProductSummary,
} from "../types/inventory";
import { forecastProduct } from "../lib/forecasting";
import { HelpTip } from "./HelpTip";
import { ProductAvatar } from "./ProductAvatar";
import { useLanguage } from "../lib/LanguageContext";
import { getChartTokens, getDepartmentColor, useCountUp } from "../lib/themeTokens";

interface ForecastsViewProps {
  products: Product[];
  summaries: Map<string, ProductSummary>;
  selectedProductId: string;
  onSelectProduct: (id: string) => void;
  horizonWeeks: 4 | 8 | 12;
  onChangeHorizon: (h: 4 | 8 | 12) => void;
  forecast: ForecastResult;
  excludedOutlierKeys: Set<string>;
  anomalies?: AnomalyAlert[];
  darkMode: boolean;
}

export const ForecastsView: React.FC<ForecastsViewProps> = ({
  products,
  summaries,
  selectedProductId,
  onSelectProduct,
  horizonWeeks,
  onChangeHorizon,
  forecast,
  excludedOutlierKeys,
  anomalies = [],
  darkMode,
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [skuSearch, setSkuSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    const defaults = [
      selectedProductId,
      "bottled-water-1l",
      "regular-fit-jeans",
      "memory-card-64gb",
    ].filter((id) => products.some((p) => p.id === id));
    const unique = Array.from(new Set(defaults));
    for (const p of products) {
      if (unique.length >= 3) break;
      if (!unique.includes(p.id)) unique.push(p.id);
    }
    return unique.slice(0, 4);
  });

  const chartTokens = useMemo(() => getChartTokens(darkMode), [darkMode]);
  const compareColors = useMemo(
    () => [
      chartTokens.historical,
      chartTokens.scenarios[0],
      chartTokens.scenarios[1],
      chartTokens.scenarios[2],
    ],
    [chartTokens]
  );

  const product = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? products[0],
    [products, selectedProductId]
  );

  const productAnomalies = useMemo(
    () => anomalies.filter((a) => a.productId === product.id),
    [anomalies, product.id]
  );

  const animHorizonDemand = useCountUp(forecast.nextHorizonDemand, 420);
  const animWape = useCountUp(forecast.wape, 380);

  const filteredPickerProducts = useMemo(() => {
    const q = skuSearch.trim().toLowerCase();
    return products
      .filter((p) => {
        if (deptFilter !== "All" && p.category !== deptFilter) return false;
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
      .slice(0, 16);
  }, [products, skuSearch, deptFilter]);

  const chartData = useMemo(() => {
    const hist = forecast.weeklySeries.filter((w) => !w.isForecast);
    const future = forecast.weeklySeries.filter((w) => w.isForecast);
    const recentHist = hist.slice(-26);
    const combined = [...recentHist, ...future];

    return combined.map((pt, idx) => {
      const nextWeekStart = combined[idx + 1]?.weekStart ?? "9999-12-31";
      const matchedAnomaly = !pt.isForecast
        ? productAnomalies.find(
            (a) => a.date >= pt.weekStart && a.date < nextWeekStart
          )
        : undefined;

      const l95 = pt.low95 ?? null;
      const h95 = pt.high95 ?? null;
      const l80 = pt.low80 ?? null;
      const h80 = pt.high80 ?? null;
      return {
        ...pt,
        band95Base: l95,
        band95Span: l95 !== null && h95 !== null ? Math.max(0, h95 - l95) : null,
        band80Base: l80,
        band80Span: l80 !== null && h80 !== null ? Math.max(0, h80 - l80) : null,
        anomalyTitle: matchedAnomaly?.title,
        anomalyReason: matchedAnomaly?.whyFlagged,
      };
    });
  }, [forecast, productAnomalies]);

  const anomalyDots = useMemo(
    () =>
      chartData.filter(
        (pt) => Boolean(pt.anomalyReason) && pt.actual !== null
      ),
    [chartData]
  );

  const splitWeekLabel = useMemo(() => {
    const hist = forecast.weeklySeries.filter((w) => !w.isForecast);
    return hist.length > 0 ? hist[hist.length - 1].weekLabel : undefined;
  }, [forecast]);

  const forecastRows = useMemo(
    () => forecast.weeklySeries.filter((w) => w.isForecast),
    [forecast]
  );

  const compareItems = useMemo(() => {
    if (mode !== "compare") return [];
    return compareIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 4)
      .map((p, idx) => {
        const excluded = new Set<string>();
        const prefix = `${p.id}::`;
        excludedOutlierKeys.forEach((k) => {
          if (k.startsWith(prefix)) excluded.add(k.slice(prefix.length));
        });
        const fc =
          p.id === product.id
            ? forecast
            : forecastProduct(p, horizonWeeks, excluded);
        const sum = summaries.get(p.id);
        return {
          product: p,
          forecast: fc,
          summary: sum,
          color: compareColors[idx % compareColors.length],
        };
      });
  }, [
    mode,
    compareIds,
    products,
    product.id,
    forecast,
    horizonWeeks,
    excludedOutlierKeys,
    summaries,
    compareColors,
  ]);

  const compareChartData = useMemo(() => {
    if (compareItems.length === 0) return [];
    const weekMap = new Map<
      string,
      { weekStart: string; weekLabel: string; [key: string]: string | number | null }
    >();

    compareItems.forEach((item, idx) => {
      const hist = item.forecast.weeklySeries.filter((w) => !w.isForecast).slice(-16);
      const fut = item.forecast.weeklySeries.filter((w) => w.isForecast);
      for (const pt of [...hist, ...fut]) {
        const entry = weekMap.get(pt.weekStart) ?? {
          weekStart: pt.weekStart,
          weekLabel: pt.weekLabel,
        };
        const value = pt.isForecast ? pt.forecast : pt.actual;
        entry[`sku_${idx}`] = value;
        weekMap.set(pt.weekStart, entry);
      }
    });

    return Array.from(weekMap.values()).sort((a, b) =>
      a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : 0
    );
  }, [compareItems]);

  const toggleCompareSku = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const activeSum = summaries.get(product.id);

  return (
    <div className="space-y-6">
      {/* Top Control Bar: Mode Toggle + Horizon + Searchable Picker */}
      <div className="mr-card rounded-xl p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <ProductAvatar src={product.imageUrl} name={product.name} size="lg" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  id="forecast-product-select"
                  aria-label="Select product to forecast"
                  value={product.id}
                  onChange={(e) => onSelectProduct(e.target.value)}
                  className="min-h-[38px] max-w-xs rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-sm font-semibold text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:focus:border-[#8B7CFF]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                {activeSum && (
                  <span className="font-mono text-xs font-bold text-[#4B3FD6] dark:text-[#8B7CFF]">
                    {activeSum.abcXyz}
                  </span>
                )}
              </div>
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: getDepartmentColor(product.category) }}
                  aria-hidden="true"
                />
                <span>
                  {product.category} · {forecast.historyWeeksCount} {t.forecasts.wksHistory} ·{" "}
                  {t.forecasts.retail} ₹{product.sellingPrice} · {t.forecasts.cost} ₹
                  {product.unitCost}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-1 rounded-lg bg-[#F4F0E6] p-1 dark:bg-[#1A1A2E]"
              role="group"
              aria-label="Forecast view mode"
            >
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === "single"
                    ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                    : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {t.scale.singleMode}
              </button>
              <button
                type="button"
                onClick={() => setMode("compare")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === "compare"
                    ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                    : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
                }`}
              >
                <GitCompare className="h-3.5 w-3.5" />
                {t.scale.compareMode}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6B6785] dark:text-[#A09CB5] whitespace-nowrap">
                {t.forecasts.horizon}
              </span>
              <div
                className="flex items-center gap-1 rounded-lg bg-[#F4F0E6] p-1 dark:bg-[#1A1A2E]"
                role="group"
                aria-label={t.forecasts.horizon}
              >
                {([4, 8, 12] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onChangeHorizon(h)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap ${
                      horizonWeeks === h
                        ? "bg-white text-[#4B3FD6] shadow-xs dark:bg-[#12121F] dark:text-[#8B7CFF]"
                        : "text-[#6B6785] hover:text-[#14112B] dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
                    }`}
                  >
                    {h} {t.forecasts.weeksUnit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Searchable SKU Quick-Picker */}
        <div className="mt-4 border-t border-[#ECE6D8] pt-4 dark:border-[#2A2A44]">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6785] dark:text-[#A09CB5]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={skuSearch}
                onChange={(e) => setSkuSearch(e.target.value)}
                placeholder={t.dashboard.searchPlaceholder}
                aria-label={t.dashboard.searchPlaceholder}
                className="min-h-[34px] w-52 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 pl-8 pr-3 text-xs text-[#14112B] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              aria-label={t.dashboard.allCategories}
              className="min-h-[34px] rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/60 px-3 text-xs font-medium text-[#14112B] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6]"
            >
              <option value="All">{t.dashboard.allCategories}</option>
              {ALL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {mode === "compare" && (
              <span className="text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                {t.scale.compareLimitNote} ({compareIds.length}/4)
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filteredPickerProducts.map((p) => {
              const isSelected =
                mode === "single"
                  ? p.id === product.id
                  : compareIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    mode === "single"
                      ? onSelectProduct(p.id)
                      : toggleCompareSku(p.id)
                  }
                  className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] ${
                    isSelected
                      ? "border-[#4B3FD6] bg-[#4B3FD6]/10 text-[#4B3FD6] dark:border-[#8B7CFF] dark:bg-[#1A1A2E] dark:text-[#8B7CFF]"
                      : "border-[#ECE6D8] bg-[#F4F0E6]/50 text-[#6B6785] hover:border-[#B8912B]/55 hover:text-[#14112B] dark:border-[#2A2A44] dark:bg-[#1A1A2E]/60 dark:text-[#A09CB5] dark:hover:text-[#F3EFE6]"
                  }`}
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-5 w-5 rounded-sm object-cover"
                  />
                  <span className="max-w-[130px] truncate">{p.name}</span>
                  <span className="font-mono text-[10px] opacity-75">{p.sku}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {mode === "compare" ? (
        <div className="space-y-6">
          <section className="mr-card-featured rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  Multi-SKU Demand Trajectory Comparison ({compareItems.length}/4)
                </h2>
                <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                  Recent 16 actual weeks + {horizonWeeks}-week forecast horizon across compared products
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {compareItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6]/70 px-2.5 py-1 text-xs dark:border-[#2A2A44] dark:bg-[#1A1A2E]"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                      {item.product.name}
                    </span>
                    {compareItems.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remove ${item.product.name} from comparison`}
                        onClick={() => toggleCompareSku(item.product.id)}
                        className="text-[#6B6785] hover:text-[#E5484D] dark:text-[#A09CB5]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={compareChartData}
                  margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke={chartTokens.gridStroke}
                  />
                  <XAxis
                    dataKey="weekLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                    width={44}
                  />
                  <Tooltip contentStyle={chartTokens.tooltipStyle} />
                  {splitWeekLabel && (
                    <ReferenceLine
                      x={splitWeekLabel}
                      stroke={chartTokens.baseline}
                      strokeDasharray="4 4"
                      label={{
                        value: "Today",
                        position: "top",
                        fill: chartTokens.axisTick,
                        fontSize: 11,
                      }}
                    />
                  )}
                  {compareItems.map((item, idx) => (
                    <Line
                      key={item.product.id}
                      type="monotone"
                      dataKey={`sku_${idx}`}
                      name={item.product.name}
                      stroke={item.color}
                      strokeWidth={2.4}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Side-by-side Metrics Table */}
          <section className="mr-card rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="mr-table-head sticky top-0 border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                    <th className="px-5 py-3 font-semibold">{t.dashboard.colProduct}</th>
                    <th className="px-4 py-3 font-semibold">ABC-XYZ</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 text-right font-semibold">WAPE</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      {horizonWeeks}w Demand
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">Stock / Cover</th>
                    <th className="px-4 py-3 text-right font-semibold">Rec. Order (MOQ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
                  {compareItems.map(({ product: p, forecast: fc, summary: sum, color }) => (
                    <tr key={p.id} className="mr-zebra-row">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-1 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <ProductAvatar src={p.imageUrl} name={p.name} size="sm" />
                          <div>
                            <p className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                              {p.name}
                            </p>
                            <p className="flex items-center gap-1.5 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: getDepartmentColor(p.category) }}
                              />
                              {p.sku} · {p.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-[#4B3FD6] dark:text-[#8B7CFF]">
                        {sum?.abcXyz ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#6B6785] dark:text-[#A09CB5]">
                        {fc.method} ({fc.confidence})
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        {fc.wape}%
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums">
                        {fc.nextHorizonDemand.toLocaleString("en-IN")} u
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                        {p.currentStock} u ({sum?.daysOfCover ?? "—"}d)
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold tabular-nums text-[#4B3FD6] dark:text-[#8B7CFF]">
                        {sum ? `+${sum.recommendedOrderQty}` : "—"} ({p.moq} MOQ)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <>
          {/* Forecast Summary & Backtest Accuracy Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="mr-card rounded-xl p-5">
              <p className="text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                {horizonWeeks}-{t.forecasts.nextDemandTitle}
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                {Math.round(animHorizonDemand).toLocaleString("en-IN")} u
              </p>
              <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                {forecast.weeklyAvgForecast}/wk · {forecast.dailyAvgForecast}/day
              </p>
            </div>

            <div className="mr-card rounded-xl p-5">
              <div className="flex items-center text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                <span>{t.forecasts.backtestErrorTitle}</span>
                <HelpTip term="wape" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                {animWape.toFixed(1)}% WAPE
              </p>
              <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                MAPE: {forecast.mape}% · {forecast.backtestWeeks} {t.forecasts.weeksUnit}
              </p>
            </div>

            <div className="mr-card rounded-xl p-5">
              <p className="text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                {t.forecasts.confidenceTitle}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {forecast.confidence === "High" && (
                  <CheckCircle2 className="h-5 w-5 text-[#22C08A]" />
                )}
                {forecast.confidence === "Medium" && (
                  <AlertCircle className="h-5 w-5 text-[#F5A524]" />
                )}
                {forecast.confidence === "Low" && (
                  <ShieldAlert className="h-5 w-5 text-[#E5484D]" />
                )}
                <p className="font-display text-2xl font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  {forecast.confidence}
                </p>
              </div>
              <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                {forecast.method}
              </p>
            </div>

            <div className="mr-card rounded-xl p-5">
              <p className="text-xs font-medium text-[#6B6785] dark:text-[#A09CB5]">
                {t.forecasts.hygieneTitle}
              </p>
              <p className="mt-2 font-display text-2xl font-bold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                {forecast.zeroSalesDaysCount} {t.forecasts.zeroDays}
              </p>
              <p className="mt-1 text-xs text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                {forecast.excludedOutliersCount} {t.forecasts.winsorized}
              </p>
            </div>
          </div>

          {/* Chart + Confidence Reasons */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section
              aria-label="Historical vs Forecast chart with 80% and 95% prediction intervals"
              className="mr-card-featured rounded-xl p-6 lg:col-span-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                    {t.forecasts.chartTitle} ({horizonWeeks} {t.forecasts.weeksUnit})
                  </h2>
                  <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
                    {t.forecasts.chartSub}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#6B6785] dark:text-[#A09CB5]">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="h-0.5 w-3.5"
                      style={{ backgroundColor: chartTokens.historical }}
                      aria-hidden="true"
                    />
                    {t.forecasts.legendActual}
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="h-0.5 w-3.5 border-t-2 border-dashed"
                      style={{ borderColor: chartTokens.forecast }}
                      aria-hidden="true"
                    />
                    {t.forecasts.legendForecast}
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="h-2.5 w-2.5 rounded-xs"
                      style={{ backgroundColor: chartTokens.band80Fill }}
                      aria-hidden="true"
                    />
                    {t.forecasts.legend80}
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="h-2.5 w-2.5 rounded-xs"
                      style={{ backgroundColor: chartTokens.band95Fill }}
                      aria-hidden="true"
                    />
                    {t.forecasts.legend95}
                  </span>
                  {anomalyDots.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[#B4232C] dark:text-[#FF7D82]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#E5484D]" aria-hidden="true" />
                      Anomaly
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke={chartTokens.gridStroke}
                    />
                    <XAxis
                      dataKey="weekLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                      minTickGap={22}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: chartTokens.axisTick }}
                      width={44}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const row = payload[0]?.payload as (typeof chartData)[number];
                        return (
                          <div style={chartTokens.tooltipStyle} className="max-w-xs p-3 text-xs">
                            <p className="font-semibold text-[#14112B] dark:text-[#F3EFE6]">
                              Week of {label} ({row.weekStart})
                            </p>
                            {row.actual !== null && (
                              <p className="mt-1 font-mono text-[#4B3FD6] dark:text-[#8B7CFF] tabular-nums">
                                Actual Sold: {row.actual} units
                              </p>
                            )}
                            {row.anomalyReason && (
                              <div className="mt-1.5 rounded-md border border-[#E5484D]/50 bg-[#E5484D]/12 px-2 py-1 text-[11px] text-[#B4232C] dark:text-[#FF7D82]">
                                <span className="font-bold">Why flagged:</span> {row.anomalyTitle} —{" "}
                                {row.anomalyReason}
                              </div>
                            )}
                            {row.isForecast && row.forecast !== null && (
                              <>
                                <p className="mt-1 font-mono font-semibold text-[#B8912B] dark:text-[#E3C16F] tabular-nums">
                                  Expected Forecast: {row.forecast} units
                                </p>
                                <p className="mt-0.5 font-mono text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                                  80% Range: {row.low80}–{row.high80} units
                                </p>
                                <p className="mt-0.5 font-mono text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                                  95% Range: {row.low95}–{row.high95} units
                                </p>
                              </>
                            )}
                          </div>
                        );
                      }}
                    />

                    {splitWeekLabel && (
                      <ReferenceLine
                        x={splitWeekLabel}
                        stroke={chartTokens.baseline}
                        strokeDasharray="4 4"
                        label={{
                          value: "Today",
                          position: "top",
                          fill: chartTokens.axisTick,
                          fontSize: 11,
                        }}
                      />
                    )}

                    <Area
                      type="monotone"
                      dataKey="band95Base"
                      stackId="b95"
                      stroke="none"
                      fill="transparent"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="band95Span"
                      stackId="b95"
                      stroke="none"
                      fill={chartTokens.forecast}
                      fillOpacity={0.1}
                      name="95% Interval"
                      isAnimationActive={false}
                    />

                    <Area
                      type="monotone"
                      dataKey="band80Base"
                      stackId="b80"
                      stroke="none"
                      fill="transparent"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="band80Span"
                      stackId="b80"
                      stroke="none"
                      fill={chartTokens.forecast}
                      fillOpacity={0.22}
                      name="80% Interval"
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke={chartTokens.historical}
                      strokeWidth={2.4}
                      dot={false}
                      name="Actual Sales"
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke={chartTokens.forecast}
                      strokeWidth={2.5}
                      strokeDasharray="6 4"
                      dot={{ r: 3, fill: chartTokens.forecast }}
                      name="Forecast"
                      connectNulls={false}
                    />
                    {anomalyDots.map((pt) => (
                      <ReferenceDot
                        key={pt.weekStart}
                        x={pt.weekLabel}
                        y={pt.actual as number}
                        r={5}
                        fill="#E5484D"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section
              aria-label="Confidence assessment and weekly breakdown"
              className="mr-card flex flex-col justify-between gap-6 rounded-xl p-6 lg:col-span-4"
            >
              <div>
                <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  {t.forecasts.whyConfidence} {forecast.confidence}
                </h2>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#6B6785] dark:text-[#A09CB5]">
                  {forecast.confidenceReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span
                        className="font-mono text-[#B8912B] dark:text-[#E3C16F]"
                        aria-hidden="true"
                      >
                        —
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#ECE6D8] pt-4 dark:border-[#2A2A44]">
                <h3 className="font-display text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  {t.forecasts.weeklySchedule}
                </h3>
                <div className="mt-2 max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="mr-table-head sticky top-0 border-b border-[#ECE6D8] text-[#6B6785] dark:border-[#2A2A44] dark:text-[#A09CB5]">
                        <th className="py-1.5 font-medium">{t.forecasts.colWeek}</th>
                        <th className="py-1.5 text-right font-medium">{t.forecasts.colPoint}</th>
                        <th className="py-1.5 text-right font-medium">{t.forecasts.colBand80}</th>
                        <th className="py-1.5 text-right font-medium">{t.forecasts.colBand95}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE6D8] dark:divide-[#2A2A44]">
                      {forecastRows.map((row) => (
                        <tr key={row.weekStart} className="mr-zebra-row">
                          <td className="py-1.5 font-medium text-[#14112B] dark:text-[#F3EFE6]">
                            {row.weekLabel}
                          </td>
                          <td className="py-1.5 text-right font-mono font-semibold text-[#B8912B] dark:text-[#E3C16F] tabular-nums">
                            {row.forecast}
                          </td>
                          <td className="py-1.5 text-right font-mono text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                            {row.low80}–{row.high80}
                          </td>
                          <td className="py-1.5 text-right font-mono text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                            {row.low95}–{row.high95}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
