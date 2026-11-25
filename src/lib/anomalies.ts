import { AnomalyAlert, Product } from "../types/inventory";

function getMedian(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Scans recent 45 days of each product's daily sales & stock ledger for:
 * 1. Negative stock on hand (ledger / POS sync error)
 * 2. Sudden sales spikes (robust MAD Z-score -> typo or bulk buy)
 * 3. Unexpected zero-sales outages / missing-data gaps on fast-moving SKUs
 * 4. Unexplained shrinkage (stock drops sharply without matching sales)
 * 5. Chronic supplier delivery delay risk (1 designated unreliable supplier)
 */
export function detectAnomalies(
  products: Product[],
  dismissedIds: Set<string>,
  excludedKeys: Set<string>
): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  for (const product of products) {
    // 5. Chronic supplier late-delivery risk alert
    if (product.supplierLateRisk) {
      const id = `sup-${product.id}`;
      alerts.push({
        id,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        date: "2026-11-25",
        type: "supplier_delay",
        severityScore: 76,
        severityLabel: "High",
        title: `Recurring late deliveries from ${product.supplier}`,
        whyFlagged: `${product.supplier} slipped promised ${product.leadTimeDays}-day delivery windows on 4 of the last 6 shipments. Inventra automatically added +3d safety buffer to protect shelf availability.`,
        suggestedAction:
          "Place orders 3 days earlier or qualify a secondary backup distributor for this SKU.",
        observedValue: product.leadTimeDays + 4,
        expectedValue: product.leadTimeDays,
        dismissed: dismissedIds.has(id),
        excludedFromForecast: false,
      });
    }

    const sales = product.dailySales;
    if (sales.length < 7) continue;

    const recentWindow = sales.slice(-45);
    const baselineSlice = sales.slice(-90, -14).map((d) => d.unitsSold);
    const referenceValues =
      baselineSlice.length >= 14
        ? baselineSlice
        : sales.slice(0, Math.max(1, sales.length - 7)).map((d) => d.unitsSold);

    const median = getMedian(referenceValues);
    const absDevs = referenceValues.map((v) => Math.abs(v - median));
    const mad = Math.max(0.8, getMedian(absDevs));
    const robustSigma = mad * 1.4826;

    let zeroStreakStart: string | null = null;
    let zeroStreakCount = 0;

    for (let i = 0; i < recentWindow.length; i++) {
      const rec = recentWindow[i];
      const key = `${product.id}::${rec.date}`;

      // 1. Negative stock alert
      if (rec.stockOnHand < 0) {
        const id = `neg-${product.id}-${rec.date}`;
        alerts.push({
          id,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          date: rec.date,
          type: "negative_stock",
          severityScore: 95,
          severityLabel: "Critical",
          title: `Negative inventory recorded (${rec.stockOnHand} units)`,
          whyFlagged: `On ${rec.date}, stock on hand dropped to ${rec.stockOnHand} units while ${rec.unitsSold} units were billed. Physical stock cannot be negative — indicates an unlogged receipt or POS sync error.`,
          suggestedAction:
            "Verify receiving invoice around this date and reconcile physical shelf count.",
          observedValue: rec.stockOnHand,
          expectedValue: 15,
          dismissed: dismissedIds.has(id),
          excludedFromForecast: excludedKeys.has(key),
        });
      }

      // 2. Sudden spike detection
      const zRobust = (rec.unitsSold - median) / Math.max(1, robustSigma);
      const spikeThreshold = rec.festivalTag || rec.isPromo ? 5.5 : 3.8;
      if (
        rec.unitsSold > median * 3.2 &&
        zRobust > spikeThreshold &&
        rec.unitsSold >= 12
      ) {
        const id = `spike-${product.id}-${rec.date}`;
        const mult = median > 0 ? (rec.unitsSold / median).toFixed(1) : "5+";
        const severityScore = Math.min(96, Math.round(64 + zRobust * 4.2));
        alerts.push({
          id,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          date: rec.date,
          type: "sales_spike",
          severityScore,
          severityLabel: severityScore >= 82 ? "Critical" : "High",
          title: `Unusual ${mult}x sales spike (${rec.unitsSold} units in 1 day)`,
          whyFlagged: `${rec.unitsSold} units recorded on ${rec.date} vs typical baseline of ${median.toFixed(1)} units/day (Z-score ${zRobust.toFixed(1)}). Likely a POS quantity typo or one-off corporate bulk buy.`,
          suggestedAction:
            "Check POS receipt log. If it was a data-entry typo or one-time bulk buy, exclude it from the forecast.",
          observedValue: rec.unitsSold,
          expectedValue: Number(median.toFixed(1)),
          dismissed: dismissedIds.has(id),
          excludedFromForecast: excludedKeys.has(key),
        });
      }

      // 3. Sudden drop / missing-data gap for fast movers (median >= 3/day)
      if (median >= 3 && rec.unitsSold === 0) {
        if (!zeroStreakStart) zeroStreakStart = rec.date;
        zeroStreakCount++;
      } else {
        if (zeroStreakCount >= 2 && zeroStreakStart) {
          const prevDate = recentWindow[i - 1].date;
          const id = `drop-${product.id}-${prevDate}`;
          alerts.push({
            id,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            date: prevDate,
            type: "sales_drop",
            severityScore: 81,
            severityLabel: "High",
            title: `${zeroStreakCount}-day missing-data / zero-sales gap`,
            whyFlagged: `Zero units recorded from ${zeroStreakStart} to ${prevDate} despite typical demand of ${median.toFixed(1)} units/day. Indicates a missing POS feed gap or unrecorded stockout.`,
            suggestedAction:
              "Confirm whether POS sync dropped these days or stock ran empty; exclude outage days from forecast.",
            observedValue: 0,
            expectedValue: Number((median * zeroStreakCount).toFixed(0)),
            dismissed: dismissedIds.has(id),
            excludedFromForecast: excludedKeys.has(`${product.id}::${prevDate}`),
          });
        }
        zeroStreakStart = null;
        zeroStreakCount = 0;
      }

      // 4. Shrinkage check
      if (i > 0) {
        const prev = recentWindow[i - 1];
        const impliedStockDrop = prev.stockOnHand - rec.stockOnHand;
        const unexplainedGap = impliedStockDrop - rec.unitsSold;
        if (unexplainedGap >= 20 && prev.stockOnHand > 0 && rec.stockOnHand >= 0) {
          const id = `shrink-${product.id}-${rec.date}`;
          alerts.push({
            id,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            date: rec.date,
            type: "shrinkage",
            severityScore: 90,
            severityLabel: "Critical",
            title: `Unexplained shrinkage of ${unexplainedGap} units`,
            whyFlagged: `On ${rec.date}, recorded stock fell from ${prev.stockOnHand} to ${rec.stockOnHand} (-${impliedStockDrop}), while only ${rec.unitsSold} units sold. ${unexplainedGap} units (₹${(unexplainedGap * product.unitCost).toLocaleString("en-IN")}) are unaccounted for.`,
            suggestedAction:
              "Audit shelf security, check for pilferage/theft or unbilled staff removal.",
            observedValue: rec.stockOnHand,
            expectedValue: Math.max(0, prev.stockOnHand - rec.unitsSold),
            dismissed: dismissedIds.has(id),
            excludedFromForecast: excludedKeys.has(key),
          });
        }
      }
    }
  }

  return alerts.sort((a, b) => {
    if (a.dismissed !== b.dismissed) return a.dismissed ? 1 : -1;
    return b.severityScore - a.severityScore;
  });
}
