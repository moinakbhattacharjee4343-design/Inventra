export type ProductCategory =
  | "Grocery Staples"
  | "Dairy, Bakery & Fresh"
  | "Beverages & Snacks"
  | "Personal Care"
  | "Pharmacy & Wellness"
  | "Fashion & Apparel"
  | "Electronics & Accessories"
  | "Home & Kitchen"
  | "Stationery & Books"
  | "Toys, Sports & Seasonal";

export const ALL_DEPARTMENTS: ProductCategory[] = [
  "Grocery Staples",
  "Dairy, Bakery & Fresh",
  "Beverages & Snacks",
  "Personal Care",
  "Pharmacy & Wellness",
  "Fashion & Apparel",
  "Electronics & Accessories",
  "Home & Kitchen",
  "Stationery & Books",
  "Toys, Sports & Seasonal",
];

export type DemandProfileTag =
  | "STABLE"
  | "FESTIVAL"
  | "SUMMER"
  | "WINTER"
  | "MONSOON"
  | "BACK_TO_SCHOOL"
  | "WEDDING_SEASON"
  | "PROMO_DRIVEN"
  | "PERISHABLE"
  | "SLOW_MOVER"
  | "TREND_UP"
  | "TREND_DOWN"
  | "LAUNCH";

export type HealthStatus = "critical" | "warning" | "healthy";

export type HealthReason =
  | "stockout_risk"
  | "overstock_risk"
  | "approaching_rop"
  | "expiry_risk"
  | "dead_stock"
  | "optimal";

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type LanguageCode = "en" | "hi" | "bn";

export type AbcClass = "A" | "B" | "C";
export type XyzClass = "X" | "Y" | "Z";
export type AbcXyzCode = `${AbcClass}${XyzClass}`;

export interface DailySaleRecord {
  date: string; // YYYY-MM-DD
  unitsSold: number;
  price: number;
  stockOnHand: number;
  isPromo?: boolean;
  festivalTag?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  unitCost: number;
  sellingPrice: number;
  currentStock: number;
  moq: number; // Minimum Order Quantity
  supplier: string;
  supplierLateRisk?: boolean;
  leadTimeDays: number;
  shelfLifeDays: number | null; // null = non-perishable
  demandProfiles: DemandProfileTag[];
  imageUrl?: string;
  dailySales: DailySaleRecord[];
  notes?: string;
  plantedIssue?: string;
}

export interface WeeklyPoint {
  weekStart: string; // YYYY-MM-DD
  weekLabel: string;
  actual: number | null;
  fitted?: number | null;
  forecast: number | null;
  low80: number | null;
  high80: number | null;
  low95: number | null;
  high95: number | null;
  isForecast: boolean;
}

export interface ForecastResult {
  productId: string;
  method: "Seasonal Holt-Winters" | "Moving Average (Sparse Fallback)";
  horizonWeeks: 4 | 8 | 12;
  weeklySeries: WeeklyPoint[];
  next4WeeksDemand: number;
  nextHorizonDemand: number;
  weeklyAvgForecast: number;
  dailyAvgForecast: number;
  dailyStdDev: number;
  mape: number; // %
  wape: number; // %
  backtestWeeks: number;
  confidence: ConfidenceLevel;
  confidenceReasons: string[];
  zeroSalesDaysCount: number;
  historyWeeksCount: number;
  excludedOutliersCount: number;
}

export interface OrderTierOption {
  tier: "Conservative" | "Balanced" | "Aggressive";
  quantity: number;
  estimatedCost: number;
  targetServiceLevel: number; // %
  stockoutRiskNote: string;
  overstockRiskNote: string;
}

export interface UncertaintyReasoning {
  bestEstimateUnits: number;
  demandRange80: [number, number];
  demandRange95: [number, number];
  keyAssumptions: string[];
  whatWouldChange: string[];
  options: OrderTierOption[];
}

export interface OptimizationResult {
  productId: string;
  dailyDemand: number;
  weeklyDemand: number;
  safetyStock: number;
  reorderPoint: number;
  eoq: number;
  recommendedOrderQty: number;
  recommendedOrderDate: string;
  expectedDeliveryDate: string;
  daysOfCover: number;
  daysUntilRop: number;
  healthStatus: HealthStatus;
  healthReason: HealthReason;
  overstockUnits: number;
  overstockValue: number;
  expiryWasteUnits: number;
  expiryWasteValue: number;
  projected30DayRevenue: number;
  projected30DayCost: number;
  costOfStockout30d: number;
  costOfHolding30d: number;
  financialImpact: number;
  shelfLifeCapped: boolean;
  moqApplied: boolean;
  budgetCapped: boolean;
  actionSummary: string;
  actionReason: string;
  reasoning: UncertaintyReasoning;
}

/**
 * Lightweight precomputed summary used across the 100-SKU Dashboard,
 * Scorecard, ABC-XYZ matrix, Top 10 Actions, and Bulk Purchase Orders.
 * Full 104-week Holt-Winters series is computed lazily only for open/compared SKUs.
 */
