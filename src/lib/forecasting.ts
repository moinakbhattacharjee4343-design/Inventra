import {
  AbcClass,
  ConfidenceLevel,
  DailySaleRecord,
  ForecastResult,
  Product,
  ProductSummary,
  WeeklyPoint,
  XyzClass,
} from "../types/inventory";
import { buildProductSummary, optimizeProductInventory } from "./inventoryMath";

interface WeeklyBucket {
  weekStart: string;
  weekLabel: string;
  total: number;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fastWeekLabel(isoDate: string): string {
  const m = Number(isoDate.slice(5, 7)) - 1;
  const d = Number(isoDate.slice(8, 10));
  return `${MONTH_SHORT[m] ?? "Jan"} ${d}`;
}

/**
 * Fast ISO-week aggregation avoiding heavy Intl/toLocaleDateString per row across 73k rows.
 */
function aggregateDailyToWeekly(
  dailySales: DailySaleRecord[],
  excludedDates: Set<string>
): {
  weeks: WeeklyBucket[];
  zeroSalesDaysCount: number;
  excludedCount: number;
} {
  if (dailySales.length === 0) {
    return { weeks: [], zeroSalesDaysCount: 0, excludedCount: 0 };
  }

  let medianDaily = 0;
  if (excludedDates.size > 0) {
    const valid = dailySales
      .filter((r) => !excludedDates.has(r.date) && r.unitsSold >= 0)
      .map((r) => r.unitsSold)
      .sort((a, b) => a - b);
    medianDaily = valid.length > 0 ? valid[Math.floor(valid.length / 2)] : 0;
  }

  let zeroSalesDaysCount = 0;
  let excludedCount = 0;
  const bucketMap = new Map<string, number>();

  for (let i = 0; i < dailySales.length; i++) {
    const rec = dailySales[i];
    if (rec.unitsSold === 0) zeroSalesDaysCount++;
    let value = rec.unitsSold > 0 ? rec.unitsSold : 0;
    if (excludedDates.size > 0 && excludedDates.has(rec.date)) {
      value = medianDaily;
      excludedCount++;
    }

    const dt = new Date(`${rec.date}T00:00:00`);
    const day = dt.getDay();
    const diffToMon = (day + 6) % 7;
    dt.setDate(dt.getDate() - diffToMon);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const weekStart = `${y}-${m}-${d}`;
    bucketMap.set(weekStart, (bucketMap.get(weekStart) ?? 0) + value);
  }

  const weeks = Array.from(bucketMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([weekStart, total]) => ({
      weekStart,
      weekLabel: fastWeekLabel(weekStart),
      total: Math.round(total),
    }));

  return { weeks, zeroSalesDaysCount, excludedCount };
}

function fitAndForecastHoltWinters(
  values: number[],
  horizon: number
): {
  fitted: number[];
  forecasts: number[];
  residualStd: number;
} {
  const n = values.length;
  const seasonLen = n >= 56 ? 52 : 4;

  const globalMean = Math.max(
    1,
    values.reduce((acc, v) => acc + v, 0) / Math.max(1, n)
  );
  const seasonSums = new Array<number>(seasonLen).fill(0);
  const seasonCounts = new Array<number>(seasonLen).fill(0);

  for (let i = 0; i < n; i++) {
    seasonSums[i % seasonLen] += values[i];
    seasonCounts[i % seasonLen] += 1;
  }

  const rawSeasonal = seasonSums.map((sum, idx) =>
    seasonCounts[idx] > 0 ? sum / seasonCounts[idx] / globalMean : 1
  );

  const seasonal = rawSeasonal.map((_, idx) => {
    const prev = rawSeasonal[(idx - 1 + seasonLen) % seasonLen];
    const curr = rawSeasonal[idx];
    const next = rawSeasonal[(idx + 1) % seasonLen];
    const smoothed = 0.2 * prev + 0.6 * curr + 0.2 * next;
    return Math.min(2.2, Math.max(0.45, smoothed));
  });

  const deseasonalized = values.map((v, i) => v / seasonal[i % seasonLen]);
  const alpha = 0.28;
  const beta = 0.08;

  let level = deseasonalized[0];
  let trend =
    n >= 6
      ? (deseasonalized[Math.min(5, n - 1)] - deseasonalized[0]) /
        Math.min(5, n - 1)
      : 0;
  trend = Math.max(-level * 0.03, Math.min(level * 0.03, trend));

  const fitted: number[] = new Array(n);
  let residualSqSum = 0;

  for (let i = 0; i < n; i++) {
    const s = seasonal[i % seasonLen];
    const yhat = Math.max(0, (level + trend) * s);
    fitted[i] = yhat;
    const err = values[i] - yhat;
    residualSqSum += err * err;

    const prevLevel = level;
    level = alpha * deseasonalized[i] + (1 - alpha) * (level + trend);
    trend = 0.92 * (beta * (level - prevLevel) + (1 - beta) * trend);
  }

  const forecasts: number[] = new Array(horizon);
  let dampFactor = 0;
  for (let h = 1; h <= horizon; h++) {
    dampFactor += Math.pow(0.92, h);
    const s = seasonal[(n + h - 1) % seasonLen];
    forecasts[h - 1] = Math.max(0, (level + dampFactor * trend) * s);
  }

  const residualStd = Math.sqrt(
    Math.max(1, residualSqSum / Math.max(1, n - 2))
  );

  return { fitted, forecasts, residualStd };
}

function fitAndForecastMovingAverage(
  values: number[],
  horizon: number
): {
  fitted: number[];
  forecasts: number[];
  residualStd: number;
} {
  const n = values.length;
  const window = Math.min(4, Math.max(1, n));
  const fitted: number[] = new Array(n);
  let residualSqSum = 0;

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - window);
    let sum = 0;
    const count = i - start;
    for (let j = start; j < i; j++) sum += values[j];
    const yhat = count > 0 ? sum / count : values[i];
    fitted[i] = yhat;
    const err = values[i] - yhat;
    residualSqSum += err * err;
  }

  const recentSlice = values.slice(-window);
  let weightSum = 0;
  let weightedTotal = 0;
  recentSlice.forEach((v, idx) => {
    const w = idx + 1;
    weightedTotal += v * w;
    weightSum += w;
  });
  const baseLevel = weightSum > 0 ? weightedTotal / weightSum : 0;

  const forecasts = Array.from({ length: horizon }, () =>
    Math.max(0, baseLevel)
  );
  const variance = residualSqSum / Math.max(1, n - 1);
  const residualStd = Math.max(baseLevel * 0.22, Math.sqrt(variance));

  return { fitted, forecasts, residualStd };
}

