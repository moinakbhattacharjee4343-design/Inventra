import React from "react";
import { ArrowRight, Check, Compass, X } from "lucide-react";
import { InventraLogo } from "./InventraLogo";

export type NavTab =
  | "dashboard"
  | "forecasts"
  | "inventory"
  | "scenarios"
  | "alerts"
  | "advisor"
  | "data";

interface TourStep {
  stepNumber: number;
  moment: string;
  title: string;
  description: string;
  targetTab: NavTab;
  targetProductId?: string;
  highlightNote: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    moment: "Moment 1 · Problem",
    title: "Spot Stockouts, Overstock & Dead Capital Across 100 SKUs",
    description:
      "Start on the Dashboard to explore 10 mall departments, the interactive ABC-XYZ matrix, and Top 10 Actions ranked by ₹ impact—like Bottled Water 1L running out vs. Regular Fit Jeans tying up capital.",
    targetTab: "dashboard",
    highlightNote: "Click any Department card or ABC-XYZ cell to filter the 100-SKU scorecard.",
  },
  {
    stepNumber: 2,
    moment: "Moment 2 · Forecast",
    title: "Inspect Seasonal Demand & Compare Up to 4 SKUs",
    description:
      "In Forecasts, Inventra runs Seasonal Holt-Winters across 24 months (~73,000 daily rows) with 80% and 95% intervals, cold-start fallback for new SKUs like Memory Card 64GB, and a 4-SKU Compare View.",
    targetTab: "forecasts",
    targetProductId: "bottled-water-1l",
    highlightNote: "Switch to 'Compare (Up to 4)' or search for 'Diwali' and 'Memory Card'.",
  },
  {
    stepNumber: 3,
    moment: "Moment 3 · What-If",
    title: "Stress-Test Single SKUs, Whole Departments or Suppliers",
    description:
      "In Scenarios, run 1,000 Monte Carlo trials on a single item or simulate a Diwali Rush / Monsoon / Supply Shock across an entire department or late supplier like Apex Express Logistics.",
    targetTab: "scenarios",
    targetProductId: "diwali-decorative-lights",
    highlightNote: "Toggle scope between Single SKU, Department, and Supplier.",
  },
  {
    stepNumber: 4,
    moment: "Moment 4 · Action",
    title: "Multi-Select Replenishment & Generate Combined MOQ POs",
    description:
      "In Inventory, inspect stock gauges and Gemini explanations in English, Hindi, or Bengali, multi-select urgent SKUs across the 100-item catalog, and export combined supplier POs respecting MOQ.",
    targetTab: "inventory",
    targetProductId: "bottled-water-1l",
    highlightNote: "Check multiple rows in the 100-SKU queue and click 'Generate Combined PO'.",
  },
];

interface DemoTourModalProps {
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
  onClose: () => void;
}

export const DemoTourModal: React.FC<DemoTourModalProps> = ({
  currentStepIndex,
  onSelectStep,
  onClose,
}) => {
  const step = TOUR_STEPS[currentStepIndex] ?? TOUR_STEPS[0];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <div
      className="no-print mr-royal-aurora fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-md overflow-hidden rounded-2xl p-[1px] shadow-2xl"
      role="region"
      aria-label="Guided Demo Tour"
    >
      {/* Hero floating orbs & subtle dotted pattern */}
      <div
        className="mr-hero-orb-1 pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#8B7CFF]/30 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="mr-hero-orb-2 pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#E3C16F]/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="mr-hero-dots pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 rounded-[15px] bg-[#0E0A24]/92 p-5 text-[#F3EFE6] backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <InventraLogo surface="dark" compact={false} shimmerOnMount={false} />
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E3C16F]">
              <Compass className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Guided Tour · {step.moment}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close demo tour"
            className="rounded-lg border border-[#2A2A44] bg-[#1A1A2E]/80 p-1.5 text-[#A09CB5] hover:border-[#8B7CFF]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-3 font-display text-base font-bold text-white text-balance">
          {step.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[#E4DFEC]">
          {step.description}
        </p>
        <p className="mt-2.5 rounded-lg border border-[#E3C16F]/30 bg-[#1B1240]/80 px-3 py-2 text-xs font-medium text-[#F6E7B4]">
          Tip: {step.highlightNote}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[#2A2A44] pt-3">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.stepNumber}
                type="button"
                onClick={() => onSelectStep(idx)}
                aria-label={`Go to tour step ${s.stepNumber}`}
                className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E3C16F] ${
                  idx === currentStepIndex
                    ? "w-6 bg-[#E3C16F]"
                    : "w-2 bg-[#2A2A44] hover:bg-[#8B7CFF]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => onSelectStep(currentStepIndex - 1)}
                className="rounded-lg border border-[#2A2A44] bg-[#1A1A2E]/70 px-3 py-1.5 text-xs font-medium text-[#E4DFEC] hover:border-[#8B7CFF]/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CFF]"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onClose() : onSelectStep(currentStepIndex + 1))}
              className="mr-gold-cta inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6E7B4]"
            >
              {isLast ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Finish Tour
                </>
              ) : (
                <>
                  Next: {TOUR_STEPS[currentStepIndex + 1].moment.split("·")[1]?.trim()}
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
