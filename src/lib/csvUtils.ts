import {
  ALL_DEPARTMENTS,
  CsvValidationReport,
  DailySaleRecord,
  Product,
  ProductCategory,
  SupplierPurchaseOrder,
} from "../types/inventory";
import { getProductImageUrl } from "./productArtwork";

export const CSV_TEMPLATE_CONTENT = [
  "date,product,units_sold,price,stock_on_hand,category,unit_cost,supplier,lead_time_days,shelf_life_days,moq",
  "2026-10-01,Basmati Rice 5kg,7,566,74,Grocery Staples,480,Annapurna Agro & Staples,4,365,12",
  "2026-10-02,Basmati Rice 5kg,8,566,66,Grocery Staples,480,Annapurna Agro & Staples,4,365,12",
  "2026-10-03,Basmati Rice 5kg,9,566,57,Grocery Staples,480,Annapurna Agro & Staples,4,365,12",
  "2026-10-01,Packaged Milk 1L,24,60,65,Dairy, Bakery & Fresh,54,Kaveri Cold Chain Dairy,1,4,24",
  "2026-10-02,Packaged Milk 1L,26,60,39,Dairy, Bakery & Fresh,54,Kaveri Cold Chain Dairy,1,4,24",
].join("\n");

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/csv;charset=utf-8;"
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface CsvParseResult {
  products: Product[];
  report: CsvValidationReport;
}

const VALID_CATEGORIES_SET = new Set<string>(ALL_DEPARTMENTS);

