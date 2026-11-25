import {
  DailySaleRecord,
  DemandProfileTag,
  Product,
  ProductCategory,
} from "../types/inventory";
import { getProductImageUrl } from "../lib/productArtwork";

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const REFERENCE_TODAY = new Date("2026-11-25T00:00:00");
export const DEMO_REFERENCE_DATE = formatDateISO(REFERENCE_TODAY);

/**
 * 15 Realistic Retail Mall Suppliers.
 * Apex Express Logistics is the designated late-delivery risk supplier (affecting 6 SKUs).
 */
export const MALL_SUPPLIERS = [
  "Annapurna Agro & Staples",
  "Kaveri Cold Chain Dairy",
  "Harvest Fresh Farms",
  "Deccan Beverage & Snacks Co.",
  "Malabar Roasters & Gourmet",
  "Aura Botanics Personal Care",
  "VedaCare Wellness Labs",
  "MedLine Pharma Distributors",
  "Vastra Loom Apparel",
  "MetroStride Footwear & Bags",
  "VoltEdge Tech Accessories",
  "Apex Express Logistics", // Unreliable supplier (late deliveries across 6 SKUs)
  "Gruha Living Homeware",
  "Vidya Paper & Stationery",
  "CrestPlay Sports & Seasonal",
] as const;

export const UNRELIABLE_SUPPLIER = "Apex Express Logistics";

interface DemandProfileTemplate {
  noiseSigma: number;
  weekendLift: number;
  trendPerYear: number;
  promoFreqDays: number;
  promoBoost: number;
  zeroDayChance: number;
  seasonMultiplier: (month: number, day: number) => { factor: number; tag?: string };
}

/**
 * Reusable demand profile templates composed per SKU.
 */
export const DEMAND_PROFILE_TEMPLATES: Record<
  DemandProfileTag,
  DemandProfileTemplate
> = {
  STABLE: {
    noiseSigma: 0.11,
    weekendLift: 0.14,
    trendPerYear: 0.04,
    promoFreqDays: 0,
    promoBoost: 1,
    zeroDayChance: 0,
    seasonMultiplier: () => ({ factor: 1 }),
  },
  FESTIVAL: {
    noiseSigma: 0.16,
    weekendLift: 0.28,
    trendPerYear: 0.08,
    promoFreqDays: 60,
    promoBoost: 1.28,
    zeroDayChance: 0,
    seasonMultiplier: (m, d) => {
      if ((m === 9 && d >= 22) || (m === 10 && d <= 8)) {
        return { factor: 1.65, tag: "Diwali" };
      }
      if ((m === 2 && d >= 24) || (m === 3 && d <= 5)) {
        return { factor: 1.4, tag: "Eid" };
      }
      if (m === 11 && d >= 18) {
        return { factor: 1.38, tag: "Christmas" };
      }
      return { factor: 1 };
    },
  },
  SUMMER: {
    noiseSigma: 0.16,
    weekendLift: 0.25,
    trendPerYear: 0.07,
    promoFreqDays: 45,
    promoBoost: 1.25,
    zeroDayChance: 0,
    seasonMultiplier: (m) => {
      // Peak Mar(2)-Jun(5)
      if (m >= 2 && m <= 5) {
        return { factor: m === 4 ? 1.65 : 1.42, tag: m === 4 ? "Summer Peak" : undefined };
      }
      if (m === 11 || m === 0) return { factor: 0.72 };
      return { factor: 1 };
    },
  },
  WINTER: {
    noiseSigma: 0.16,
    weekendLift: 0.22,
    trendPerYear: 0.06,
    promoFreqDays: 50,
    promoBoost: 1.22,
    zeroDayChance: 0,
    seasonMultiplier: (m) => {
      // Peak Nov(10)-Feb(1)
      if (m >= 10 || m <= 1) {
        return { factor: m === 11 || m === 0 ? 1.58 : 1.35 };
      }
      if (m >= 4 && m <= 6) return { factor: 0.68 };
      return { factor: 1 };
    },
  },
  MONSOON: {
    noiseSigma: 0.18,
    weekendLift: 0.18,
    trendPerYear: 0.05,
    promoFreqDays: 0,
    promoBoost: 1,
    zeroDayChance: 0,
    seasonMultiplier: (m) => {
      // Peak Jun(5)-Sep(8)
      if (m >= 5 && m <= 8) return { factor: 1.55, tag: "Monsoon" };
      return { factor: 0.85 };
    },
  },
  BACK_TO_SCHOOL: {
    noiseSigma: 0.17,
    weekendLift: 0.3,
    trendPerYear: 0.06,
    promoFreqDays: 45,
    promoBoost: 1.28,
    zeroDayChance: 0,
    seasonMultiplier: (m) => {
      if (m === 5 || m === 0) return { factor: 1.62, tag: "Back to School" };
      if (m === 6 || m === 2) return { factor: 1.22 };
      return { factor: 0.92 };
    },
  },
  WEDDING_SEASON: {
    noiseSigma: 0.2,
    weekendLift: 0.42,
    trendPerYear: 0.05,
    promoFreqDays: 55,
    promoBoost: 1.25,
    zeroDayChance: 0.04,
    seasonMultiplier: (m) => {
      if (m >= 10 || m <= 1 || m === 3) return { factor: 1.48, tag: "Wedding Season" };
      return { factor: 0.8 };
    },
  },
  PROMO_DRIVEN: {
    noiseSigma: 0.18,
    weekendLift: 0.3,
    trendPerYear: 0.08,
    promoFreqDays: 28,
    promoBoost: 1.48,
    zeroDayChance: 0,
    seasonMultiplier: () => ({ factor: 1 }),
  },
  PERISHABLE: {
    noiseSigma: 0.14,
    weekendLift: 0.22,
    trendPerYear: 0.05,
    promoFreqDays: 0,
    promoBoost: 1,
    zeroDayChance: 0,
    seasonMultiplier: () => ({ factor: 1 }),
  },
  SLOW_MOVER: {
    noiseSigma: 0.42,
    weekendLift: 0.35,
    trendPerYear: 0.02,
    promoFreqDays: 90,
    promoBoost: 1.2,
    zeroDayChance: 0.48,
    seasonMultiplier: () => ({ factor: 1 }),
  },
  TREND_UP: {
    noiseSigma: 0.15,
    weekendLift: 0.24,
    trendPerYear: 0.28,
    promoFreqDays: 42,
    promoBoost: 1.25,
    zeroDayChance: 0,
    seasonMultiplier: () => ({ factor: 1 }),
  },
  TREND_DOWN: {
    noiseSigma: 0.16,
    weekendLift: 0.15,
    trendPerYear: -0.18,
    promoFreqDays: 60,
    promoBoost: 1.2,
    zeroDayChance: 0.06,
    seasonMultiplier: () => ({ factor: 1 }),
  },
  LAUNCH: {
    noiseSigma: 0.22,
    weekendLift: 0.3,
    trendPerYear: 0.25,
    promoFreqDays: 21,
    promoBoost: 1.3,
    zeroDayChance: 0.05,
    seasonMultiplier: () => ({ factor: 1 }),
  },
};

