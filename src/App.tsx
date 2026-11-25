import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Compass,
  Database,
  Globe,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Moon,
  Package,
  PhoneCall,
  SlidersHorizontal,
  Sun,
  X,
} from "lucide-react";
import { generateDemoProducts } from "./data/demoData";
import { computeAllSummariesAsync, forecastProduct } from "./lib/forecasting";
import { buildProductSummary, optimizeProductInventory } from "./lib/inventoryMath";
import { detectAnomalies } from "./lib/anomalies";
import { LanguageProvider, useLanguage } from "./lib/LanguageContext";
import { LANGUAGE_OPTIONS } from "./lib/i18n";
import { BackgroundVariant } from "./lib/themeTokens";
import {
  ForecastResult,
  OptimizationResult,
  Product,
  ProductSummary,
} from "./types/inventory";
import { InventraLogo } from "./components/InventraLogo";
import { RoyalAtmosphere } from "./components/RoyalAtmosphere";
import { DashboardView } from "./components/DashboardView";
import { ForecastsView } from "./components/ForecastsView";
import { InventoryView } from "./components/InventoryView";
import { ScenariosView } from "./components/ScenariosView";
import { AlertsView } from "./components/AlertsView";
import { AdvisorView } from "./components/AdvisorView";
import { DataView } from "./components/DataView";
import { DemoTourModal, NavTab, TOUR_STEPS } from "./components/DemoTourModal";
import { EmergencyHelplineModal } from "./components/EmergencyHelplineModal";

const STORAGE_KEY_STOCK_OVERRIDES = "inventra_stock_overrides_v3";
const STORAGE_KEY_THEME = "inventra_theme_v1";
const STORAGE_KEY_REDUCE_EFFECTS = "inventra_reduce_effects_v1";
const STORAGE_KEY_DISMISSED = "inventra_dismissed_alerts_v1";
const STORAGE_KEY_EXCLUDED = "inventra_excluded_outliers_v1";

const NAV_ITEMS: Array<{
  id: NavTab;
  group: "analytics" | "operations";
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", group: "analytics", icon: LayoutDashboard },
  { id: "forecasts", group: "analytics", icon: BarChart3 },
  { id: "inventory", group: "analytics", icon: Package },
  { id: "scenarios", group: "analytics", icon: SlidersHorizontal },
  { id: "alerts", group: "operations", icon: AlertTriangle },
  { id: "advisor", group: "operations", icon: MessageSquareText },
  { id: "data", group: "operations", icon: Database },
];

const TAB_BG_VARIANT: Record<NavTab, BackgroundVariant> = {
  dashboard: "full",
  alerts: "full",
  forecasts: "calm",
  scenarios: "calm",
  inventory: "flat",
  data: "flat",
  advisor: "nebula",
};

function loadStockOverrides(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STOCK_OVERRIDES);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function getExcludedDatesForProduct(
  excludedOutlierKeys: Set<string>,
  productId: string
): Set<string> {
  const excluded = new Set<string>();
  const prefix = `${productId}::`;
  excludedOutlierKeys.forEach((key) => {
    if (key.startsWith(prefix)) {
      excluded.add(key.slice(prefix.length));
    }
  });
  return excluded;
}