function resolveDepartment(raw?: string): ProductCategory {
  if (!raw) return "Grocery Staples";
  if (VALID_CATEGORIES_SET.has(raw)) return raw as ProductCategory;
  const lower = raw.toLowerCase();
  const matched = ALL_DEPARTMENTS.find((d) =>
    d.toLowerCase().includes(lower.split(" ")[0])
  );
  return matched ?? "Grocery Staples";
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses and validates user-uploaded CSV files up to 100 products.
 * Validates each row individually, tracking accepted rows, rejected rows, and exact reasons.
 */
export function parseAndValidateCsv(
  csvText: string,
  fileName = "upload.csv"
): CsvParseResult {
  const rawLines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (rawLines.length < 2) {
    throw new Error(
      "The CSV file appears empty or has no data rows. Please include a header row and at least one sales record."
    );
  }

  const headers = splitCsvLine(rawLines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_")
  );

  const requiredCols = ["date", "product", "units_sold", "price", "stock_on_hand"];
  const missingCols = requiredCols.filter((c) => !headers.includes(c));
  if (missingCols.length > 0) {
    throw new Error(
      `Missing required column(s): ${missingCols.join(", ")}. Expected at least: date, product, units_sold, price, stock_on_hand.`
    );
  }

  const idx = {
    date: headers.indexOf("date"),
    product: headers.indexOf("product"),
    unitsSold: headers.indexOf("units_sold"),
    price: headers.indexOf("price"),
    stockOnHand: headers.indexOf("stock_on_hand"),
    category: headers.indexOf("category"),
    unitCost: headers.indexOf("unit_cost"),
    supplier: headers.indexOf("supplier"),
    leadTime: headers.indexOf("lead_time_days"),
    shelfLife: headers.indexOf("shelf_life_days"),
    moq: headers.indexOf("moq"),
    sku: headers.indexOf("sku"),
  };

  const grouped = new Map<
    string,
    {
      records: DailySaleRecord[];
      category?: ProductCategory;
      unitCost?: number;
      supplier?: string;
      leadTimeDays?: number;
      shelfLifeDays?: number | null;
      moq?: number;
      sku?: string;
    }
  >();

  const rejectionReasons: Array<{ rowNumber: number; reason: string }> = [];
  const warnings: string[] = [];
  let acceptedRows = 0;
  let rejectedRows = 0;
  const MAX_PRODUCTS = 100;
  let productCapWarned = false;

  for (let i = 1; i < rawLines.length; i++) {
    const rowNumber = i + 1;
    const cols = splitCsvLine(rawLines[i]);
    if (cols.length < 5) {
      rejectedRows++;
      rejectionReasons.push({
        rowNumber,
        reason: "Fewer than 5 required columns.",
      });
      continue;
    }

    const dateRaw = cols[idx.date];
    const productName = cols[idx.product];
    const unitsRaw = Number(cols[idx.unitsSold]);
    const priceRaw = Number(cols[idx.price]);
    const stockRaw = Number(cols[idx.stockOnHand]);

    const parsedDate = new Date(dateRaw);
    if (!dateRaw || Number.isNaN(parsedDate.getTime())) {
      rejectedRows++;
      rejectionReasons.push({
        rowNumber,
        reason: `Invalid date "${dateRaw}" (expected YYYY-MM-DD).`,
      });
      continue;
    }
    const isoDate = parsedDate.toISOString().slice(0, 10);

    if (!productName) {
      rejectedRows++;
      rejectionReasons.push({
        rowNumber,
        reason: "Missing product name.",
      });
      continue;
    }
    if (Number.isNaN(unitsRaw) || unitsRaw < 0) {
      rejectedRows++;
      rejectionReasons.push({
        rowNumber,
        reason: `Invalid units_sold "${cols[idx.unitsSold]}" for ${productName} (must be ≥ 0).`,
      });
      continue;
    }
    if (Number.isNaN(priceRaw) || priceRaw <= 0) {
      rejectedRows++;
      rejectionReasons.push({
        rowNumber,
        reason: `Invalid price "${cols[idx.price]}" for ${productName} (must be > 0).`,
      });
      continue;
    }
    if (Number.isNaN(stockRaw)) {
      rejectedRows++;
      rejectionReasons.push({
        rowNumber,
        reason: `Invalid stock_on_hand "${cols[idx.stockOnHand]}" for ${productName}.`,
      });
      continue;
    }

    if (!grouped.has(productName) && grouped.size >= MAX_PRODUCTS) {
      rejectedRows++;
      if (!productCapWarned) {
        warnings.push(
          `CSV exceeded the ${MAX_PRODUCTS}-product limit; additional unique products were skipped.`
        );
        productCapWarned = true;
      }
      rejectionReasons.push({
        rowNumber,
        reason: `Product "${productName}" skipped (exceeds 100-product upload limit).`,
      });
      continue;
    }

    const entry = grouped.get(productName) ?? { records: [] };
    entry.records.push({
      date: isoDate,
      unitsSold: Math.round(unitsRaw),
      price: Number(priceRaw.toFixed(2)),
      stockOnHand: Math.round(stockRaw),
    });

    if (idx.category >= 0 && cols[idx.category]) {
      entry.category = resolveDepartment(cols[idx.category]);
    }
    if (
      idx.unitCost >= 0 &&
      cols[idx.unitCost] &&
      !Number.isNaN(Number(cols[idx.unitCost]))
    ) {
      entry.unitCost = Number(cols[idx.unitCost]);
    }
    if (idx.supplier >= 0 && cols[idx.supplier]) {
      entry.supplier = cols[idx.supplier];
    }
    if (
      idx.leadTime >= 0 &&
      cols[idx.leadTime] &&
      !Number.isNaN(Number(cols[idx.leadTime]))
    ) {
      entry.leadTimeDays = Math.max(1, Math.round(Number(cols[idx.leadTime])));
    }
    if (idx.shelfLife >= 0 && cols[idx.shelfLife]) {
      const sl = Number(cols[idx.shelfLife]);
      entry.shelfLifeDays = !Number.isNaN(sl) && sl > 0 ? Math.round(sl) : null;
    }
    if (idx.moq >= 0 && cols[idx.moq] && !Number.isNaN(Number(cols[idx.moq]))) {
      entry.moq = Math.max(1, Math.round(Number(cols[idx.moq])));
    }
    if (idx.sku >= 0 && cols[idx.sku]) {
      entry.sku = cols[idx.sku];
    }

    grouped.set(productName, entry);
    acceptedRows++;
  }

  if (grouped.size === 0) {
    throw new Error(
      rejectionReasons.length > 0
        ? `No valid rows found (${rejectionReasons.length} rejected). First error at row ${rejectionReasons[0].rowNumber}: ${rejectionReasons[0].reason}`
        : "No valid data rows could be parsed from the uploaded CSV."
    );
  }

  const products: Product[] = Array.from(grouped.entries()).map(
    ([name, data], index) => {
      const sorted = data.records.sort((a, b) => a.date.localeCompare(b.date));
      const latest = sorted[sorted.length - 1];
      const avgPrice =
        sorted.reduce((sum, r) => sum + r.price, 0) / sorted.length;
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const dept = data.category ?? "Grocery Staples";
      const id = `${slug}-${index + 1}`;

      if (sorted.length < 28 && warnings.length < 8) {
        warnings.push(
          `${name} has ${sorted.length} daily rows — Inventra will apply sparse moving-average fallback.`
        );
      }

      return {
        id,
        name,
        sku: data.sku ?? `CSV-${String(index + 1).padStart(3, "0")}`,
        category: dept,
        unitCost: data.unitCost ?? Math.round(avgPrice * 0.7),
        sellingPrice: Number(avgPrice.toFixed(2)),
        currentStock: Math.max(0, latest.stockOnHand),
        moq: data.moq ?? 10,
        supplier: data.supplier ?? "Primary Local Distributor",
        leadTimeDays: data.leadTimeDays ?? 4,
        shelfLifeDays: data.shelfLifeDays ?? null,
        demandProfiles: sorted.length < 56 ? ["LAUNCH"] : ["STABLE"],
        imageUrl: getProductImageUrl(id, name, dept),
        dailySales: sorted,
        notes: "Imported via CSV upload.",
      };
    }
  );

  return {
    products,
    report: {
      fileName,
      totalRows: rawLines.length - 1,
      acceptedRows,
      rejectedRows,
      productsCount: products.length,
      rejectionReasons: rejectionReasons.slice(0, 50),
      warnings,
    },
  };
}

export function exportPurchaseOrdersCsv(orders: SupplierPurchaseOrder[]) {
  const lines: string[] = [
    "# Inventra — Consolidated Supplier Purchase Plan",
    `# Generated: ${new Date().toISOString().slice(0, 10)}`,
    "supplier,expected_delivery,sku,product,moq,current_stock,reorder_point,order_qty,unit_cost,line_total,status",
  ];

  for (const po of orders) {
    for (const line of po.lines) {
      if (line.selectedQty <= 0) continue;
      lines.push(
        [
          `"${po.supplier.replace(/"/g, '""')}"`,
          `"${po.expectedDeliveryDate}"`,
          line.sku,
          `"${line.productName.replace(/"/g, '""')}"`,
          line.moq,
          line.currentStock,
          line.reorderPoint,
          line.selectedQty,
          line.unitCost,
          line.lineTotal,
          line.healthStatus,
        ].join(",")
      );
    }
  }

  downloadTextFile(
    `inventra-purchase-plan-${new Date().toISOString().slice(0, 10)}.csv`,
    lines.join("\n")
  );
}
