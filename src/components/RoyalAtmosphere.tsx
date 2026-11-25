import React from "react";
import { BackgroundVariant } from "../lib/themeTokens";

interface RoyalAtmosphereProps {
  variant: BackgroundVariant;
  hasCriticalAlerts?: boolean;
  reduceEffects?: boolean;
}

/**
 * Pure-CSS Midnight Royal atmospheric background rendered once in AppShell.
 * Uses fixed pointer-events-none layers behind content with zero unmount flicker:
 * 1. Base obsidian / warm ivory surface
 * 2. Multi-point royal indigo & champagne-gold radial glows
 * 3. Silky diagonal light-refraction beams
 * 4. Ambient slow-drifting royal aurora & champagne orbs (GPU transform only)
 * 5. Architectural 48px diamond-intersection grid + subtle vignette + fine grain
 */
export const RoyalAtmosphere: React.FC<RoyalAtmosphereProps> = ({
  variant,
  hasCriticalAlerts = false,
  reduceEffects = false,
}) => {
  const effectiveVariant: BackgroundVariant = reduceEffects ? "flat" : variant;
  const showGrid = effectiveVariant === "full" || effectiveVariant === "calm";
  const showSilk = effectiveVariant !== "flat";
  const showOrbs = !reduceEffects && effectiveVariant !== "flat";
  const showGrain = effectiveVariant !== "flat";

  const glowClass =
    effectiveVariant === "full"
      ? "mr-atmosphere-glow-full"
      : effectiveVariant === "calm" || effectiveVariant === "nebula"
        ? "mr-atmosphere-glow-calm"
        : "mr-atmosphere-glow-flat";

  return (
    <div
      aria-hidden="true"
      className="no-print pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#FBF9F4] transition-colors duration-200 dark:bg-[#07070F]"
    >
      {/* Layer 2: Multi-point ambient radial glows */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${glowClass}`} />

      {/* Layer 3: Silky diagonal champagne & indigo light refraction */}
      {showSilk && (
        <div className="mr-atmosphere-silk absolute inset-0 transition-opacity duration-300" />
      )}

      {/* Layer 4: Ambient drifting royal aurora & champagne silk orbs */}
      {showOrbs && (
        <>
          <div
            className="mr-royal-orb absolute -top-28 right-[8%] h-[460px] w-[460px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(124, 92, 255, 0.22) 0%, rgba(75, 63, 214, 0.06) 55%, transparent 75%)",
            }}
          />
          <div
            className="mr-royal-orb absolute -bottom-24 left-[18%] h-[400px] w-[400px] rounded-full blur-3xl"
            style={{
              animationDelay: "-16s",
              background:
                "radial-gradient(circle, rgba(227, 193, 111, 0.12) 0%, rgba(184, 145, 43, 0.03) 52%, transparent 75%)",
            }}
          />
        </>
      )}

      {/* Extra floating orb pair for Advisor Nebula mode */}
      {effectiveVariant === "nebula" && !reduceEffects && (
        <>
          <div
            className="mr-nebula-orb absolute -right-24 top-20 h-[440px] w-[440px] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(139, 124, 255, 0.22) 0%, rgba(75, 63, 214, 0.06) 55%, transparent 75%)",
            }}
          />
          <div
            className="mr-nebula-orb absolute left-1/3 bottom-10 h-[340px] w-[340px] rounded-full blur-3xl"
            style={{
              animationDelay: "-20s",
              background:
                "radial-gradient(circle, rgba(227, 193, 111, 0.11) 0%, transparent 70%)",
            }}
          />
        </>
      )}

      {/* Critical alerts ruby top-edge aura when Alerts screen has active critical items */}
      {effectiveVariant === "full" && hasCriticalAlerts && (
        <div
          className="absolute inset-x-0 top-0 h-80 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(680px 270px at 50% -10%, rgba(229, 72, 77, 0.09), transparent 72%)",
          }}
        />
      )}

      {/* Layer 5: Architectural 48px line grid with diamond intersections */}
      {showGrid && (
        <div
          className={`mr-atmosphere-grid absolute inset-0 ${
            effectiveVariant === "calm" ? "opacity-65" : "opacity-100"
          }`}
        />
      )}

      {/* Layer 6: Subtle royal top hairline luminescence */}
      <div
        className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(227, 193, 111, 0.35) 35%, rgba(139, 124, 255, 0.45) 65%, transparent 95%)",
        }}
      />

      {/* Layer 7: Soft outer vignette & subtle inline SVG noise grain */}
      <div className="mr-atmosphere-vignette absolute inset-0" />
      {showGrain && <div className="mr-atmosphere-grain absolute inset-0" />}
    </div>
  );
};
