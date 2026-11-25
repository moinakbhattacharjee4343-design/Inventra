import {
  BulkScenarioItemResult,
  BulkScenarioSummary,
  FestivalEvent,
  ForecastResult,
  MonteCarloBucket,
  OptimizationResult,
  Product,
  ProductSummary,
  ScenarioAnalysisResult,
  ScenarioOutcome,
  ScenarioParams,
} from "../types/inventory";
import { forecastProduct } from "./forecasting";
import { optimizeProductInventory } from "./inventoryMath";

export const FESTIVAL_LIFTS: Record<FestivalEvent, { label: string; mult: number }> = {
  none: { label: "No major festival", mult: 1.0 },
  diwali: { label: "Diwali Festival Surge (+45%)", mult: 1.45 },
  eid: { label: "Eid Celebration Surge (+35%)", mult: 1.35 },
  christmas: { label: "Christmas & New Year (+30%)", mult: 1.3 },
  summer_peak: { label: "Summer Heatwave Peak (+25%)", mult: 1.25 },
  monsoon: { label: "Early Monsoon Lift (+30%)", mult: 1.3 },
};

function createFastRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleNormal(rng: () => number): number {
  const u1 = Math.max(1e-6, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function getScenarioDemandMultiplier(params: ScenarioParams): number {
  const sliderMult = 1 + params.demandChangePct / 100;
  const priceElasticity = -0.85;
  const priceMult = Math.max(
    0.55,
    1 + (params.priceChangePct / 100) * priceElasticity
  );
  const promoMult = params.promotionActive ? 1.28 : 1.0;
  const festMult = FESTIVAL_LIFTS[params.festivalEvent].mult;
  return Math.max(0.25, sliderMult * priceMult * promoMult * festMult);
}

function runMonteCarloTrials(
  product: Product,
  dailyMean: number,
  dailyStd: number,
  effectiveLeadTime: number,
  leadVarianceFactor: number,
  orderQty: number,
  effectiveSellingPrice: number,
  supplyDisruption: boolean,
  runs: number,
  seed: number
): { outcome: ScenarioOutcome; endingStocks: number[] } {
  const rng = createFastRng(seed);
  const endingStocks: number[] = new Array(runs);
  let stockoutTrials = 0;
  let totalDemandAll = 0;
  let totalMetAll = 0;
  let totalLostUnits = 0;
  let totalAvgStock = 0;

  for (let r = 0; r < runs; r++) {
    const leadDelayNoise = Math.max(
      -1,
      Math.round(
        sampleNormal(rng) * Math.max(0.8, effectiveLeadTime * leadVarianceFactor)
      )
    );
    const arrivalDay = Math.max(1, effectiveLeadTime + leadDelayNoise);
    const fillFactor = supplyDisruption ? 0.65 + rng() * 0.25 : 1.0;
    const deliveredQty = Math.round(orderQty * fillFactor);

    let stock = product.currentStock;
    let hadStockout = false;
    let trialDemand = 0;
    let trialMet = 0;
    let trialStockSum = 0;

    for (let day = 1; day <= 30; day++) {
      if (day === arrivalDay && deliveredQty > 0) {
        stock += deliveredQty;
      }

      const dSample = Math.max(
        0,
        Math.round(dailyMean + sampleNormal(rng) * dailyStd)
      );
      trialDemand += dSample;

      if (stock >= dSample) {
        stock -= dSample;
        trialMet += dSample;
      } else {
        trialMet += Math.max(0, stock);
        hadStockout = true;
        stock -= dSample;
      }
      trialStockSum += Math.max(0, stock);
    }

    if (hadStockout) stockoutTrials++;
    totalDemandAll += trialDemand;
    totalMetAll += trialMet;
    totalLostUnits += Math.max(0, trialDemand - trialMet);
    totalAvgStock += trialStockSum / 30;
    endingStocks[r] = stock;
  }

  const sorted = [...endingStocks].sort((a, b) => a - b);
  const p5 = sorted[Math.floor(runs * 0.05)] ?? 0;
  const p50 = sorted[Math.floor(runs * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(runs * 0.95)] ?? 0;

  const expectedLostSalesUnits = Number((totalLostUnits / runs).toFixed(1));
  const marginPerUnit = Math.max(1, effectiveSellingPrice - product.unitCost);
  const expectedLostSalesValue = Math.round(
    expectedLostSalesUnits * marginPerUnit * 1.2
  );
  const holdingCost30d = Math.round(
    (totalAvgStock / runs) * product.unitCost * (0.24 / 12)
  );

  return {
    outcome: {
      stockoutProbabilityPct: Number(((stockoutTrials / runs) * 100).toFixed(1)),
      expectedServiceLevelPct: Number(
        ((totalMetAll / Math.max(1, totalDemandAll)) * 100).toFixed(1)
      ),
      expectedLostSalesUnits,
      expectedLostSalesValue,
      holdingCost30d,
      recommendedOrderQty: orderQty,
      expectedEndingStock: Math.round(
        endingStocks.reduce((a, b) => a + b, 0) / runs
      ),
      p5EndingStock: p5,
      p50EndingStock: p50,
      p95EndingStock: p95,
    },
    endingStocks,
  };
}

export function runScenarioAnalysis(
  product: Product,
  forecast: ForecastResult,
  baselineOpt: OptimizationResult,
  params: ScenarioParams,
  runs = 1000
): ScenarioAnalysisResult {
  const demandMult = getScenarioDemandMultiplier(params);
  const scenarioOpt = optimizeProductInventory(product, forecast, {
    leadTimeExtraDays: params.supplierDelayDays + (params.supplyDisruption ? 3 : 0),
    demandMultiplier: demandMult,
    budgetCapPerSku: params.budgetCap,
    serviceZ: params.supplyDisruption ? 1.96 : 1.645,
  });

  const baseOrder =
    baselineOpt.recommendedOrderQty > 0 ? baselineOpt.recommendedOrderQty : 0;
  const baseLead = product.leadTimeDays + (product.supplierLateRisk ? 3 : 0);

  const baselineMc = runMonteCarloTrials(
    product,
    forecast.dailyAvgForecast,
    forecast.dailyStdDev,
    baseLead,
    product.supplierLateRisk ? 0.34 : 0.18,
    baseOrder,
    product.sellingPrice,
    false,
    runs,
    9001
  );

  const scenarioSellingPrice = Math.max(
    product.unitCost * 1.05,
    product.sellingPrice *
      (1 + params.priceChangePct / 100) *
      (params.promotionActive ? 0.9 : 1)
  );
  const scenarioLead =
    baseLead + params.supplierDelayDays + (params.supplyDisruption ? 3 : 0);

  const scenarioMc = runMonteCarloTrials(
    product,
    forecast.dailyAvgForecast * demandMult,
    forecast.dailyStdDev *
      Math.sqrt(demandMult) *
      (params.promotionActive ? 1.15 : 1),
    scenarioLead,
    params.supplyDisruption ? 0.38 : 0.2,
    scenarioOpt.recommendedOrderQty,
    scenarioSellingPrice,
    params.supplyDisruption,
    runs,
    9002
  );

  const minVal = Math.min(...scenarioMc.endingStocks);
  const maxVal = Math.max(...scenarioMc.endingStocks);
  const span = Math.max(12, maxVal - minVal);
  const bucketCount = 12;
  const step = Math.ceil(span / bucketCount);

  const histogram: MonteCarloBucket[] = Array.from(
    { length: bucketCount },
    (_, i) => {
      const bMin = minVal + i * step;
      const bMax = bMin + step - 1;
      const freq = scenarioMc.endingStocks.filter(
        (v) => v >= bMin && (i === bucketCount - 1 ? v <= bMax + step : v <= bMax)
      ).length;
      return {
        label: `${bMin}..${bMax}`,
        minStock: bMin,
        maxStock: bMax,
        frequency: freq,
        isStockout: bMax < 0,
      };
    }
  );

  return {
    baseline: baselineMc.outcome,
    scenario: scenarioMc.outcome,
    histogram,
    runs,
  };
}

/**
 * Runs Monte Carlo across a whole Department or Supplier asynchronously in chunks
 * with a progress callback so large multi-SKU scenario simulations never freeze the UI.
 */
export async function runBulkScenarioAnalysisAsync(
  targetProducts: Product[],
  summaries: Map<string, ProductSummary>,
  params: ScenarioParams,
  scopeLabel: string,
  onProgress?: (pct: number) => void,
  signal?: { cancelled: boolean }
): Promise<BulkScenarioSummary> {
  const items: BulkScenarioItemResult[] = [];
  const RUNS_PER_SKU = 400;
  const CHUNK_SIZE = 2;

  for (let i = 0; i < targetProducts.length; i += CHUNK_SIZE) {
    if (signal?.cancelled) {
      break;
    }

    const end = Math.min(targetProducts.length, i + CHUNK_SIZE);
    for (let j = i; j < end; j++) {
      const prod = targetProducts[j];
      const fc = forecastProduct(prod, 8);
      const baseOpt = optimizeProductInventory(prod, fc);
      const res = runScenarioAnalysis(prod, fc, baseOpt, params, RUNS_PER_SKU);
      items.push({
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        department: prod.category,
        supplier: prod.supplier,
        baselineStockoutProb: res.baseline.stockoutProbabilityPct,
        scenarioStockoutProb: res.scenario.stockoutProbabilityPct,
        baselineServiceLevel: res.baseline.expectedServiceLevelPct,
        scenarioServiceLevel: res.scenario.expectedServiceLevelPct,
        expectedLostSalesValue: res.scenario.expectedLostSalesValue,
        recommendedOrderQty: res.scenario.recommendedOrderQty,
        orderCost: Math.round(res.scenario.recommendedOrderQty * prod.unitCost),
      });
    }

    onProgress?.(
      Math.min(100, Math.round((end / Math.max(1, targetProducts.length)) * 100))
    );
    if (end < targetProducts.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Fallback if summaries exist and list empty
  const n = Math.max(1, items.length);
  const avgBaselineStockoutProb = Number(
    (items.reduce((s, x) => s + x.baselineStockoutProb, 0) / n).toFixed(1)
  );
  const avgScenarioStockoutProb = Number(
    (items.reduce((s, x) => s + x.scenarioStockoutProb, 0) / n).toFixed(1)
  );
  const avgBaselineServiceLevel = Number(
    (items.reduce((s, x) => s + x.baselineServiceLevel, 0) / n).toFixed(1)
  );
  const avgScenarioServiceLevel = Number(
    (items.reduce((s, x) => s + x.scenarioServiceLevel, 0) / n).toFixed(1)
  );

  // Also ensure unused param lint-clean if needed
  void summaries;

  return {
    scopeLabel,
    skuCount: items.length,
    avgBaselineStockoutProb,
    avgScenarioStockoutProb,
    avgBaselineServiceLevel,
    avgScenarioServiceLevel,
    totalExpectedLostSalesValue: items.reduce(
      (s, x) => s + x.expectedLostSalesValue,
      0
    ),
    totalRecommendedOrderCost: items.reduce((s, x) => s + x.orderCost, 0),
    items: items.sort((a, b) => b.scenarioStockoutProb - a.scenarioStockoutProb),
  };
}
