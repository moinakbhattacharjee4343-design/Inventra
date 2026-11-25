import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Headset,
  PhoneCall,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { Product, ProductSummary } from "../types/inventory";
import { useLanguage } from "../lib/LanguageContext";
import { ProductAvatar } from "./ProductAvatar";

interface EmergencyHelplineModalProps {
  products: Product[];
  summaries: Map<string, ProductSummary>;
  onClose: () => void;
  onJumpToInventory: (productId?: string) => void;
}

export const EmergencyHelplineModal: React.FC<EmergencyHelplineModalProps> = ({
  products,
  summaries,
  onClose,
  onJumpToInventory,
}) => {
  const { language, t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<string>(t.helpline.issues[0]);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    phone: string;
    issue: string;
  } | null>(null);

  useEffect(() => {
    setIssueType(t.helpline.issues[0]);
  }, [t]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const urgentSkus = useMemo(() => {
    const items: Array<{ product: Product; sum: ProductSummary }> = [];
    for (const product of products) {
      const sum = summaries.get(product.id);
      if (!sum) continue;
      if (
        sum.healthStatus === "critical" &&
        sum.healthReason === "stockout_risk"
      ) {
        items.push({ product, sum });
      }
    }
    return items.sort((a, b) => b.sum.financialImpact - a.sum.financialImpact);
  }, [products, summaries]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for restricted clipboard contexts
    }
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  const buildRushSupplierMessage = (
    product: Product,
    sum: ProductSummary
  ): string => {
    const qty = Math.max(sum.recommendedOrderQty, product.moq || 1, 20);
    if (language === "hi") {
      return `आपातकालीन स्टॉक अनुरोध (${product.supplier}): कृपया ${product.name} (${product.sku}) के ${qty} यूनिट तुरंत भेजें। वर्तमान स्टॉक केवल ${product.currentStock} यूनिट (${sum.daysOfCover} दिन कवर) बचा है।`;
    }
    if (language === "bn") {
      return `জরুরি স্টক অনুরোধ (${product.supplier}): অনুগ্রহ করে ${product.name} (${product.sku})-এর ${qty} ইউনিট দ্রুত পাঠান। বর্তমানে মাত্র ${product.currentStock} ইউনিট (${sum.daysOfCover} দিন কভার) অবশিষ্ট আছে।`;
    }
    return `URGENT RESTOCK (${product.supplier}): Please rush-dispatch ${qty} units of ${product.name} (${product.sku}). Current shelf stock is ${product.currentStock} units (${sum.daysOfCover}d cover left).`;
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.trim();
    if (!cleaned) return;
    const refId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedTicket({
      id: refId,
      phone: cleaned,
      issue: issueType,
    });
    setNotes("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070F]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="helpline-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#ECE6D8] bg-white shadow-2xl dark:border-[#2A2A44] dark:bg-[#12121F]">
        {/* Midnight Royal Obsidian Emergency Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E3C16F]/25 bg-[#0E0A24] px-6 py-5 text-[#F3EFE6] dark:bg-[#06050F]">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5484D] text-white shadow-md shadow-[#E5484D]/35">
              <Headset className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FF9EA1]">
                <ShieldAlert className="h-3.5 w-3.5 text-[#E5484D]" aria-hidden="true" />
                {t.helpline.availability}
              </p>
              <h2
                id="helpline-modal-title"
                className="font-display text-lg font-bold text-white text-balance"
              >
                {t.helpline.title}
              </h2>
              <p className="mt-0.5 text-xs text-[#A09CB5]">
                {t.helpline.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.helpline.closeBtn}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2A2A44] bg-[#1A1A2E] text-[#A09CB5] hover:border-[#E5484D]/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Column 1: Direct Toll-Free & Emergency Numbers */}
            <section className="space-y-3 lg:col-span-6">
              <div>
                <h3 className="font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  {t.helpline.hotlinesTitle}
                </h3>
                <p className="mt-0.5 text-xs text-[#6B6785] dark:text-[#A09CB5]">
                  {t.helpline.hotlinesSub}
                </p>
              </div>

              <div className="space-y-2.5">
                {t.helpline.lines.map((line) => (
                  <div
                    key={line.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      line.urgent
                        ? "border-[#E5484D]/40 bg-[#E5484D]/10 dark:border-[#E5484D]/45 dark:bg-[#E5484D]/12"
                        : "border-[#ECE6D8] bg-[#F4F0E6]/65 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/65"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                          {line.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                          {line.role} · {line.hours}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#B8282D] dark:text-[#FF7A7E] tabular-nums">
                        {line.phone}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${line.phone.replace(/[^0-9+]/g, "")}`}
                        className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D] ${
                          line.urgent
                            ? "btn-lavish-emergency"
                            : "btn-lavish-primary"
                        }`}
                      >
                        <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                        {t.helpline.callNow}
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleCopy(line.id, line.phone)}
                        className="btn-lavish-secondary inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6]"
                      >
                        {copiedId === line.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#22C08A]" />
                            {t.helpline.copied}
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            {t.helpline.copyNumber}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Column 2: Critical Stockouts + Priority Callback Ticket */}
            <div className="space-y-6 lg:col-span-6">
              <section className="rounded-xl border border-[#ECE6D8] bg-[#F4F0E6]/65 p-4 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/65">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
                      <ShieldAlert
                        className="h-4 w-4 text-[#E5484D]"
                        aria-hidden="true"
                      />
                      {t.helpline.criticalTitle} ({urgentSkus.length})
                    </h3>
                    <p className="mt-0.5 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                      {t.helpline.criticalSub}
                    </p>
                  </div>
                </div>

                {urgentSkus.length === 0 ? (
                  <p className="mt-3 text-xs font-medium text-[#0F805A] dark:text-[#22C08A]">
                    {t.helpline.noCritical}
                  </p>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    {urgentSkus.slice(0, 4).map(({ product, sum }) => (
                      <div
                        key={product.id}
                        className="flex flex-col justify-between gap-2.5 rounded-lg border border-[#ECE6D8] bg-white p-3 dark:border-[#2A2A44] dark:bg-[#12121F]"
                      >
                        <div className="flex items-center gap-2.5">
                          <ProductAvatar
                            src={product.imageUrl}
                            name={product.name}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#14112B] dark:text-[#F3EFE6]">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-[#6B6785] dark:text-[#A09CB5] tabular-nums">
                              {product.supplier} · {sum.daysOfCover}d ·{" "}
                              {t.helpline.deficitLabel}:{" "}
                              <span className="font-mono font-semibold text-[#B8282D] dark:text-[#FF7A7E]">
                                {Math.max(sum.recommendedOrderQty, product.moq || 1, 20)}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleCopy(
                                `rush-${product.id}`,
                                buildRushSupplierMessage(product, sum)
                              )
                            }
                            className="btn-lavish-secondary inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                          >
                            {copiedId === `rush-${product.id}` ? (
                              <>
                                <Check className="h-3 w-3 text-[#22C08A]" />
                                {t.helpline.rushMsgCopied}
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                {t.helpline.copyRushMsg}
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onJumpToInventory(product.id);
                            }}
                            className="inline-flex min-h-[32px] items-center gap-1 text-[11px] font-semibold text-[#4B3FD6] hover:underline dark:text-[#8B7CFF] whitespace-nowrap"
                          >
                            {t.helpline.openPoBtn}
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-[#ECE6D8] bg-white p-4 dark:border-[#2A2A44] dark:bg-[#1A1A2E]/60">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-[#14112B] dark:text-[#F3EFE6]">
                  <AlertTriangle
                    className="h-4 w-4 text-[#F5A524]"
                    aria-hidden="true"
                  />
                  {t.helpline.callbackTitle}
                </h3>
                <p className="mt-0.5 text-[11px] text-[#6B6785] dark:text-[#A09CB5]">
                  {t.helpline.callbackSub}
                </p>

                {submittedTicket ? (
                  <div className="mt-4 rounded-xl border border-[#22C08A]/40 bg-[#22C08A]/12 p-4">
                    <p className="text-xs font-bold text-[#0F805A] dark:text-[#22C08A]">
                      {t.helpline.ticketCreatedTitle} ·{" "}
                      <span className="font-mono tabular-nums">
                        {submittedTicket.id}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#0F805A] dark:text-[#22C08A]">
                      {t.helpline.ticketCreatedBody}{" "}
                      <strong className="font-mono tabular-nums">
                        {submittedTicket.phone}
                      </strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmittedTicket(null)}
                      className="btn-lavish-secondary mt-3 inline-flex min-h-[34px] items-center rounded-lg px-3 py-1.5 text-xs font-semibold"
                    >
                      {t.helpline.newTicketBtn}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="mt-3 space-y-3">
                    <div>
                      <label
                        htmlFor="helpline-issue"
                        className="block text-[11px] font-semibold text-[#14112B] dark:text-[#F3EFE6]"
                      >
                        {t.helpline.issueLabel}
                      </label>
                      <select
                        id="helpline-issue"
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="mt-1 min-h-[38px] w-full rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 text-xs text-[#14112B] focus:border-[#4B3FD6] focus:outline-none dark:border-[#2A2A44] dark:bg-[#12121F] dark:text-[#F3EFE6]"
                      >
                        {t.helpline.issues.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="helpline-phone"
                        className="block text-[11px] font-semibold text-[#14112B] dark:text-[#F3EFE6]"
                      >
                        {t.helpline.phoneLabel}
                      </label>
                      <input
                        id="helpline-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.helpline.phonePlaceholder}
                        className="mt-1 min-h-[38px] w-full rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 font-mono text-xs text-[#14112B] placeholder:font-sans placeholder:text-[#6B6785] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#12121F] dark:text-[#F3EFE6] dark:placeholder:text-[#A09CB5]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="helpline-notes"
                        className="block text-[11px] font-semibold text-[#14112B] dark:text-[#F3EFE6]"
                      >
                        {t.helpline.notesLabel}
                      </label>
                      <textarea
                        id="helpline-notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t.helpline.notesPlaceholder}
                        className="mt-1 w-full rounded-lg border border-[#ECE6D8] bg-[#F4F0E6] px-3 py-2 text-xs text-[#14112B] placeholder:text-[#6B6785] focus:border-[#4B3FD6] focus:bg-white focus:outline-none dark:border-[#2A2A44] dark:bg-[#12121F] dark:text-[#F3EFE6] dark:placeholder:text-[#A09CB5]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-lavish-emergency inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5484D]"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      {t.helpline.submitTicketBtn}
                    </button>
                  </form>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