function runBacktest(
  values: number[],
  useHoltWinters: boolean
): { mape: number; wape: number; backtestWeeks: number } {
  const n = values.length;
  const backtestWeeks =
    n >= 28 ? 8 : n >= 10 ? 4 : Math.max(1, Math.floor(n / 3));

  if (n < 4) {
    return { mape: 28, wape: 25, backtestWeeks: 1 };
  }

  const train = values.slice(0, n - backtestWeeks);
  const test = values.slice(n - backtestWeeks);

  const model = useHoltWinters
    ? fitAndForecastHoltWinters(train, backtestWeeks)
    : fitAndForecastMovingAverage(train, backtestWeeks);

  let absErrorSum = 0;
  let actualSum = 0;
  let apeSum = 0;
  let apeCount = 0;

  for (let i = 0; i < test.length; i++) {
    const actual = test[i];
    const pred = model.forecasts[i] ?? 0;
    const err = Math.abs(actual - pred);
    absErrorSum += err;
    actualSum += actual;
    if (actual > 0) {
      apeSum += err / actual;
      apeCount++;
    }
  }

  const wape = actualSum > 0 ? (absErrorSum / actualSum) * 100 : 25;
  const mape = apeCount > 0 ? (apeSum / apeCount) * 100 : wape;

  return {
    mape: Number(Math.min(99, mape).toFixed(1)),
    wape: Number(Math.min(99, wape).toFixed(1)),
    backtestWeeks,
  };
}

function computeWeeklyCov(weeklyValues: number[]): number {
  const slice = weeklyValues.slice(-26);
  if (slice.length < 2) return 0.5;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  if (mean <= 0.1) return 1.2;
  const variance =
    slice.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / (slice.length - 1);
  return Number((Math.sqrt(variance) / mean).toFixed(2));
}

/**
 * Full single-SKU forecast with full 104-week weekly series + 80%/95% bands.
 * Computed lazily for the open/compared SKU(s).
 */