function AppShell() {
  const { language, setLanguage, t } = useLanguage();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === "dark") return true;
      if (saved === "light") return false;
      if (typeof window !== "undefined" && window.matchMedia) {
        return !window.matchMedia("(prefers-color-scheme: light)").matches;
      }
      return true;
    } catch {
      return true;
    }
  });

  const [reduceEffects, setReduceEffects] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_REDUCE_EFFECTS) === "true";
    } catch {
      return false;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const demoDefaults = generateDemoProducts();
    const overrides = loadStockOverrides();
    if (Object.keys(overrides).length === 0) return demoDefaults;
    return demoDefaults.map((p) =>
      typeof overrides[p.id] === "number" ? { ...p, currentStock: overrides[p.id] } : p
    );
  });

  const [datasetRevision, setDatasetRevision] = useState(0);
  const [isDemoData, setIsDemoData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    () => products[0]?.id ?? "basmati-rice-5kg"
  );
  const [horizonWeeks, setHorizonWeeks] = useState<4 | 8 | 12>(8);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [summaries, setSummaries] = useState<Map<string, ProductSummary>>(() => new Map());
  const [computeProgress, setComputeProgress] = useState<number>(0);
  const [isComputing, setIsComputing] = useState<boolean>(true);

  const [bulkPoSelectedIds, setBulkPoSelectedIds] = useState<Set<string>>(() => new Set());

  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISMISSED);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const [excludedOutlierKeys, setExcludedOutlierKeys] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXCLUDED);
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const [customPoQuantities, setCustomPoQuantities] = useState<Map<string, number>>(
    () => new Map()
  );

  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [helplineOpen, setHelplineOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, darkMode ? "dark" : "light");
    } catch {
      // Ignore storage quota errors
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_REDUCE_EFFECTS,
        reduceEffects ? "true" : "false"
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [reduceEffects]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_DISMISSED,
        JSON.stringify(Array.from(dismissedAlertIds))
      );
    } catch {
      // Ignore
    }
  }, [dismissedAlertIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_EXCLUDED,
        JSON.stringify(Array.from(excludedOutlierKeys))
      );
    } catch {
      // Ignore
    }
  }, [excludedOutlierKeys]);

  // Async chunked analytics across all 100 SKUs (~73k daily rows) with progress indicator
  useEffect(() => {
    const signal = { cancelled: false };
    setIsComputing(true);
    setComputeProgress(5);

    void computeAllSummariesAsync(
      products,
      horizonWeeks,
      excludedOutlierKeys,
      (pct) => {
        if (!signal.cancelled) setComputeProgress(pct);
      },
      signal
    ).then((result) => {
      if (!signal.cancelled && result.size > 0) {
        setSummaries(result);
        setComputeProgress(100);
        setIsComputing(false);
      }
    });

    return () => {
      signal.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetRevision, horizonWeeks, excludedOutlierKeys]);

  const safeSelectedId = useMemo(() => {
    if (products.some((p) => p.id === selectedProductId)) {
      return selectedProductId;
    }
    return products[0]?.id ?? "";
  }, [products, selectedProductId]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === safeSelectedId) ?? products[0],
    [products, safeSelectedId]
  );

  // Lazy full-detail forecast & optimization computed ONLY for the active SKU
  const selectedForecast: ForecastResult | undefined = useMemo(() => {
    if (!selectedProduct) return undefined;
    const excluded = getExcludedDatesForProduct(excludedOutlierKeys, selectedProduct.id);
    return forecastProduct(selectedProduct, horizonWeeks, excluded);
  }, [selectedProduct, horizonWeeks, excludedOutlierKeys]);

  const selectedOptimization: OptimizationResult | undefined = useMemo(() => {
    if (!selectedProduct || !selectedForecast) return undefined;
    return optimizeProductInventory(selectedProduct, selectedForecast);
  }, [selectedProduct, selectedForecast]);

  const anomalies = useMemo(
    () => detectAnomalies(products, dismissedAlertIds, excludedOutlierKeys),
    [products, dismissedAlertIds, excludedOutlierKeys]
  );

  const activeAlertsCount = useMemo(
    () => anomalies.filter((a) => !a.dismissed).length,
    [anomalies]
  );

  const criticalAlertsCount = useMemo(
    () =>
      anomalies.filter((a) => !a.dismissed && a.severityLabel === "Critical").length,
    [anomalies]
  );

  const handleNavigate = (tab: NavTab, productId?: string) => {
    setActiveTab(tab);
    if (productId) setSelectedProductId(productId);
    setMobileMenuOpen(false);
  };

  const handleLoadDemoData = () => {
    const fresh = generateDemoProducts();
    try {
      localStorage.removeItem(STORAGE_KEY_STOCK_OVERRIDES);
    } catch {
      // Ignore
    }
    setProducts(fresh);
    setIsDemoData(true);
    setSelectedProductId(fresh[0].id);
    setDismissedAlertIds(new Set());
    setExcludedOutlierKeys(new Set());
    setCustomPoQuantities(new Map());
    setBulkPoSelectedIds(new Set());
    setDatasetRevision((r) => r + 1);
  };

  const handleImportProducts = (imported: Product[]) => {
    setProducts(imported);
    setIsDemoData(false);
    setSelectedProductId(imported[0]?.id ?? "");
    setDismissedAlertIds(new Set());
    setExcludedOutlierKeys(new Set());
    setCustomPoQuantities(new Map());
    setBulkPoSelectedIds(new Set());
    setDatasetRevision((r) => r + 1);
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    let updatedProduct: Product | undefined;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedProduct = { ...p, currentStock: newStock };
          return updatedProduct;
        }
        return p;
      })
    );

    if (isDemoData) {
      try {
        const overrides = loadStockOverrides();
        overrides[productId] = newStock;
        localStorage.setItem(STORAGE_KEY_STOCK_OVERRIDES, JSON.stringify(overrides));
      } catch {
        // Ignore
      }
    }

    setSummaries((prev) => {
      const existing = prev.get(productId);
      const targetProd =
        updatedProduct ??
        (() => {
          const found = products.find((p) => p.id === productId);
          return found ? { ...found, currentStock: newStock } : undefined;
        })();
      if (!targetProd || !existing) return prev;
      const excluded = getExcludedDatesForProduct(excludedOutlierKeys, productId);
      const fc = forecastProduct(targetProd, horizonWeeks, excluded);
      const opt = optimizeProductInventory(targetProd, fc);
      const nextMap = new Map(prev);
      nextMap.set(
        productId,
        buildProductSummary(
          targetProd,
          fc,
          opt,
          existing.cov,
          existing.abcClass,
          existing.xyzClass,
          existing.sparkline12w
        )
      );
      return nextMap;
    });
  };

  const handleToggleDismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(alertId)) next.delete(alertId);
      else next.add(alertId);
      return next;
    });
  };

  const handleToggleExcludeOutlier = (productId: string, date: string) => {
    const key = `${productId}::${date}`;
    setExcludedOutlierKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleUpdatePoQuantity = (productId: string, qty: number) => {
    setCustomPoQuantities((prev) => {
      const next = new Map(prev);
      next.set(productId, qty);
      return next;
    });
  };

  const handleStartTour = () => {
    setTourStep(0);
    setTourOpen(true);
    const first = TOUR_STEPS[0];
    setActiveTab(first.targetTab);
    if (first.targetProductId && products.some((p) => p.id === first.targetProductId)) {
      setSelectedProductId(first.targetProductId);
    }
  };

  const handleSelectTourStep = (index: number) => {
    setTourStep(index);
    const step = TOUR_STEPS[index];
    if (!step) return;
    setActiveTab(step.targetTab);
    if (step.targetProductId && products.some((p) => p.id === step.targetProductId)) {
      setSelectedProductId(step.targetProductId);
    }
  };

  const activeNavMeta = NAV_ITEMS.find((n) => n.id === activeTab) ?? NAV_ITEMS[0];
  const bgVariant = TAB_BG_VARIANT[activeTab] ?? "full";

  return (
    <div className="relative min-h-screen text-[#14112B] dark:text-[#F3EFE6]">
      {/* Pure-CSS Midnight Royal Atmosphere rendered once behind all content */}
      <RoyalAtmosphere
        variant={bgVariant}
        hasCriticalAlerts={activeTab === "alerts" && criticalAlertsCount > 0}
        reduceEffects={reduceEffects}
      />

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#07070F]/75 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Midnight Royal Executive Sidebar */}
      <aside
        aria-label="Primary navigation"
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#2A2A44] bg-[#0E0A24] text-[#F3EFE6] transition-transform duration-200 dark:bg-[#06050F] lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#2A2A44] px-5 py-4">
          <InventraLogo showTagline surface="dark" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-[#A09CB5] hover:bg-[#1A1A2E] hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto p-3.5">
          <div>
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-[#A09CB5]">
              {t.navGroups.analytics}
            </p>
            <div className="space-y-1">
              {NAV_ITEMS.filter((i) => i.group === "analytics").map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`relative flex min-h-[40px] w-full items-center justify-between overflow-hidden rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F] ${
                      isActive
                        ? "bg-[#4B3FD6]/25 font-semibold text-white ring-1 ring-[#8B7CFF]/35"
                        : "font-medium text-[#A09CB5] hover:bg-[#1A1A2E]/70 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#E3C16F]"
                      />
                    )}
                    <span className="flex items-center gap-3 whitespace-nowrap">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-[#E3C16F]" : "text-[#A09CB5]"
                        }`}
                        aria-hidden="true"
                      />
                      <span>{t.nav[item.id]}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 pb-1.5 text-[11px] font-semibold text-[#A09CB5]">
              {t.navGroups.operations}
            </p>
            <div className="space-y-1">
              {NAV_ITEMS.filter((i) => i.group === "operations").map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`relative flex min-h-[40px] w-full items-center justify-between overflow-hidden rounded-lg px-3 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F] ${
                      isActive
                        ? "bg-[#4B3FD6]/25 font-semibold text-white ring-1 ring-[#8B7CFF]/35"
                        : "font-medium text-[#A09CB5] hover:bg-[#1A1A2E]/70 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-[#E3C16F]"
                      />
                    )}
                    <span className="flex items-center gap-3 whitespace-nowrap">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-[#E3C16F]" : "text-[#A09CB5]"
                        }`}
                        aria-hidden="true"
                      />
                      <span>{t.nav[item.id]}</span>
                    </span>
                    {item.id === "alerts" && activeAlertsCount > 0 && (
                      <span className="font-mono text-xs font-semibold text-[#E5484D] tabular-nums">
                        {activeAlertsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="space-y-2.5 border-t border-[#2A2A44] p-4">
          <button
            type="button"
            onClick={() => {
              setHelplineOpen(true);
              setMobileMenuOpen(false);
            }}
            className="btn-lavish-emergency flex min-h-[42px] w-full items-center justify-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D] whitespace-nowrap"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
              <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="truncate">{t.header.emergencyHelpline}</span>
          </button>

          <button
            type="button"
            onClick={handleStartTour}
            className="btn-lavish-glass flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F]"
          >
            <Compass className="h-4 w-4 shrink-0 text-[#E3C16F]" aria-hidden="true" />
            <span className="truncate">{t.header.startTourSidebar}</span>
          </button>
          <p className="pt-0.5 text-center text-[11px] text-[#A09CB5] tabular-nums">
            Inventra · {products.length} {t.header.skusTracked}
          </p>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="relative z-10 flex min-h-screen flex-col lg:pl-64">
        {/* Clean Midnight Royal Top Bar */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[#2A2A44] bg-[#0E0A24]/92 px-4 py-3 text-[#F3EFE6] backdrop-blur-md sm:px-8 dark:bg-[#06050F]/88">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2A2A44] bg-[#1A1A2E] text-[#F3EFE6] hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="hidden text-xs font-medium text-[#A09CB5] sm:inline whitespace-nowrap">
                Inventra /
              </span>
              <h1 className="truncate font-display text-base font-bold text-white sm:text-lg">
                {t.nav[activeNavMeta.id]}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div
              className="inline-flex items-center gap-0.5 rounded-xl border border-[#E3C16F]/28 bg-[#1A1A2E]/90 p-0.5 shadow-inner"
              role="group"
              aria-label={t.header.languageLabel}
            >
              <Globe
                className="ml-1.5 mr-0.5 hidden h-3.5 w-3.5 text-[#E3C16F]/85 sm:block"
                aria-hidden="true"
              />
              {LANGUAGE_OPTIONS.map((opt) => {
                const selected = language === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setLanguage(opt.code)}
                    aria-pressed={selected}
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F] whitespace-nowrap shrink-0 sm:px-2.5 ${
                      selected
                        ? "bg-gradient-to-b from-[#6659F5] to-[#4B3FD6] text-white shadow-xs ring-1 ring-[#E3C16F]/45"
                        : "text-[#A09CB5] hover:text-white"
                    }`}
                  >
                    {opt.shortLabel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? t.header.switchToLight : t.header.switchToDark}
              className="btn-lavish-glass inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F]"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-[#E3C16F]" />
              ) : (
                <Moon className="h-4 w-4 text-[#F3EFE6]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setHelplineOpen(true)}
              aria-label={t.header.emergencyHelpline}
              className="btn-lavish-emergency inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold sm:px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D] whitespace-nowrap"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/25">
                <PhoneCall className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="hidden md:inline">{t.header.emergencyHelpline}</span>
            </button>

            <button
              type="button"
              onClick={handleStartTour}
              className="btn-lavish-primary hidden min-h-[40px] shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CFF] whitespace-nowrap"
            >
              <Compass className="h-3.5 w-3.5 text-[#F6E7B4]" aria-hidden="true" />
              {t.header.demoTour}
            </button>
          </div>
        </header>

        {/* Non-blocking chunked computation progress strip */}
        {isComputing && (
          <div
            role="status"
            aria-live="polite"
            className="no-print border-b border-[#ECE6D8] bg-white/90 px-4 py-2 backdrop-blur-xs sm:px-8 dark:border-[#2A2A44] dark:bg-[#12121F]/90"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-xs">
              <span className="font-medium text-[#4B3FD6] dark:text-[#E3C16F]">
                {t.scale.computingLabel}
              </span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-[#F4F0E6] dark:bg-[#1A1A2E]">
                  <div
                    className="h-full rounded-full bg-[#4B3FD6] transition-all duration-150 dark:bg-[#E3C16F]"
                    style={{ width: `${computeProgress}%` }}
                  />
                </div>
                <span className="font-mono font-semibold text-[#14112B] dark:text-[#F3EFE6] tabular-nums">
                  {computeProgress}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Active View */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-8">
          <div key={activeTab} className="animate-view-enter">
            {activeTab === "dashboard" && (
              <DashboardView
                products={products}
                summaries={summaries}
                anomalies={anomalies}
                onNavigate={handleNavigate}
                darkMode={darkMode}
                isComputing={isComputing}
              />
            )}

            {activeTab === "forecasts" && selectedForecast && (
              <ForecastsView
                products={products}
                summaries={summaries}
                selectedProductId={safeSelectedId}
                onSelectProduct={setSelectedProductId}
                horizonWeeks={horizonWeeks}
                onChangeHorizon={setHorizonWeeks}
                forecast={selectedForecast}
                excludedOutlierKeys={excludedOutlierKeys}
                anomalies={anomalies}
                darkMode={darkMode}
              />
            )}

            {activeTab === "inventory" && selectedForecast && selectedOptimization && (
              <InventoryView
                products={products}
                summaries={summaries}
                selectedProductId={safeSelectedId}
                onSelectProduct={setSelectedProductId}
                forecast={selectedForecast}
                optimization={selectedOptimization}
                customPoQuantities={customPoQuantities}
                onUpdatePoQuantity={handleUpdatePoQuantity}
                bulkPoSelectedIds={bulkPoSelectedIds}
                onChangeBulkPoSelectedIds={setBulkPoSelectedIds}
                darkMode={darkMode}
              />
            )}

            {activeTab === "scenarios" && selectedForecast && selectedOptimization && (
              <ScenariosView
                products={products}
                summaries={summaries}
                selectedProductId={safeSelectedId}
                onSelectProduct={setSelectedProductId}
                forecast={selectedForecast}
                baselineOpt={selectedOptimization}
                darkMode={darkMode}
              />
            )}

            {activeTab === "alerts" && (
              <AlertsView
                alerts={anomalies}
                products={products}
                onToggleDismiss={handleToggleDismissAlert}
                onToggleExcludeFromForecast={handleToggleExcludeOutlier}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === "advisor" && (
              <AdvisorView
                products={products}
                summaries={summaries}
                anomalies={anomalies}
              />
            )}

            {activeTab === "data" && (
              <DataView
                products={products}
                isDemoData={isDemoData}
                onLoadDemoData={handleLoadDemoData}
                onImportProducts={handleImportProducts}
                onUpdateStock={handleUpdateStock}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode((d) => !d)}
                reduceEffects={reduceEffects}
                onToggleReduceEffects={() => setReduceEffects((r) => !r)}
              />
            )}
          </div>
        </main>

        {/* Quiet Global Footer */}
        <footer className="no-print border-t border-[#ECE6D8] px-4 py-4 text-center text-xs text-[#6B6785] sm:px-8 dark:border-[#2A2A44] dark:text-[#A09CB5]">
          {t.scale.footerDisclaimer}
        </footer>
      </div>

      {tourOpen && (
        <DemoTourModal
          currentStepIndex={tourStep}
          onSelectStep={handleSelectTourStep}
          onClose={() => setTourOpen(false)}
        />
      )}

      {helplineOpen && (
        <EmergencyHelplineModal
          products={products}
          summaries={summaries}
          onClose={() => setHelplineOpen(false)}
          onJumpToInventory={(productId) => handleNavigate("inventory", productId)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