export interface ProductSummary {
  productId: string;
  method: "Seasonal Holt-Winters" | "Moving Average (Sparse Fallback)";
  dailyDemand: number;
  weeklyDemand: number;
  dailyStdDev: number;
  next4WeeksDemand: number;
  nextHorizonDemand: number;
  wape: number;
  mape: number;
  confidence: ConfidenceLevel;
  historyWeeksCount: number;
  safetyStock: number;
  reorderPoint: number;
  eoq: number;
  recommendedOrderQty: number;
  recommendedOrderDate: string;
  expectedDeliveryDate: string;
  daysOfCover: number;
  daysUntilRop: number;
  healthStatus: HealthStatus;
  healthReason: HealthReason;
  overstockUnits: number;
  overstockValue: number;
  expiryWasteUnits: number;
  expiryWasteValue: number;
  projected30DayRevenue: number;
  projected30DayCost: number;
  costOfStockout30d: number;
  costOfHolding30d: number;
  financialImpact: number;
  actionSummary: string;
  actionReason: string;
  sparkline12w: number[];
  cov: number; // weekly coefficient of variation
  abcClass: AbcClass;
  xyzClass: XyzClass;
  abcXyz: AbcXyzCode;
}

export type FestivalEvent =
  | "none"
  | "diwali"
  | "eid"
  | "christmas"
  | "summer_peak"
  | "monsoon";

export interface ScenarioParams {
  id: string;
  name: string;
  demandChangePct: number; // -40 to +80
  supplierDelayDays: number; // 0 to +14
  priceChangePct: number; // -25 to +25
  promotionActive: boolean;
  festivalEvent: FestivalEvent;
  budgetCap: number | null; // null = uncapped
  supplyDisruption: boolean;
}

export interface ScenarioOutcome {
  stockoutProbabilityPct: number;
  expectedServiceLevelPct: number;
  expectedLostSalesUnits: number;
  expectedLostSalesValue: number;
  holdingCost30d: number;
  recommendedOrderQty: number;
  expectedEndingStock: number;
  p5EndingStock: number;
  p50EndingStock: number;
  p95EndingStock: number;
}

export interface MonteCarloBucket {
  label: string;
  minStock: number;
  maxStock: number;
  frequency: number;
  isStockout: boolean;
}

export interface ScenarioAnalysisResult {
  baseline: ScenarioOutcome;
  scenario: ScenarioOutcome;
  histogram: MonteCarloBucket[];
  runs: number;
}

export interface BulkScenarioItemResult {
  productId: string;
  sku: string;
  productName: string;
  department: ProductCategory;
  supplier: string;
  baselineStockoutProb: number;
  scenarioStockoutProb: number;
  baselineServiceLevel: number;
  scenarioServiceLevel: number;
  expectedLostSalesValue: number;
  recommendedOrderQty: number;
  orderCost: number;
}

export interface BulkScenarioSummary {
  scopeLabel: string;
  skuCount: number;
  avgBaselineStockoutProb: number;
  avgScenarioStockoutProb: number;
  avgBaselineServiceLevel: number;
  avgScenarioServiceLevel: number;
  totalExpectedLostSalesValue: number;
  totalRecommendedOrderCost: number;
  items: BulkScenarioItemResult[];
}

export type AnomalyType =
  | "sales_spike"
  | "sales_drop"
  | "negative_stock"
  | "shrinkage"
  | "supplier_delay";

export interface AnomalyAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  date: string;
  type: AnomalyType;
  severityScore: number; // 1-100
  severityLabel: "Critical" | "High" | "Medium";
  title: string;
  whyFlagged: string;
  suggestedAction: string;
  observedValue: number;
  expectedValue: number;
  dismissed: boolean;
  excludedFromForecast: boolean;
}

export interface SupplierPurchaseLine {
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  currentStock: number;
  reorderPoint: number;
  moq: number;
  recommendedQty: number;
  selectedQty: number;
  unitCost: number;
  lineTotal: number;
  healthStatus: HealthStatus;
  reason: string;
}

export interface SupplierPurchaseOrder {
  supplier: string;
  supplierLateRisk?: boolean;
  leadTimeDays: number;
  expectedDeliveryDate: string;
  lines: SupplierPurchaseLine[];
  subtotal: number;
}

export interface CsvValidationReport {
  fileName: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  productsCount: number;
  rejectionReasons: Array<{ rowNumber: number; reason: string }>;
  warnings: string[];
}

export interface AiCitedFigure {
  label: string;
  value: string;
}

export interface AiExplanationResponse {
  headline: string;
  explanation: string;
  citedFigures: AiCitedFigure[];
  uncertaintyNote: string;
  isFallback?: boolean;
  errorNotice?: string;
}

export interface AiChatResponse {
  reply: string;
  citedFigures: AiCitedFigure[];
  uncertaintyNote: string;
  suggestedFollowUps: string[];
  isFallback?: boolean;
  errorNotice?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  citedFigures?: AiCitedFigure[];
  uncertaintyNote?: string;
  suggestedFollowUps?: string[];
  isFallback?: boolean;
}
