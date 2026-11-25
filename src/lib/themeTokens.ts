import { useEffect, useRef, useState } from "react";
import { ProductCategory } from "../types/inventory";

export type BackgroundVariant = "full" | "calm" | "flat" | "nebula";

/**
 * Department jewel-tone palette (small dots, tags, chart series ONLY — never status).
 */
export const DEPARTMENT_COLORS: Record<ProductCategory, string> = {
  "Grocery Staples": "#3B6FE0",
  "Dairy, Bakery & Fresh": "#2BB5C9",
  "Beverages & Snacks": "#EF7B45",
  "Personal Care": "#E26BA6",
  "Pharmacy & Wellness": "#9B6BFF",
  "Fashion & Apparel": "#D9A441",
  "Electronics & Accessories": "#7C86A2",
  "Home & Kitchen": "#8BC34A",
  "Stationery & Books": "#1FB89A",
  "Toys, Sports & Seasonal": "#C2415D",
};

export function getDepartmentColor(category: ProductCategory): string {
  return DEPARTMENT_COLORS[category] ?? "#7C86A2";
}

export function getChartTokens(darkMode: boolean) {
  return {
    historical: darkMode ? "#8B7CFF" : "#5B4BDB",
    forecast: darkMode ? "#E3C16F" : "#B8912B",
    band80Fill: darkMode ? "rgba(227, 193, 111, 0.22)" : "rgba(184, 145, 43, 0.22)",
    band95Fill: darkMode ? "rgba(227, 193, 111, 0.10)" : "rgba(184, 145, 43, 0.10)",
    baseline: "#9CA3AF",
    scenarios: ["#A78BFA", "#F472B6", "#34D399"] as const,
    anomaly: "#E5484D",
    healthy: "#22C08A",
    warning: "#F5A524",
    info: "#4C9AFF",
    gridStroke: darkMode ? "rgba(42, 42, 68, 0.5)" : "rgba(236, 230, 216, 0.65)",
    axisTick: darkMode ? "#A09CB5" : "#6B6785",
    tooltipStyle: {
      backgroundColor: darkMode ? "rgba(18, 18, 31, 0.92)" : "rgba(255, 255, 255, 0.95)",
      border: `1px solid ${darkMode ? "#2A2A44" : "#ECE6D8"}`,
      borderRadius: "10px",
      fontSize: "12px",
      color: darkMode ? "#F3EFE6" : "#14112B",
      backdropFilter: "blur(10px)",
      boxShadow: darkMode
        ? "0 12px 30px -8px rgba(0, 0, 0, 0.65)"
        : "0 10px 26px -8px rgba(20, 17, 43, 0.14)",
    },
  };
}

/**
 * Gentle count-up animation for KPI numbers (respects prefers-reduced-motion).
 */
export function useCountUp(target: number, durationMs = 450): number {
  const [value, setValue] = useState<number>(target);
  const prevRef = useRef<number>(target);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !Number.isFinite(target)) {
      prevRef.current = target;
      setValue(target);
      return;
    }

    const startVal = prevRef.current === target ? target * 0.88 : prevRef.current;
    const startTime = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startVal + (target - startVal) * eased;
      setValue(next);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        prevRef.current = target;
        setValue(target);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return value;
}
