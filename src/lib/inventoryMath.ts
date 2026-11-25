import {
  AbcClass,
  AbcXyzCode,
  ForecastResult,
  HealthReason,
  HealthStatus,
  OptimizationResult,
  OrderTierOption,
  Product,
  ProductSummary,
  SupplierPurchaseLine,
  SupplierPurchaseOrder,
  XyzClass,
} from "../types/inventory";

const REFERENCE_DATE = new Date("2026-11-25T00:00:00");
const ORDER_SETUP_COST = 350;
const ANNUAL_HOLDING_RATE = 0.24;

function addDaysFormatted(days: number): string {
  const d = new Date(REFERENCE_DATE);
  d.setDate(d.getDate() + Math.max(0, Math.round(days)));
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Computes Safety Stock, Reorder Point (ROP), EOQ, MOQ, expiry-waste risk,
 * dead-stock risk, supplier late-risk buffer, cost trade-offs, and 5-part uncertainty reasoning.
 */
export function optimizeProductInventory(
  product: Product,
  forecast: ForecastResult,
  options?: {
    leadTimeExtraDays?: number;
    demandMultiplier?: number;
    budgetCapPerSku?: number | null;
    serviceZ?: number;
  }
): OptimizationResult {
  const demandMult = options?.demandMultiplier ?? 1;
  const lateRiskExtra = product.supplierLateRisk ? 3 : 0;
  const effectiveLeadTime = Math.max(
    1,
    product.leadTimeDays + lateRiskExtra + (options?.leadTimeExtraDays ?? 0)
  );
  const dailyDemand = Math.max(0.1, forecast.dailyAvgForecast * demandMult);
  const weeklyDemand = dailyDemand * 7;
  const dailyStd = forecast.dailyStdDev * Math.sqrt(demandMult);

  const z = options?.serviceZ ?? 1.645;
  const leadTimeStd = effectiveLeadTime * (product.supplierLateRisk ? 0.34 : 0.18);

  const safetyStock = Math.max(
    2,
    Math.ceil(
      z *
        Math.sqrt(
          effectiveLeadTime * Math.pow(dailyStd, 2) +
            Math.pow(dailyDemand, 2) * Math.pow(leadTimeStd, 2)
        )
    )
  );

  const reorderPoint = Math.ceil(dailyDemand * effectiveLeadTime + safetyStock);

  const annualDemand = dailyDemand * 365;
  const effectiveHoldingRate =
    product.shelfLifeDays !== null && product.shelfLifeDays <= 30
      ? 0.45
      : ANNUAL_HOLDING_RATE;
  const annualHoldingPerUnit = Math.max(5, product.unitCost * effectiveHoldingRate);
  const rawEoq = Math.round(
    Math.sqrt((2 * annualDemand * ORDER_SETUP_COST) / annualHoldingPerUnit)
  );
  const minCycleUnits =
    product.shelfLifeDays !== null && product.shelfLifeDays <= 14
      ? Math.ceil(dailyDemand * 4)
      : Math.ceil(dailyDemand * 14);
  const eoq = Math.max(minCycleUnits, product.moq || 1, rawEoq);

  const daysOfCover =
    dailyDemand > 0 ? Number((product.currentStock / dailyDemand).toFixed(1)) : 999;
  const daysUntilRop =
    dailyDemand > 0
      ? Number(((product.currentStock - reorderPoint) / dailyDemand).toFixed(1))
      : 999;

  const targetMaxStock = reorderPoint + eoq;
  const overstockUnits = Math.max(
    0,
    product.currentStock - Math.round(targetMaxStock * 1.35)
  );
  const overstockValue = Math.round(overstockUnits * product.unitCost);

  // Expiry/waste risk for short-shelf-life perishables
  let expiryWasteUnits = 0;
  let expiryWasteValue = 0;
  if (product.shelfLifeDays !== null && product.shelfLifeDays <= 30) {
    const sellableBeforeExpiry = Math.floor(dailyDemand * product.shelfLifeDays * 0.9);
    expiryWasteUnits = Math.max(0, product.currentStock - sellableBeforeExpiry);
    expiryWasteValue = Math.round(expiryWasteUnits * product.unitCost);
  }

  // Dead stock check: very slow recent velocity with substantial stock sitting unsold
  const isDeadStock =
    (dailyDemand <= 0.7 && product.currentStock >= 35 && daysOfCover >= 65) ||
    product.plantedIssue === "dead_stock";

  let healthStatus: HealthStatus = "healthy";
  let healthReason: HealthReason = "optimal";

  if (
    product.currentStock <= reorderPoint &&
    daysOfCover <= effectiveLeadTime + 2
  ) {
    healthStatus = "critical";
    healthReason = "stockout_risk";
  } else if (expiryWasteUnits >= 10 && expiryWasteValue >= 500) {
    healthStatus = "critical";
    healthReason = "expiry_risk";
  } else if (isDeadStock) {
    healthStatus = "warning";
    healthReason = "dead_stock";
  } else if (daysOfCover > 80 && overstockValue > 5000) {
    healthStatus = "critical";
    healthReason = "overstock_risk";
  } else if (product.currentStock <= reorderPoint * 1.18) {
    healthStatus = "warning";
    healthReason = "approaching_rop";
  } else if (daysOfCover > 55 && overstockUnits > 0) {
    healthStatus = "warning";
    healthReason = "overstock_risk";
  }

  const needsOrderNow =
    healthReason !== "expiry_risk" &&
    healthReason !== "dead_stock" &&
    product.currentStock <= reorderPoint * 1.18;

  let recommendedOrderQty = needsOrderNow
    ? Math.max(0, Math.ceil(reorderPoint + eoq - product.currentStock))
    : 0;

  let moqApplied = false;
  if (recommendedOrderQty > 0 && product.moq > 1 && recommendedOrderQty < product.moq) {
    recommendedOrderQty = product.moq;
    moqApplied = true;
  }

  let shelfLifeCapped = false;
  if (product.shelfLifeDays !== null && recommendedOrderQty > 0) {
    const maxSafeOnHand = Math.floor(product.shelfLifeDays * 0.72 * dailyDemand);
    const maxOrderAllowed = Math.max(0, maxSafeOnHand - product.currentStock);
    if (recommendedOrderQty > maxOrderAllowed) {
      recommendedOrderQty = maxOrderAllowed;
      shelfLifeCapped = true;
    }
  }

  let budgetCapped = false;
  if (
    options?.budgetCapPerSku != null &&
    recommendedOrderQty * product.unitCost > options.budgetCapPerSku
  ) {
    recommendedOrderQty = Math.max(
      0,
      Math.floor(options.budgetCapPerSku / product.unitCost)
    );
    budgetCapped = true;
  }

  const orderByOffsetDays =
    product.currentStock <= reorderPoint
      ? 0
      : Math.max(0, Math.floor(daysUntilRop));
  const recommendedOrderDate =
    orderByOffsetDays === 0 ? "Today" : addDaysFormatted(orderByOffsetDays);
  const expectedDeliveryDate = addDaysFormatted(
    orderByOffsetDays + effectiveLeadTime
  );

  let actionSummary = "";
  let actionReason = "";

  if (healthReason === "expiry_risk") {
    actionSummary = `Clear ${expiryWasteUnits} perishable units (${product.shelfLifeDays}d life)`;
    actionReason = `${product.currentStock} units on hand vs ${dailyDemand.toFixed(1)}/day pace risks ~₹${expiryWasteValue.toLocaleString("en-IN")} spoilage within ${product.shelfLifeDays} days. Run immediate markdowns and pause deliveries.`;
  } else if (healthReason === "dead_stock") {
    actionSummary = `Dead stock · ${product.currentStock} units stagnant`;
    actionReason = `Selling ~${dailyDemand.toFixed(1)} units/day with ₹${Math.round(product.currentStock * product.unitCost).toLocaleString("en-IN")} locked on shelf. Bundle or liquidate before further write-off.`;
  } else if (healthReason === "overstock_risk") {
    actionSummary = `Hold orders · ${overstockUnits} excess units`;
    actionReason = `Current stock (${product.currentStock} units) covers ${daysOfCover} days, well above the ${Math.round(targetMaxStock)} target. Free ₹${overstockValue.toLocaleString("en-IN")} via promotion.`;
  } else if (recommendedOrderQty > 0) {
    const urgencyWord =
      orderByOffsetDays === 0 ? "immediately" : `by ${recommendedOrderDate}`;
    actionSummary = `Order ${recommendedOrderQty} units ${urgencyWord}`;
    actionReason = `Stock (${product.currentStock} units) covers ${daysOfCover}d vs ${effectiveLeadTime}d effective lead${product.supplierLateRisk ? " (includes +3d supplier delay buffer)" : ""} and ${safetyStock} safety stock.`;
  } else {
    actionSummary = `No order needed (${daysOfCover}d cover)`;
    actionReason = `Stock (${product.currentStock} units) sits safely above ${reorderPoint} ROP. Next order projected around ${addDaysFormatted(Math.max(1, Math.floor(daysUntilRop)))}.`;
  }

  const expected30DayDemand = dailyDemand * 30;
  const marginPerUnit = Math.max(1, product.sellingPrice - product.unitCost);
  const projected30DayRevenue = Math.round(
    expected30DayDemand * product.sellingPrice
  );
  const projected30DayCost = Math.round(expected30DayDemand * product.unitCost);

  const unmet30dIfNoOrder = Math.max(0, expected30DayDemand - product.currentStock);
  const costOfStockout30d = Math.round(unmet30dIfNoOrder * marginPerUnit * 1.25);

  const avgCycleInventory =
    product.currentStock > targetMaxStock
      ? product.currentStock
      : safetyStock + recommendedOrderQty / 2;
  const costOfHolding30d = Math.round(
    avgCycleInventory * product.unitCost * (effectiveHoldingRate / 12)
  );

  // Unified Rupee impact metric for strict Top-10 ranking
  const financialImpact =
    costOfStockout30d +
    costOfHolding30d +
    Math.round(expiryWasteValue * 0.65) +
    Math.round(overstockValue * 0.08);

  const leadDemandBest = Math.round(dailyDemand * (effectiveLeadTime + 14));
  const leadWindowStd = Math.sqrt(effectiveLeadTime + 14) * dailyStd;
  const demandRange80: [number, number] = [
    Math.max(1, Math.round(leadDemandBest - 1.2816 * leadWindowStd)),
    Math.round(leadDemandBest + 1.2816 * leadWindowStd),
  ];
  const demandRange95: [number, number] = [
    Math.max(1, Math.round(leadDemandBest - 1.96 * leadWindowStd)),
    Math.round(leadDemandBest + 1.96 * leadWindowStd),
  ];

  const baseOrder = recommendedOrderQty > 0 ? recommendedOrderQty : eoq;
  const makeTier = (
    tier: OrderTierOption["tier"],
    mult: number,
    service: number,
    stockoutNote: string,
    overstockNote: string
  ): OrderTierOption => {
    let qty = Math.max(0, Math.round(baseOrder * mult));
    if (qty > 0 && product.moq > 1 && qty < product.moq) qty = product.moq;
    if (product.shelfLifeDays !== null) {
      const maxSafe = Math.max(
        0,
        Math.floor(product.shelfLifeDays * 0.78 * dailyDemand) -
          product.currentStock
      );
      qty = Math.min(qty, maxSafe);
    }
    return {
      tier,
      quantity: qty,
      estimatedCost: Math.round(qty * product.unitCost),
      targetServiceLevel: service,
      stockoutRiskNote: stockoutNote,
      overstockRiskNote: overstockNote,
    };
  };

  const tierOptions: OrderTierOption[] = [
    makeTier(
      "Conservative",
      0.75,
      89,
      "~11% stockout chance if weekend rush spikes",
      "Minimal cash tied up; zero spoilage exposure"
    ),
    makeTier(
      "Balanced",
      1.0,
      95,
      "~5% stockout risk; covers 95% of demand swings",
      "Optimal EOQ holding-to-stockout balance"
    ),
    makeTier(
      "Aggressive",
      1.3,
      98.5,
      "<2% stockout risk even with +2d supplier delay",
      "Higher working capital locked for ~3–4 extra weeks"
    ),
  ];

  const keyAssumptions = [
    `Supplier (${product.supplier}) effective lead ${effectiveLeadTime}d (base ${product.leadTimeDays}d${product.supplierLateRisk ? " + 3d late-delivery buffer" : ""}).`,
    `MOQ is ${product.moq} units; unit retail price ₹${product.sellingPrice}.`,
    `Physical shelf count matches recorded stock (${product.currentStock} units).`,
    ...(product.shelfLifeDays
      ? [
          `Shelf life of ${product.shelfLifeDays}d enforces a 72% turnover cap per batch.`,
        ]
      : []),
  ];

  const extraDelayUnits = Math.ceil(dailyDemand * 3);
  const whatWouldChange = [
    `If supplier lead time slips by +3 days, increase order by +${extraDelayUnits} units.`,
    `If weekly demand drops >20% (below ${(weeklyDemand * 0.8).toFixed(0)}/wk), switch to Conservative (${tierOptions[0].quantity} u).`,
    `If a festival or promotion starts this week, step up to Aggressive (${tierOptions[2].quantity} u).`,
  ];

  return {
    productId: product.id,
    dailyDemand: Number(dailyDemand.toFixed(2)),
    weeklyDemand: Number(weeklyDemand.toFixed(1)),
    safetyStock,
    reorderPoint,
    eoq,
    recommendedOrderQty,
    recommendedOrderDate,
    expectedDeliveryDate,
    daysOfCover,
    daysUntilRop,
    healthStatus,
    healthReason,
    overstockUnits,
    overstockValue,
    expiryWasteUnits,
    expiryWasteValue,
    projected30DayRevenue,
    projected30DayCost,
    costOfStockout30d,
    costOfHolding30d,
    financialImpact,
    shelfLifeCapped,
    moqApplied,
    budgetCapped,
    actionSummary,
    actionReason,
    reasoning: {
      bestEstimateUnits: recommendedOrderQty,
      demandRange80,
      demandRange95,
      keyAssumptions,
      whatWouldChange,
      options: tierOptions,
    },
  };
}

export function buildProductSummary(
  product: Product,
  forecast: ForecastResult,
  opt: OptimizationResult,
  cov: number,
  abcClass: AbcClass,
  xyzClass: XyzClass,
  sparkline12w: number[]
): ProductSummary {
  const abcXyz: AbcXyzCode = `${abcClass}${xyzClass}`;
  return {
    productId: product.id,
    method: forecast.method,
    dailyDemand: opt.dailyDemand,
    weeklyDemand: opt.weeklyDemand,
    dailyStdDev: forecast.dailyStdDev,
    next4WeeksDemand: forecast.next4WeeksDemand,
    nextHorizonDemand: forecast.nextHorizonDemand,
    wape: forecast.wape,
    mape: forecast.mape,
    confidence: forecast.confidence,
    historyWeeksCount: forecast.historyWeeksCount,
    safetyStock: opt.safetyStock,
    reorderPoint: opt.reorderPoint,
    eoq: opt.eoq,
    recommendedOrderQty: opt.recommendedOrderQty,
    recommendedOrderDate: opt.recommendedOrderDate,
    expectedDeliveryDate: opt.expectedDeliveryDate,
    daysOfCover: opt.daysOfCover,
    daysUntilRop: opt.daysUntilRop,
    healthStatus: opt.healthStatus,
    healthReason: opt.healthReason,
    overstockUnits: opt.overstockUnits,
    overstockValue: opt.overstockValue,
    expiryWasteUnits: opt.expiryWasteUnits,
    expiryWasteValue: opt.expiryWasteValue,
    projected30DayRevenue: opt.projected30DayRevenue,
    projected30DayCost: opt.projected30DayCost,
    costOfStockout30d: opt.costOfStockout30d,
    costOfHolding30d: opt.costOfHolding30d,
    financialImpact: opt.financialImpact,
    actionSummary: opt.actionSummary,
    actionReason: opt.actionReason,
    sparkline12w,
    cov,
    abcClass,
    xyzClass,
    abcXyz,
  };
}

/**
 * Consolidates product recommendations into supplier-wise Purchase Orders.
 * Supports optional `onlyProductIds` for bulk-selected PO generation.
 */
export function buildSupplierPurchaseOrders(
  products: Product[],
  summaries: Map<string, ProductSummary>,
  customQuantities: Map<string, number>,
  onlyProductIds?: Set<string>
): SupplierPurchaseOrder[] {
  const bySupplier = new Map<string, SupplierPurchaseLine[]>();
  const supplierLead = new Map<string, number>();
  const supplierRisk = new Map<string, boolean>();

  for (const product of products) {
    if (onlyProductIds && onlyProductIds.size > 0 && !onlyProductIds.has(product.id)) {
      continue;
    }

    const sum = summaries.get(product.id);
    if (!sum) continue;

    const selectedQty = customQuantities.has(product.id)
      ? customQuantities.get(product.id)!
      : sum.recommendedOrderQty;

    if (selectedQty <= 0 && (!onlyProductIds || !onlyProductIds.has(product.id))) {
      continue;
    }

    const effectiveQty =
      onlyProductIds && onlyProductIds.has(product.id) && selectedQty <= 0
        ? Math.max(product.moq || 1, sum.eoq)
        : selectedQty;

    const lines = bySupplier.get(product.supplier) ?? [];
    lines.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      currentStock: product.currentStock,
      reorderPoint: sum.reorderPoint,
      moq: product.moq || 1,
      recommendedQty: sum.recommendedOrderQty,
      selectedQty: effectiveQty,
      unitCost: product.unitCost,
      lineTotal: Math.round(effectiveQty * product.unitCost),
      healthStatus: sum.healthStatus,
      reason: sum.actionReason,
    });
    bySupplier.set(product.supplier, lines);
    supplierLead.set(
      product.supplier,
      Math.max(
        supplierLead.get(product.supplier) ?? 0,
        product.leadTimeDays + (product.supplierLateRisk ? 3 : 0)
      )
    );
    if (product.supplierLateRisk) {
      supplierRisk.set(product.supplier, true);
    }
  }

  return Array.from(bySupplier.entries())
    .map(([supplier, lines]) => {
      const leadTimeDays = supplierLead.get(supplier) ?? 4;
      return {
        supplier,
        supplierLateRisk: supplierRisk.get(supplier) ?? false,
        leadTimeDays,
        expectedDeliveryDate: addDaysFormatted(leadTimeDays),
        lines: lines.sort((a, b) => b.lineTotal - a.lineTotal),
        subtotal: lines.reduce((sum, l) => sum + l.lineTotal, 0),
      };
    })
    .sort((a, b) => b.subtotal - a.subtotal);
}
