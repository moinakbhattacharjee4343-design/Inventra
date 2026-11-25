import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import {
  AnomalyAlert,
  ChatMessage,
  Product,
  ProductSummary,
} from "../types/inventory";
import { sendAdvisorChat } from "../lib/aiClient";
import { useLanguage } from "../lib/LanguageContext";

interface AdvisorViewProps {
  products: Product[];
  summaries: Map<string, ProductSummary>;
  anomalies: AnomalyAlert[];
}

export const AdvisorView: React.FC<AdvisorViewProps> = ({
  products,
  summaries,
  anomalies,
}) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: t.advisor.welcome,
      timestamp: "",
      suggestedFollowUps: t.advisor.suggestions,
    },
  ]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === "welcome-1"
          ? {
              ...m,
              content: t.advisor.welcome,
              suggestedFollowUps: t.advisor.suggestions,
            }
          : m
      )
    );
  }, [t]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const baseStoreStats = useMemo(() => {
    let criticalStockouts = 0;
    let totalOverstockValue = 0;
    let expiryRiskCount = 0;
    let deadStockCount = 0;
    let projected30dRevenue = 0;

    const mapped = products
      .map((p) => {
        const sum = summaries.get(p.id);
        if (!sum) return null;
        if (sum.healthReason === "stockout_risk") criticalStockouts++;
        if (sum.healthReason === "expiry_risk") expiryRiskCount++;
        if (sum.healthReason === "dead_stock") deadStockCount++;
        totalOverstockValue += sum.overstockValue;
        projected30dRevenue += sum.projected30DayRevenue;
        return { p, sum };
      })
      .filter((x): x is { p: Product; sum: ProductSummary } => x !== null);

    const activeAnomalies = anomalies
      .filter((a) => !a.dismissed)
      .slice(0, 10)
      .map((a) => ({
        productName: a.productName,
        sku: a.sku,
        date: a.date,
        type: a.type,
        severityScore: a.severityScore,
        title: a.title,
      }));

    return {
      mapped,
      kpis: {
        totalSkus: products.length,
        criticalStockouts,
        expiryRiskCount,
        deadStockCount,
        totalOverstockValue,
        projected30dRevenue,
      },
      activeAnomalies,
    };
  }, [products, summaries, anomalies]);

  const buildScopedContext = (queryText: string) => {
    const q = queryText.toLowerCase();
    const tokens = q.split(/\s+/).filter((w) => w.length >= 3);

    const matched = baseStoreStats.mapped.filter(({ p }) => {
      const hay = `${p.name} ${p.sku} ${p.category} ${p.supplier}`.toLowerCase();
      return tokens.some((tok) => hay.includes(tok));
    });

    const topPriority = [...baseStoreStats.mapped].sort(
      (a, b) => b.sum.financialImpact - a.sum.financialImpact
    );

    const seen = new Set<string>();
    const chosen: Array<{ p: Product; sum: ProductSummary }> = [];
    for (const item of [...matched, ...topPriority]) {
      if (seen.has(item.p.id)) continue;
      seen.add(item.p.id);
      chosen.push(item);
      if (chosen.length >= 28) break;
    }

    return {
      kpis: baseStoreStats.kpis,
      products: chosen.map(({ p, sum }) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        supplier: p.supplier,
        supplierLateRisk: Boolean(p.supplierLateRisk),
        moq: p.moq,
        currentStock: p.currentStock,
        unitCost: p.unitCost,
        sellingPrice: p.sellingPrice,
        leadTimeDays: p.leadTimeDays,
        shelfLifeDays: p.shelfLifeDays,
        abcXyz: sum.abcXyz,
        weeklyDemand: sum.weeklyDemand,
        daysOfCover: sum.daysOfCover,
        safetyStock: sum.safetyStock,
        reorderPoint: sum.reorderPoint,
        recommendedOrderQty: sum.recommendedOrderQty,
        recommendedOrderDate: sum.recommendedOrderDate,
        healthStatus: sum.healthStatus,
        healthReason: sum.healthReason,
        overstockValue: sum.overstockValue,
        expiryWasteValue: sum.expiryWasteValue,
        financialImpact: sum.financialImpact,
        wape: sum.wape,
        confidence: sum.confidence,
      })),
      activeAnomalies: baseStoreStats.activeAnomalies,
    };
  };

  const handleSend = async (textOverride?: string) => {
    const query = (textOverride ?? input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const historyForApi = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setLastError(null);

    const scopedContext = buildScopedContext(query);
    const aiRes = await sendAdvisorChat(
      query,
      historyForApi,
      scopedContext,
      language
    );
    if (aiRes.errorNotice) {
      setLastError(aiRes.errorNotice);
    }

    const botMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: "assistant",
      content: aiRes.reply,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      citedFigures: aiRes.citedFigures,
      uncertaintyNote: aiRes.uncertaintyNote,
      suggestedFollowUps: aiRes.suggestedFollowUps,
      isFallback: aiRes.isFallback,
    };

    setMessages((prev) => [...prev, botMsg]);
    setLoading(false);
    setTimeout(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="mr-card mx-auto flex h-[calc(100vh-12rem)] min-h-[540px] max-w-4xl flex-col overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-[#ECE6D8] px-6 py-4 dark:border-[#2A2A44]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3C16F]/45 bg-[#1B1240] text-[#E3C16F] shadow-sm dark:bg-[#120C2E]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
              {t.advisor.title}
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              {products.length} SKUs · {anomalies.filter((a) => !a.dismissed).length} alerts ·{" "}
              {t.advisor.subtitle}
            </p>
          </div>
        </div>
      </div>

      {lastError && (
        <div className="border-b border-[#F5A524]/35 bg-[#F5A524]/14 px-6 py-2 text-xs font-medium text-[#14112B] dark:text-[#F5A524]">
          Gemini API notice: {lastError} (Using deterministic rule-based response.)
        </div>
      )}

      <div className="flex-1 space-y-5 overflow-y-auto p-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#4B3FD6] text-white shadow-sm dark:bg-[#5E50EE]"
                  : "border border-[#ECE6D8] border-l-2 border-l-[#B8912B] bg-[#4B3FD6]/[0.07] text-[#14112B] dark:border-[#2A2A44] dark:border-l-[#E3C16F] dark:bg-[#8B7CFF]/[0.08] dark:text-[#F3EFE6]"
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>

              {msg.citedFigures && msg.citedFigures.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#ECE6D8] pt-2.5 text-xs dark:border-[#2A2A44]">
                  {msg.citedFigures.map((fig) => (
                    <span key={fig.label} className="font-mono tabular-nums">
                      <span className="font-sans text-[#6B6785] dark:text-[#A09CB5]">
                        {fig.label}:{" "}
                      </span>
                      <strong className="text-[#4B3FD6] dark:text-[#E3C16F]">
                        {fig.value}
                      </strong>
                    </span>
                  ))}
                </div>
              )}

              {msg.uncertaintyNote && (
                <p className="mt-2 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                  {t.advisor.uncertaintyPrefix} {msg.uncertaintyNote}
                </p>
              )}
            </div>

            {msg.role === "assistant" &&
              msg.suggestedFollowUps &&
              msg.suggestedFollowUps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.suggestedFollowUps.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => void handleSend(sug)}
                      disabled={loading}
                      className="rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 py-1.5 text-xs font-medium text-[#14112B] hover:border-[#4B3FD6] hover:text-[#4B3FD6] dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:hover:border-[#8B7CFF] dark:hover:text-[#A99DFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#6B6785] dark:text-[#A09CB5]">
            <Loader2 className="h-4 w-4 animate-spin text-[#4B3FD6] dark:text-[#8B7CFF]" />
            <span>{t.advisor.loadingText}</span>
          </div>
        )}
        <div ref={listEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="flex items-center gap-3 border-t border-[#ECE6D8] p-4 dark:border-[#2A2A44]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.advisor.placeholder}
          aria-label={t.advisor.title}
          className="min-h-[44px] flex-1 rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-4 text-sm text-[#14112B] placeholder:text-[#6B6785] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#1A1A2E] dark:text-[#F3EFE6] dark:placeholder:text-[#A09CB5] dark:focus:border-[#8B7CFF]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-lavish-primary inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6] whitespace-nowrap shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          {t.advisor.sendBtn}
        </button>
      </form>
    </div>
  );
};