type PlantedIssue =
  | "overstocked"
  | "frequent_stockout"
  | "expiry_risk"
  | "dead_stock"
  | "demand_surge"
  | "anomaly_typo_spike"
  | "anomaly_bulk_spike"
  | "anomaly_shrinkage"
  | "anomaly_negative_stock"
  | "anomaly_missing_gap";

interface CompactSkuSpec {
  name: string;
  sku: string;
  dept: ProductCategory;
  cost: number;
  marginPct: number; // sellingPrice = round(cost * (1 + marginPct/100))
  supplier: (typeof MALL_SUPPLIERS)[number];
  lead: number;
  shelf: number | null;
  moq: number;
  baseDaily: number;
  stock: number;
  profiles: DemandProfileTag[];
  historyDays?: number;
  planted?: PlantedIssue;
  note?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RAW_SPECS: CompactSkuSpec[] = [
  // 1. Grocery Staples (cost ₹25-650, margin 12-25%, lead 2-5d)
  { name: "Basmati Rice 5kg", sku: "GRO-001", dept: "Grocery Staples", cost: 480, marginPct: 18, supplier: "Annapurna Agro & Staples", lead: 4, shelf: 365, moq: 12, baseDaily: 7.4, stock: 74, profiles: ["STABLE", "FESTIVAL"] },
  { name: "Wheat Flour 10kg", sku: "GRO-002", dept: "Grocery Staples", cost: 340, marginPct: 16, supplier: "Annapurna Agro & Staples", lead: 3, shelf: 180, moq: 15, baseDaily: 8.6, stock: 82, profiles: ["STABLE"] },
  { name: "Cooking Oil 1L", sku: "GRO-003", dept: "Grocery Staples", cost: 135, marginPct: 15, supplier: "Annapurna Agro & Staples", lead: 4, shelf: 270, moq: 24, baseDaily: 9.2, stock: 72, profiles: ["STABLE", "FESTIVAL"], planted: "anomaly_negative_stock", note: "Negative stock ledger error logged recently." },
  { name: "Sugar 1kg", sku: "GRO-004", dept: "Grocery Staples", cost: 42, marginPct: 14, supplier: "Annapurna Agro & Staples", lead: 3, shelf: 540, moq: 30, baseDaily: 11.5, stock: 88, profiles: ["STABLE", "FESTIVAL"], planted: "anomaly_missing_gap", note: "Missing POS sync gap caused 4 zero-sales days." },
  { name: "Iodized Salt 1kg", sku: "GRO-005", dept: "Grocery Staples", cost: 25, marginPct: 20, supplier: "Annapurna Agro & Staples", lead: 2, shelf: 720, moq: 40, baseDaily: 10.4, stock: 95, profiles: ["STABLE"] },
  { name: "Toor Dal 1kg", sku: "GRO-006", dept: "Grocery Staples", cost: 148, marginPct: 18, supplier: "Annapurna Agro & Staples", lead: 4, shelf: 300, moq: 20, baseDaily: 6.8, stock: 54, profiles: ["STABLE"] },
  { name: "Ghee 500ml", sku: "GRO-007", dept: "Grocery Staples", cost: 320, marginPct: 22, supplier: "Kaveri Cold Chain Dairy", lead: 4, shelf: 240, moq: 12, baseDaily: 4.5, stock: 48, profiles: ["FESTIVAL", "WINTER"] },
  { name: "Tea Powder 500g", sku: "GRO-008", dept: "Grocery Staples", cost: 210, marginPct: 24, supplier: "Malabar Roasters & Gourmet", lead: 5, shelf: 365, moq: 15, baseDaily: 5.2, stock: 64, profiles: ["STABLE", "WINTER"] },
  { name: "Instant Noodles 5-pack", sku: "GRO-009", dept: "Grocery Staples", cost: 68, marginPct: 22, supplier: "Deccan Beverage & Snacks Co.", lead: 3, shelf: 240, moq: 24, baseDaily: 9.8, stock: 86, profiles: ["MONSOON", "PROMO_DRIVEN"] },
  { name: "Cream Biscuits Family Pack", sku: "GRO-010", dept: "Grocery Staples", cost: 48, marginPct: 25, supplier: "Deccan Beverage & Snacks Co.", lead: 3, shelf: 180, moq: 30, baseDaily: 8.1, stock: 79, profiles: ["STABLE", "PROMO_DRIVEN"] },

  // 2. Dairy, Bakery & Fresh (cost ₹15-300, margin 10-20%, lead 1-2d, shelf life 2-30d)
  { name: "Packaged Milk 1L", sku: "DAI-001", dept: "Dairy, Bakery & Fresh", cost: 54, marginPct: 12, supplier: "Kaveri Cold Chain Dairy", lead: 1, shelf: 4, moq: 24, baseDaily: 26, stock: 165, profiles: ["PERISHABLE", "STABLE"], planted: "expiry_risk", note: "4-day shelf life with excess cooler stock risking waste." },
  { name: "Eggs Tray 30", sku: "DAI-002", dept: "Dairy, Bakery & Fresh", cost: 185, marginPct: 15, supplier: "Harvest Fresh Farms", lead: 2, shelf: 14, moq: 12, baseDaily: 7.5, stock: 145, profiles: ["PERISHABLE", "WINTER"], planted: "expiry_risk", note: "Tray batch exceeds 14-day freshness turnover." },
  { name: "Butter 500g", sku: "DAI-003", dept: "Dairy, Bakery & Fresh", cost: 245, marginPct: 14, supplier: "Kaveri Cold Chain Dairy", lead: 2, shelf: 30, moq: 10, baseDaily: 4.8, stock: 42, profiles: ["PERISHABLE", "FESTIVAL"] },
  { name: "Cheese Slices 200g", sku: "DAI-004", dept: "Dairy, Bakery & Fresh", cost: 132, marginPct: 18, supplier: "Kaveri Cold Chain Dairy", lead: 2, shelf: 28, moq: 12, baseDaily: 5.4, stock: 44, profiles: ["PERISHABLE"] },
  { name: "Curd 400g", sku: "DAI-005", dept: "Dairy, Bakery & Fresh", cost: 38, marginPct: 16, supplier: "Kaveri Cold Chain Dairy", lead: 1, shelf: 7, moq: 18, baseDaily: 12.2, stock: 120, profiles: ["PERISHABLE", "SUMMER"], planted: "expiry_risk", note: "7-day shelf life exceeded by current chiller inventory." },
  { name: "Sliced Bread", sku: "DAI-006", dept: "Dairy, Bakery & Fresh", cost: 36, marginPct: 18, supplier: "Harvest Fresh Farms", lead: 1, shelf: 4, moq: 20, baseDaily: 16.5, stock: 95, profiles: ["PERISHABLE", "STABLE"], planted: "expiry_risk", note: "4-day bakery shelf life at high spoilage risk." },
  { name: "Paneer 200g", sku: "DAI-007", dept: "Dairy, Bakery & Fresh", cost: 82, marginPct: 16, supplier: "Kaveri Cold Chain Dairy", lead: 1, shelf: 10, moq: 15, baseDaily: 8.8, stock: 34, profiles: ["PERISHABLE", "FESTIVAL"] },
  { name: "Fresh Fruit Juice 1L", sku: "DAI-008", dept: "Dairy, Bakery & Fresh", cost: 98, marginPct: 20, supplier: "Harvest Fresh Farms", lead: 2, shelf: 12, moq: 12, baseDaily: 6.2, stock: 108, profiles: ["PERISHABLE", "SUMMER"], planted: "expiry_risk", note: "Cold-pressed stock exceeds 12-day expiry horizon." },
  { name: "Bananas 1 Dozen", sku: "DAI-009", dept: "Dairy, Bakery & Fresh", cost: 48, marginPct: 18, supplier: "Harvest Fresh Farms", lead: 1, shelf: 3, moq: 15, baseDaily: 14, stock: 68, profiles: ["PERISHABLE"], planted: "expiry_risk", note: "3-day fresh produce life threatened by current stock." },
  { name: "Tomatoes 1kg", sku: "DAI-010", dept: "Dairy, Bakery & Fresh", cost: 32, marginPct: 19, supplier: "Harvest Fresh Farms", lead: 1, shelf: 5, moq: 20, baseDaily: 18.5, stock: 42, profiles: ["PERISHABLE", "STABLE"] },

  // 3. Beverages & Snacks (cost ₹10-400, margin 15-35%, lead 2-6d)
  { name: "Bottled Water 1L", sku: "BEV-001", dept: "Beverages & Snacks", cost: 12, marginPct: 35, supplier: "Deccan Beverage & Snacks Co.", lead: 2, shelf: null, moq: 48, baseDaily: 34, stock: 38, profiles: ["SUMMER", "STABLE"], planted: "frequent_stockout", note: "Chronic weekend & heatwave stockouts." },
  { name: "Soft Drink 2L", sku: "BEV-002", dept: "Beverages & Snacks", cost: 68, marginPct: 28, supplier: "Deccan Beverage & Snacks Co.", lead: 3, shelf: null, moq: 24, baseDaily: 16.5, stock: 22, profiles: ["SUMMER", "PROMO_DRIVEN", "FESTIVAL"], planted: "frequent_stockout", note: "High-velocity summer & promo SKU near zero shelf stock." },
  { name: "Energy Drink 250ml", sku: "BEV-003", dept: "Beverages & Snacks", cost: 85, marginPct: 32, supplier: "Deccan Beverage & Snacks Co.", lead: 4, shelf: null, moq: 24, baseDaily: 6.4, stock: 62, profiles: ["TREND_UP", "SUMMER"] },
  { name: "Potato Chips Large", sku: "BEV-004", dept: "Beverages & Snacks", cost: 34, marginPct: 30, supplier: "Deccan Beverage & Snacks Co.", lead: 3, shelf: null, moq: 30, baseDaily: 14.2, stock: 112, profiles: ["PROMO_DRIVEN", "STABLE"] },
  { name: "Chocolate Bar", sku: "BEV-005", dept: "Beverages & Snacks", cost: 28, marginPct: 32, supplier: "Malabar Roasters & Gourmet", lead: 4, shelf: null, moq: 36, baseDaily: 12.6, stock: 96, profiles: ["FESTIVAL", "PROMO_DRIVEN"] },
  { name: "Roasted Almonds 200g", sku: "BEV-006", dept: "Beverages & Snacks", cost: 215, marginPct: 26, supplier: "Malabar Roasters & Gourmet", lead: 5, shelf: null, moq: 12, baseDaily: 3.9, stock: 45, profiles: ["FESTIVAL", "WINTER"] },
  { name: "Coffee Beans 250g", sku: "BEV-007", dept: "Beverages & Snacks", cost: 295, marginPct: 32, supplier: "Malabar Roasters & Gourmet", lead: 6, shelf: null, moq: 10, baseDaily: 3.4, stock: 38, profiles: ["TREND_UP", "WINTER"] },
  { name: "Instant Coffee 100g", sku: "BEV-008", dept: "Beverages & Snacks", cost: 165, marginPct: 25, supplier: "Malabar Roasters & Gourmet", lead: 4, shelf: null, moq: 15, baseDaily: 4.9, stock: 54, profiles: ["STABLE", "WINTER"] },
  { name: "Ice Cream Tub 700ml", sku: "BEV-009", dept: "Beverages & Snacks", cost: 175, marginPct: 30, supplier: "Kaveri Cold Chain Dairy", lead: 2, shelf: 90, moq: 12, baseDaily: 8.6, stock: 9, profiles: ["SUMMER", "PROMO_DRIVEN"], planted: "frequent_stockout", note: "Freezer tub frequently runs dry during peak traffic." },
  { name: "Protein Bar", sku: "BEV-010", dept: "Beverages & Snacks", cost: 72, marginPct: 34, supplier: "Malabar Roasters & Gourmet", lead: 5, shelf: null, moq: 20, baseDaily: 5.5, stock: 52, profiles: ["TREND_UP", "STABLE"] },

  // 4. Personal Care (cost ₹30-300, margin 25-40%, lead 4-6d)
  { name: "Shampoo 340ml", sku: "PER-001", dept: "Personal Care", cost: 195, marginPct: 32, supplier: "Aura Botanics Personal Care", lead: 5, shelf: null, moq: 12, baseDaily: 4.8, stock: 48, profiles: ["PROMO_DRIVEN", "STABLE"] },
  { name: "Conditioner 180ml", sku: "PER-002", dept: "Personal Care", cost: 148, marginPct: 34, supplier: "Aura Botanics Personal Care", lead: 5, shelf: null, moq: 12, baseDaily: 3.2, stock: 36, profiles: ["PROMO_DRIVEN"] },
  { name: "Soap 4-pack", sku: "PER-003", dept: "Personal Care", cost: 112, marginPct: 26, supplier: "Aura Botanics Personal Care", lead: 4, shelf: null, moq: 20, baseDaily: 7.4, stock: 74, profiles: ["STABLE", "SUMMER"] },
  { name: "Toothpaste 150g", sku: "PER-004", dept: "Personal Care", cost: 78, marginPct: 28, supplier: "Aura Botanics Personal Care", lead: 4, shelf: null, moq: 24, baseDaily: 8.2, stock: 78, profiles: ["STABLE"] },
  { name: "Toothbrush", sku: "PER-005", dept: "Personal Care", cost: 34, marginPct: 38, supplier: "Aura Botanics Personal Care", lead: 4, shelf: null, moq: 24, baseDaily: 6.4, stock: 68, profiles: ["STABLE"] },
  { name: "Face Wash", sku: "PER-006", dept: "Personal Care", cost: 135, marginPct: 35, supplier: "VedaCare Wellness Labs", lead: 5, shelf: null, moq: 15, baseDaily: 4.6, stock: 52, profiles: ["SUMMER", "TREND_UP"] },
  { name: "Sunscreen SPF 50", sku: "PER-007", dept: "Personal Care", cost: 245, marginPct: 38, supplier: "VedaCare Wellness Labs", lead: 6, shelf: null, moq: 12, baseDaily: 5.2, stock: 11, profiles: ["SUMMER", "PROMO_DRIVEN"], planted: "frequent_stockout", note: "Chronic stockout risk ahead of 6-day lead time." },
  { name: "Body Lotion 400ml", sku: "PER-008", dept: "Personal Care", cost: 220, marginPct: 35, supplier: "VedaCare Wellness Labs", lead: 5, shelf: null, moq: 12, baseDaily: 4.1, stock: 46, profiles: ["WINTER"] },
  { name: "Deodorant", sku: "PER-009", dept: "Personal Care", cost: 145, marginPct: 36, supplier: "Aura Botanics Personal Care", lead: 5, shelf: null, moq: 18, baseDaily: 5.3, stock: 58, profiles: ["SUMMER", "PROMO_DRIVEN"] },
  { name: "Razor 5-pack", sku: "PER-010", dept: "Personal Care", cost: 175, marginPct: 32, supplier: "VedaCare Wellness Labs", lead: 5, shelf: null, moq: 12, baseDaily: 3.7, stock: 34, profiles: ["STABLE"], planted: "anomaly_shrinkage", note: "High-value pocket item flagged for theft/shrinkage gap." },

  // 5. Pharmacy & Wellness (cost ₹10-900, margin 20-35%, lead 3-7d, expiry 180-720d)
  { name: "Paracetamol Strip", sku: "PHM-001", dept: "Pharmacy & Wellness", cost: 18, marginPct: 28, supplier: "MedLine Pharma Distributors", lead: 3, shelf: 540, moq: 30, baseDaily: 11.4, stock: 95, profiles: ["STABLE", "MONSOON"] },
  { name: "Hand Sanitizer 500ml", sku: "PHM-002", dept: "Pharmacy & Wellness", cost: 125, marginPct: 32, supplier: "VedaCare Wellness Labs", lead: 4, shelf: 720, moq: 15, baseDaily: 3.1, stock: 45, profiles: ["TREND_DOWN", "STABLE"] },
  { name: "Multivitamin 60ct", sku: "PHM-003", dept: "Pharmacy & Wellness", cost: 340, marginPct: 34, supplier: "MedLine Pharma Distributors", lead: 5, shelf: 365, moq: 10, baseDaily: 0.45, stock: 142, profiles: ["SLOW_MOVER"], planted: "dead_stock", note: "Dead stock: near-zero velocity over last 45 days." },
  { name: "Cough Syrup 100ml", sku: "PHM-004", dept: "Pharmacy & Wellness", cost: 76, marginPct: 30, supplier: "MedLine Pharma Distributors", lead: 3, shelf: 365, moq: 15, baseDaily: 4.8, stock: 46, profiles: ["WINTER", "MONSOON"] },
  { name: "Bandage Pack", sku: "PHM-005", dept: "Pharmacy & Wellness", cost: 35, marginPct: 32, supplier: "MedLine Pharma Distributors", lead: 3, shelf: 720, moq: 24, baseDaily: 5.2, stock: 58, profiles: ["STABLE"] },
  { name: "Face Masks 50ct", sku: "PHM-006", dept: "Pharmacy & Wellness", cost: 145, marginPct: 25, supplier: "MedLine Pharma Distributors", lead: 4, shelf: 720, moq: 12, baseDaily: 2.4, stock: 44, profiles: ["TREND_DOWN"] },
  { name: "Digital Thermometer", sku: "PHM-007", dept: "Pharmacy & Wellness", cost: 280, marginPct: 35, supplier: "MedLine Pharma Distributors", lead: 6, shelf: 720, moq: 8, baseDaily: 0.35, stock: 88, profiles: ["SLOW_MOVER"], planted: "dead_stock", note: "Dead stock: stagnant unit turnover tying shelf capital." },
  { name: "ORS Sachets 10ct", sku: "PHM-008", dept: "Pharmacy & Wellness", cost: 92, marginPct: 28, supplier: "MedLine Pharma Distributors", lead: 3, shelf: 540, moq: 20, baseDaily: 5.1, stock: 52, profiles: ["SUMMER", "MONSOON"] },
  { name: "Vitamin C Tablets", sku: "PHM-009", dept: "Pharmacy & Wellness", cost: 160, marginPct: 32, supplier: "VedaCare Wellness Labs", lead: 4, shelf: 365, moq: 15, baseDaily: 3.6, stock: 44, profiles: ["WINTER", "TREND_UP"] },
  { name: "Pain Relief Spray", sku: "PHM-010", dept: "Pharmacy & Wellness", cost: 140, marginPct: 30, supplier: "VedaCare Wellness Labs", lead: 4, shelf: 540, moq: 12, baseDaily: 3.4, stock: 40, profiles: ["STABLE"] },

  // 6. Fashion & Apparel (cost ₹80-2500, margin 50-120%, lead 10-14d)
  { name: "Plain Cotton T-Shirt", sku: "FSH-001", dept: "Fashion & Apparel", cost: 240, marginPct: 85, supplier: "Vastra Loom Apparel", lead: 10, shelf: null, moq: 20, baseDaily: 4.4, stock: 95, profiles: ["SUMMER", "PROMO_DRIVEN"] },
  { name: "Regular Fit Jeans", sku: "FSH-002", dept: "Fashion & Apparel", cost: 680, marginPct: 95, supplier: "Vastra Loom Apparel", lead: 12, shelf: null, moq: 12, baseDaily: 1.8, stock: 265, profiles: ["WEDDING_SEASON", "SLOW_MOVER"], planted: "overstocked", note: "Overstocked (~145 days cover) locking up ₹1.8L capital." },
  { name: "Formal Shirt", sku: "FSH-003", dept: "Fashion & Apparel", cost: 520, marginPct: 90, supplier: "Vastra Loom Apparel", lead: 12, shelf: null, moq: 10, baseDaily: 2.1, stock: 58, profiles: ["WEDDING_SEASON", "FESTIVAL"] },
  { name: "Sneakers", sku: "FSH-004", dept: "Fashion & Apparel", cost: 1150, marginPct: 85, supplier: "MetroStride Footwear & Bags", lead: 14, shelf: null, moq: 8, baseDaily: 1.2, stock: 174, profiles: ["SLOW_MOVER", "TREND_UP"], planted: "overstocked", note: "Excess seasonal footwear size-run sitting in backroom." },
  { name: "Socks 3-pack", sku: "FSH-005", dept: "Fashion & Apparel", cost: 110, marginPct: 75, supplier: "Vastra Loom Apparel", lead: 10, shelf: null, moq: 24, baseDaily: 4.9, stock: 92, profiles: ["STABLE", "BACK_TO_SCHOOL"] },
  { name: "Innerwear 3-pack", sku: "FSH-006", dept: "Fashion & Apparel", cost: 210, marginPct: 65, supplier: "Vastra Loom Apparel", lead: 10, shelf: null, moq: 20, baseDaily: 4.5, stock: 86, profiles: ["STABLE"] },
  { name: "Leather Belt", sku: "FSH-007", dept: "Fashion & Apparel", cost: 290, marginPct: 90, supplier: "MetroStride Footwear & Bags", lead: 11, shelf: null, moq: 10, baseDaily: 1.9, stock: 48, profiles: ["WEDDING_SEASON"] },
  { name: "Handbag", sku: "FSH-008", dept: "Fashion & Apparel", cost: 740, marginPct: 105, supplier: "MetroStride Footwear & Bags", lead: 13, shelf: null, moq: 6, baseDaily: 1.5, stock: 42, profiles: ["FESTIVAL", "WEDDING_SEASON"] },
  { name: "Winter Jacket", sku: "FSH-009", dept: "Fashion & Apparel", cost: 1450, marginPct: 90, supplier: "Vastra Loom Apparel", lead: 14, shelf: null, moq: 6, baseDaily: 0.9, stock: 128, profiles: ["WINTER", "SLOW_MOVER"], planted: "overstocked", note: "Heavy overstock tying ₹1.85L cash ahead of winter close." },
  { name: "Kurta", sku: "FSH-010", dept: "Fashion & Apparel", cost: 490, marginPct: 110, supplier: "Vastra Loom Apparel", lead: 12, shelf: null, moq: 10, baseDaily: 2.3, stock: 56, profiles: ["FESTIVAL", "WEDDING_SEASON"] },

  // 7. Electronics & Accessories (cost ₹40-4000, margin 30-175%, lead 6-14d)
  { name: "Phone Charger 20W", sku: "ELC-001", dept: "Electronics & Accessories", cost: 280, marginPct: 110, supplier: "VoltEdge Tech Accessories", lead: 7, shelf: null, moq: 15, baseDaily: 5.6, stock: 14, profiles: ["STABLE", "TREND_UP"], planted: "frequent_stockout", note: "Frequent stockouts plus recent shrinkage discrepancy." },
  { name: "USB-C Cable", sku: "ELC-002", dept: "Electronics & Accessories", cost: 95, marginPct: 140, supplier: "VoltEdge Tech Accessories", lead: 6, shelf: null, moq: 25, baseDaily: 7.4, stock: 94, profiles: ["STABLE", "TREND_UP"] },
  { name: "Wireless Earbuds", sku: "ELC-003", dept: "Electronics & Accessories", cost: 890, marginPct: 95, supplier: "Apex Express Logistics", lead: 10, shelf: null, moq: 8, baseDaily: 2.6, stock: 46, profiles: ["TREND_UP", "FESTIVAL"], planted: "anomaly_typo_spike", note: "POS spike outlier (typo) + unreliable supplier delivery." },
  { name: "Power Bank 10000mAh", sku: "ELC-004", dept: "Electronics & Accessories", cost: 640, marginPct: 80, supplier: "Apex Express Logistics", lead: 9, shelf: null, moq: 10, baseDaily: 2.8, stock: 42, profiles: ["PROMO_DRIVEN", "FESTIVAL"], planted: "anomaly_bulk_spike", note: "Corporate bulk purchase spike + unreliable supplier risk." },
  { name: "Phone Case", sku: "ELC-005", dept: "Electronics & Accessories", cost: 75, marginPct: 165, supplier: "VoltEdge Tech Accessories", lead: 7, shelf: null, moq: 25, baseDaily: 6.2, stock: 88, profiles: ["STABLE"] },
  { name: "Screen Guard", sku: "ELC-006", dept: "Electronics & Accessories", cost: 42, marginPct: 175, supplier: "VoltEdge Tech Accessories", lead: 6, shelf: null, moq: 30, baseDaily: 8.1, stock: 102, profiles: ["STABLE"] },
  { name: "Memory Card 64GB", sku: "ELC-007", dept: "Electronics & Accessories", cost: 310, marginPct: 55, supplier: "VoltEdge Tech Accessories", lead: 8, shelf: null, moq: 12, baseDaily: 1.9, stock: 34, profiles: ["LAUNCH", "TREND_UP"], historyDays: 42, note: "Newly launched SKU (<8w history) using moving-average fallback." },
  { name: "Bluetooth Speaker", sku: "ELC-008", dept: "Electronics & Accessories", cost: 1120, marginPct: 75, supplier: "Apex Express Logistics", lead: 11, shelf: null, moq: 6, baseDaily: 1.5, stock: 32, profiles: ["FESTIVAL", "SLOW_MOVER"], note: "Affected by Apex Express late-delivery delays." },
  { name: "Smartwatch", sku: "ELC-009", dept: "Electronics & Accessories", cost: 1950, marginPct: 68, supplier: "VoltEdge Tech Accessories", lead: 12, shelf: null, moq: 5, baseDaily: 0.75, stock: 96, profiles: ["SLOW_MOVER", "FESTIVAL"], planted: "overstocked", note: "Overstocked wearable inventory locking ₹1.87L capital." },
  { name: "AA Batteries 8-pack", sku: "ELC-010", dept: "Electronics & Accessories", cost: 88, marginPct: 55, supplier: "VoltEdge Tech Accessories", lead: 6, shelf: null, moq: 20, baseDaily: 4.4, stock: 62, profiles: ["STABLE", "TREND_DOWN"] },

  // 8. Home & Kitchen (cost ₹40-1800, margin 30-110%, lead 5-10d)
  { name: "LED Bulb 9W", sku: "HOM-001", dept: "Home & Kitchen", cost: 52, marginPct: 75, supplier: "Gruha Living Homeware", lead: 5, shelf: null, moq: 30, baseDaily: 7.2, stock: 88, profiles: ["STABLE", "FESTIVAL"] },
  { name: "Double Bedsheet Set", sku: "HOM-002", dept: "Home & Kitchen", cost: 560, marginPct: 80, supplier: "Gruha Living Homeware", lead: 8, shelf: null, moq: 8, baseDaily: 2.0, stock: 42, profiles: ["WEDDING_SEASON", "FESTIVAL"] },
  { name: "Bath Towel", sku: "HOM-003", dept: "Home & Kitchen", cost: 210, marginPct: 65, supplier: "Gruha Living Homeware", lead: 6, shelf: null, moq: 12, baseDaily: 3.1, stock: 48, profiles: ["STABLE", "MONSOON"] },
  { name: "Storage Container Set", sku: "HOM-004", dept: "Home & Kitchen", cost: 280, marginPct: 70, supplier: "Gruha Living Homeware", lead: 7, shelf: null, moq: 10, baseDaily: 2.6, stock: 46, profiles: ["STABLE", "PROMO_DRIVEN"] },
  { name: "Steel Water Bottle", sku: "HOM-005", dept: "Home & Kitchen", cost: 240, marginPct: 68, supplier: "Gruha Living Homeware", lead: 6, shelf: null, moq: 12, baseDaily: 3.4, stock: 54, profiles: ["SUMMER", "BACK_TO_SCHOOL"] },
  { name: "Non-stick Pan", sku: "HOM-006", dept: "Home & Kitchen", cost: 490, marginPct: 72, supplier: "Apex Express Logistics", lead: 8, shelf: null, moq: 8, baseDaily: 1.9, stock: 34, profiles: ["WEDDING_SEASON", "FESTIVAL"], note: "Affected by Apex Express late-delivery delays." },
  { name: "Pressure Cooker 5L", sku: "HOM-007", dept: "Home & Kitchen", cost: 1280, marginPct: 58, supplier: "Apex Express Logistics", lead: 9, shelf: null, moq: 5, baseDaily: 0.9, stock: 24, profiles: ["SLOW_MOVER", "WEDDING_SEASON"], note: "Affected by Apex Express late-delivery delays." },
  { name: "Floor Cleaner 1L", sku: "HOM-008", dept: "Home & Kitchen", cost: 92, marginPct: 45, supplier: "Gruha Living Homeware", lead: 5, shelf: null, moq: 20, baseDaily: 5.4, stock: 68, profiles: ["STABLE", "MONSOON"] },
  { name: "Detergent Powder 2kg", sku: "HOM-009", dept: "Home & Kitchen", cost: 195, marginPct: 35, supplier: "Gruha Living Homeware", lead: 5, shelf: null, moq: 15, baseDaily: 4.8, stock: 58, profiles: ["STABLE"] },
  { name: "Dishwash Liquid 750ml", sku: "HOM-010", dept: "Home & Kitchen", cost: 105, marginPct: 42, supplier: "Gruha Living Homeware", lead: 5, shelf: null, moq: 20, baseDaily: 5.6, stock: 64, profiles: ["STABLE"] },

  // 9. Stationery & Books (cost ₹10-600, margin 25-85%, lead 3-6d)
  { name: "Notebook 200 pages", sku: "STN-001", dept: "Stationery & Books", cost: 42, marginPct: 55, supplier: "Vidya Paper & Stationery", lead: 4, shelf: null, moq: 30, baseDaily: 8.4, stock: 94, profiles: ["BACK_TO_SCHOOL", "STABLE"] },
  { name: "Ball Pens 10-pack", sku: "STN-002", dept: "Stationery & Books", cost: 48, marginPct: 60, supplier: "Vidya Paper & Stationery", lead: 3, shelf: null, moq: 30, baseDaily: 7.2, stock: 82, profiles: ["BACK_TO_SCHOOL", "STABLE"] },
  { name: "A4 Printer Paper 500 sheets", sku: "STN-003", dept: "Stationery & Books", cost: 210, marginPct: 32, supplier: "Vidya Paper & Stationery", lead: 4, shelf: null, moq: 15, baseDaily: 4.2, stock: 48, profiles: ["STABLE"] },
  { name: "Marker Set", sku: "STN-004", dept: "Stationery & Books", cost: 85, marginPct: 65, supplier: "Vidya Paper & Stationery", lead: 4, shelf: null, moq: 18, baseDaily: 2.9, stock: 42, profiles: ["BACK_TO_SCHOOL"] },
  { name: "Geometry Box", sku: "STN-005", dept: "Stationery & Books", cost: 92, marginPct: 58, supplier: "Vidya Paper & Stationery", lead: 4, shelf: null, moq: 15, baseDaily: 2.4, stock: 36, profiles: ["BACK_TO_SCHOOL"] },
  { name: "School Bag", sku: "STN-006", dept: "Stationery & Books", cost: 480, marginPct: 75, supplier: "MetroStride Footwear & Bags", lead: 6, shelf: null, moq: 8, baseDaily: 1.4, stock: 32, profiles: ["BACK_TO_SCHOOL"] },
  { name: "Highlighters 5-pack", sku: "STN-007", dept: "Stationery & Books", cost: 68, marginPct: 62, supplier: "Vidya Paper & Stationery", lead: 3, shelf: null, moq: 20, baseDaily: 2.8, stock: 42, profiles: ["LAUNCH", "BACK_TO_SCHOOL"], historyDays: 45, note: "New launch (<8w history) testing cold-start forecast." },
  { name: "Sticky Notes", sku: "STN-008", dept: "Stationery & Books", cost: 24, marginPct: 75, supplier: "Vidya Paper & Stationery", lead: 3, shelf: null, moq: 30, baseDaily: 5.5, stock: 68, profiles: ["STABLE"] },
  { name: "Stapler", sku: "STN-009", dept: "Stationery & Books", cost: 75, marginPct: 55, supplier: "Vidya Paper & Stationery", lead: 4, shelf: null, moq: 15, baseDaily: 1.9, stock: 34, profiles: ["STABLE"] },
  { name: "Children's Story Book", sku: "STN-010", dept: "Stationery & Books", cost: 135, marginPct: 68, supplier: "Vidya Paper & Stationery", lead: 5, shelf: null, moq: 12, baseDaily: 2.5, stock: 40, profiles: ["FESTIVAL", "BACK_TO_SCHOOL"] },

  // 10. Toys, Sports & Seasonal (cost ₹80-2000, margin 40-100%, lead 7-14d)
  { name: "Board Game", sku: "TOY-001", dept: "Toys, Sports & Seasonal", cost: 380, marginPct: 75, supplier: "CrestPlay Sports & Seasonal", lead: 8, shelf: null, moq: 8, baseDaily: 0.4, stock: 94, profiles: ["SLOW_MOVER", "FESTIVAL"], planted: "dead_stock", note: "Dead stock: stagnant shelf inventory outside gift season." },
  { name: "Soft Toy", sku: "TOY-002", dept: "Toys, Sports & Seasonal", cost: 260, marginPct: 85, supplier: "CrestPlay Sports & Seasonal", lead: 8, shelf: null, moq: 10, baseDaily: 1.8, stock: 42, profiles: ["FESTIVAL"] },
  { name: "Building Blocks", sku: "TOY-003", dept: "Toys, Sports & Seasonal", cost: 420, marginPct: 72, supplier: "CrestPlay Sports & Seasonal", lead: 9, shelf: null, moq: 8, baseDaily: 1.6, stock: 38, profiles: ["FESTIVAL", "TREND_UP"] },
  { name: "Cricket Bat", sku: "TOY-004", dept: "Toys, Sports & Seasonal", cost: 690, marginPct: 65, supplier: "CrestPlay Sports & Seasonal", lead: 10, shelf: null, moq: 6, baseDaily: 1.4, stock: 32, profiles: ["SUMMER", "BACK_TO_SCHOOL"] },
  { name: "Football", sku: "TOY-005", dept: "Toys, Sports & Seasonal", cost: 380, marginPct: 68, supplier: "CrestPlay Sports & Seasonal", lead: 9, shelf: null, moq: 8, baseDaily: 1.7, stock: 36, profiles: ["MONSOON", "BACK_TO_SCHOOL"] },
  { name: "Badminton Racket Set", sku: "TOY-006", dept: "Toys, Sports & Seasonal", cost: 520, marginPct: 70, supplier: "CrestPlay Sports & Seasonal", lead: 10, shelf: null, moq: 6, baseDaily: 1.3, stock: 30, profiles: ["WINTER", "STABLE"] },
  { name: "Yoga Mat", sku: "TOY-007", dept: "Toys, Sports & Seasonal", cost: 340, marginPct: 78, supplier: "Apex Express Logistics", lead: 9, shelf: null, moq: 10, baseDaily: 2.2, stock: 38, profiles: ["TREND_UP", "STABLE"], note: "Affected by Apex Express late-delivery delays." },
  { name: "Diwali Decorative Lights", sku: "TOY-008", dept: "Toys, Sports & Seasonal", cost: 165, marginPct: 95, supplier: "CrestPlay Sports & Seasonal", lead: 12, shelf: null, moq: 20, baseDaily: 2.8, stock: 19, profiles: ["FESTIVAL"], planted: "demand_surge", note: "Sharp pre-Diwali demand surge draining shelf stock." },
  { name: "Christmas Tree Decor", sku: "TOY-009", dept: "Toys, Sports & Seasonal", cost: 480, marginPct: 90, supplier: "CrestPlay Sports & Seasonal", lead: 14, shelf: null, moq: 8, baseDaily: 1.1, stock: 165, profiles: ["FESTIVAL", "WINTER", "SLOW_MOVER"], planted: "overstocked", note: "Overstocked seasonal decor inventory sitting past peak." },
  { name: "Umbrella", sku: "TOY-010", dept: "Toys, Sports & Seasonal", cost: 195, marginPct: 80, supplier: "CrestPlay Sports & Seasonal", lead: 8, shelf: null, moq: 15, baseDaily: 3.1, stock: 18, profiles: ["MONSOON"], planted: "demand_surge", note: "Early monsoon demand surge outpacing current shelf stock." },
];

let MEMOIZED_DEMO_PRODUCTS: Product[] | null = null;

export function generateDemoProducts(forceRegenerate = false): Product[] {
  if (MEMOIZED_DEMO_PRODUCTS && !forceRegenerate) {
    return MEMOIZED_DEMO_PRODUCTS.map((p) => ({ ...p }));
  }

  const generated = RAW_SPECS.map((spec, idx) => {
    const id = slugify(spec.name);
    const rng = createRng(7400 + idx * 193);
    const historyDays = spec.historyDays ?? 730;
    const sellingPrice = Math.round(spec.cost * (1 + spec.marginPct / 100));
    const supplierLateRisk = spec.supplier === UNRELIABLE_SUPPLIER;

    // Compose profile templates
    const templates = spec.profiles.map((tag) => DEMAND_PROFILE_TEMPLATES[tag]);
    const avgNoise =
      templates.reduce((s, t) => s + t.noiseSigma, 0) / templates.length;
    const maxWeekendLift = Math.max(...templates.map((t) => t.weekendLift));
    const combinedTrend =
      templates.reduce((s, t) => s + t.trendPerYear, 0) / templates.length;
    const zeroDayChance = Math.max(...templates.map((t) => t.zeroDayChance));
    const promoFreq = templates.find((t) => t.promoFreqDays > 0)?.promoFreqDays ?? 0;
    const promoBoost = templates.find((t) => t.promoFreqDays > 0)?.promoBoost ?? 1;

    const dailySales: DailySaleRecord[] = new Array(historyDays);
    let simStock = Math.round(spec.baseDaily * 18);

    for (let i = 0; i < historyDays; i++) {
      const offset = historyDays - 1 - i;
      const date = new Date(REFERENCE_TODAY);
      date.setDate(date.getDate() - offset);
      const dateStr = formatDateISO(date);
      const m = date.getMonth();
      const d = date.getDate();

      const yearsElapsed = i / 365;
      const trendMult = Math.max(0.45, 1 + combinedTrend * yearsElapsed);

      let seasonFactor = 1;
      let festivalTag: string | undefined;
      for (const tpl of templates) {
        const res = tpl.seasonMultiplier(m, d);
        seasonFactor *= res.factor;
        if (res.tag) festivalTag = res.tag;
      }
      seasonFactor = Math.min(2.2, Math.max(0.45, seasonFactor));

      const dow = date.getDay();
      const isWeekend = dow === 0 || dow === 5 || dow === 6;
      const weeklyMult = isWeekend
        ? 1 + maxWeekendLift
        : 1 - maxWeekendLift * 0.25;

      const isPromo =
        promoFreq > 0 && offset % promoFreq >= 1 && offset % promoFreq <= 4;
      const promoMult = isPromo ? promoBoost : 1;

      const u1 = Math.max(1e-6, rng());
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const noiseMult = Math.max(0.3, 1 + z * avgNoise);

      let demandMult =
        trendMult * seasonFactor * weeklyMult * promoMult * noiseMult;

      // Planted story behaviors in recent window
      if (spec.planted === "dead_stock" && offset < 45) {
        demandMult *= 0.08;
      } else if (spec.planted === "demand_surge" && offset < 18) {
        demandMult *= 2.15;
      }

      let unitsSold =
        zeroDayChance > 0 && rng() < zeroDayChance
          ? 0
          : Math.max(0, Math.round(spec.baseDaily * demandMult));

      if (simStock < spec.baseDaily * (spec.lead + 2)) {
        simStock += Math.max(spec.moq, Math.round(spec.baseDaily * 15));
      }

      const price = isPromo ? Math.round(sellingPrice * 0.9) : sellingPrice;
      let recordedStock = Math.max(0, simStock - unitsSold);

      // Planted anomalies in recent 45 days
      if (spec.planted === "anomaly_typo_spike" && offset === 9) {
        // Wireless Earbuds typo spike
        unitsSold = Math.max(24, Math.round(spec.baseDaily * 8.5));
      }
      if (spec.planted === "anomaly_bulk_spike" && offset === 14) {
        // Power Bank corporate bulk purchase spike
        unitsSold = Math.max(18, Math.round(spec.baseDaily * 5.8));
      }
      if (spec.planted === "anomaly_negative_stock" && offset === 6) {
        // Cooking Oil negative stock ledger error
        recordedStock = -9;
      }
      if (
        spec.planted === "anomaly_missing_gap" &&
        offset >= 7 &&
        offset <= 10
      ) {
        // Sugar 1kg missing-data gap (4 consecutive zero-sales days)
        unitsSold = 0;
      }
      if (
        (spec.planted === "anomaly_shrinkage" || id === "phone-charger-20w") &&
        offset === 4
      ) {
        // Phone Charger 20W & Razor 5-pack theft/shrinkage
        recordedStock = Math.max(0, recordedStock - 28);
      }

      simStock = Math.max(0, recordedStock);
      if (offset === 0) {
        recordedStock = spec.stock;
      }

      dailySales[i] = {
        date: dateStr,
        unitsSold,
        price,
        stockOnHand: recordedStock,
        isPromo,
        festivalTag,
      };
    }

    return {
      id,
      name: spec.name,
      sku: spec.sku,
      category: spec.dept,
      unitCost: spec.cost,
      sellingPrice,
      currentStock: spec.stock,
      moq: spec.moq,
      supplier: spec.supplier,
      supplierLateRisk,
      leadTimeDays: spec.lead,
      shelfLifeDays: spec.shelf,
      demandProfiles: spec.profiles,
      imageUrl: getProductImageUrl(id, spec.name, spec.dept),
      dailySales,
      notes: spec.note,
      plantedIssue: spec.planted,
    };
  });

  MEMOIZED_DEMO_PRODUCTS = generated;
  return generated.map((p) => ({ ...p }));
}