export function forecastProduct(
  product: Product,
  horizonWeeks: 4 | 8 | 12 = 8,
  excludedOutlierDates: Set<string> = new Set()
): ForecastResult {
  const { weeks, zeroSalesDaysCount, excludedCount } = aggregateDailyToWeekly(
    product.dailySales,
    excludedOutlierDates
  );

  const values = weeks.map((w) => w.total);
  const historyWeeksCount = weeks.length;
  const useHoltWinters = historyWeeksCount >= 16;

  const model = useHoltWinters
    ? fitAndForecastHoltWinters(values, horizonWeeks)
    : fitAndForecastMovingAverage(values, horizonWeeks);

  const backtest = runBacktest(values, useHoltWinters);

  const lastWeekDate =
    weeks.length > 0
      ? new Date(`${weeks[weeks.length - 1].weekStart}T00:00:00`)
      : new Date("2026-11-23T00:00:00");

  const historicalPoints: WeeklyPoint[] = weeks.map((w, idx) => ({
    weekStart: w.weekStart,
    weekLabel: w.weekLabel,
    actual: w.total,
    fitted: Math.round(model.fitted[idx] ?? w.total),
    forecast: null,
    low80: null,
    high80: null,
    low95: null,
    high95: null,
    isForecast: false,
  }));

  if (historicalPoints.length > 0) {
    const last = historicalPoints[historicalPoints.length - 1];
    last.forecast = last.actual;
    last.low80 = last.actual;
    last.high80 = last.actual;
    last.low95 = last.actual;
    last.high95 = last.actual;
  }

  const forecastPoints: WeeklyPoint[] = model.forecasts.map((pred, idx) => {
    const h = idx + 1;
    const dt = new Date(lastWeekDate);
    dt.setDate(dt.getDate() + h * 7);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const weekStart = `${y}-${m}-${d}`;
    const weekLabel = fastWeekLabel(weekStart);

    const sigmaH = model.residualStd * Math.sqrt(1 + 0.09 * (h - 1));
    const low80 = Math.max(0, Math.round(pred - 1.2816 * sigmaH));
    const high80 = Math.round(pred + 1.2816 * sigmaH);
    const low95 = Math.max(0, Math.round(pred - 1.96 * sigmaH));
    const high95 = Math.round(pred + 1.96 * sigmaH);

    return {
      weekStart,
      weekLabel,
      actual: null,
      forecast: Math.round(pred),
      low80,
      high80,
      low95,
      high95,
      isForecast: true,
    };
  });

  const nextHorizonDemand = Math.round(
    model.forecasts.reduce((a, b) => a + b, 0)
  );
  const next4WeeksDemand = Math.round(
    model.forecasts.slice(0, 4).reduce((a, b) => a + b, 0)
  );
  const weeklyAvgForecast =
    horizonWeeks > 0 ? nextHorizonDemand / horizonWeeks : 0;
  const dailyAvgForecast = weeklyAvgForecast / 7;

  const recentDaily = product.dailySales
    .slice(-60)
    .filter((d) => !excludedOutlierDates.has(d.date))
    .map((d) => Math.max(0, d.unitsSold));
  const dailyMean =
    recentDaily.length > 0
      ? recentDaily.reduce((a, b) => a + b, 0) / recentDaily.length
      : dailyAvgForecast;
  const dailyVar =
    recentDaily.length > 1
      ? recentDaily.reduce((a, v) => a + Math.pow(v - dailyMean, 2), 0) /
        (recentDaily.length - 1)
      : Math.pow(dailyAvgForecast * 0.35, 2);
  const dailyStdDev = Math.max(0.35, Math.sqrt(dailyVar));

  const cv = dailyMean > 0 ? dailyStdDev / dailyMean : 1;
  const confidenceReasons: string[] = [];
  let confidence: ConfidenceLevel = "High";

  if (historyWeeksCount < 16) {
    confidence = "Low";
    confidenceReasons.push(
      `Only ${historyWeeksCount} weeks of history available (cold-start moving-average fallback active).`
    );
  } else {
    confidenceReasons.push(
      `${historyWeeksCount} weeks of historical sales captured with seasonal decomposition.`
    );
  }

  if (backtest.wape <= 14) {
    confidenceReasons.push(
      `Strong ${backtest.backtestWeeks}-week backtest accuracy (${backtest.wape}% WAPE).`
    );
  } else if (backtest.wape <= 24) {
    if (confidence === "High") confidence = "Medium";
    confidenceReasons.push(
      `Moderate ${backtest.backtestWeeks}-week backtest error (${backtest.wape}% WAPE).`
    );
  } else {
    confidence = "Low";
    confidenceReasons.push(
      `Elevated ${backtest.backtestWeeks}-week backtest error (${backtest.wape}% WAPE).`
    );
  }

  if (cv > 0.5) {
    if (confidence === "High") confidence = "Medium";
    confidenceReasons.push(
      `Volatile daily demand (CV ${(cv * 100).toFixed(0)}%) widens safety buffer.`
    );
  }

  if (zeroSalesDaysCount > 15 && historyWeeksCount >= 16) {
    confidenceReasons.push(
      `${zeroSalesDaysCount} zero-sales days across history; WAPE prioritized over MAPE.`
    );
  }

  if (product.supplierLateRisk) {
    confidenceReasons.push(
      `Supplier (${product.supplier}) flagged for recurring delivery delays; +3d safety buffer added.`
    );
  }

  return {
    productId: product.id,
    method: useHoltWinters
      ? "Seasonal Holt-Winters"
      : "Moving Average (Sparse Fallback)",
    horizonWeeks,
    weeklySeries: [...historicalPoints, ...forecastPoints],
    next4WeeksDemand,
    nextHorizonDemand,
    weeklyAvgForecast: Number(weeklyAvgForecast.toFixed(1)),
    dailyAvgForecast: Number(dailyAvgForecast.toFixed(2)),
    dailyStdDev: Number(dailyStdDev.toFixed(2)),
    mape: backtest.mape,
    wape: backtest.wape,
    backtestWeeks: backtest.backtestWeeks,
    confidence,
    confidenceReasons,
    zeroSalesDaysCount,
    historyWeeksCount,
    excludedOutliersCount: excludedCount,
  };
}

/**
 * Computes lightweight summaries + ABC-XYZ classification across all 100 products
 * asynchronously in small chunks so the UI never freezes.
 */
export async function computeAllSummariesAsync(
  products: Product[],
  horizonWeeks: 4 | 8 | 12,
  excludedOutlierKeys: Set<string>,
  onProgress?: (pct: number) => void,
  signal?: { cancelled: boolean }
): Promise<Map<string, ProductSummary>> {
  const tempRows: Array<{
    product: Product;
    fc: ForecastResult;
    opt: ReturnType<typeof optimizeProductInventory>;
    cov: number;
    sparkline12w: number[];
  }> = [];

  const CHUNK_SIZE = 16;
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    if (signal?.cancelled) return new Map();

    const end = Math.min(products.length, i + CHUNK_SIZE);
    for (let j = i; j < end; j++) {
      const p = products[j];
      const excluded = new Set<string>();
      const prefix = `${p.id}::`;
      excludedOutlierKeys.forEach((k) => {
        if (k.startsWith(prefix)) excluded.add(k.slice(prefix.length));
      });

      const fc = forecastProduct(p, horizonWeeks, excluded);
      const opt = optimizeProductInventory(p, fc);
      const histActuals = fc.weeklySeries
        .filter((w) => !w.isForecast && w.actual !== null)
        .map((w) => w.actual ?? 0);

      tempRows.push({
        product: p,
        fc,
        opt,
        cov: computeWeeklyCov(histActuals),
        sparkline12w: histActuals.slice(-12),
      });
    }

    onProgress?.(Math.min(95, Math.round((end / Math.max(1, products.length)) * 95)));
    if (end < products.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (signal?.cancelled) return new Map();

  // Compute ABC class by projected 30-day revenue contribution:
  // Top 20% of products = A, next 30% = B, bottom 50% = C
  const rankedByRev = [...tempRows].sort(
    (a, b) => b.opt.projected30DayRevenue - a.opt.projected30DayRevenue
  );
  const abcById = new Map<string, AbcClass>();
  const totalCount = rankedByRev.length;
  const aCutoff = Math.max(1, Math.round(totalCount * 0.2));
  const bCutoff = Math.max(aCutoff + 1, Math.round(totalCount * 0.5));

  rankedByRev.forEach((row, idx) => {
    const cls: AbcClass = idx < aCutoff ? "A" : idx < bCutoff ? "B" : "C";
    abcById.set(row.product.id, cls);
  });

  const summaryMap = new Map<string, ProductSummary>();
  for (const row of tempRows) {
    const abc = abcById.get(row.product.id) ?? "C";
    const xyz: XyzClass =
      row.cov <= 0.28 ? "X" : row.cov <= 0.58 ? "Y" : "Z";
    summaryMap.set(
      row.product.id,
      buildProductSummary(
        row.product,
        row.fc,
        row.opt,
        row.cov,
        abc,
        xyz,
        row.sparkline12w
      )
    );
  }

  onProgress?.(100);
  return summaryMap;
}
