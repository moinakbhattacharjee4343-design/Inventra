import React from "react";
import { Printer, X } from "lucide-react";
import { SupplierPurchaseOrder } from "../types/inventory";
import { InventraLogo } from "./InventraLogo";

interface PurchaseOrderPrintModalProps {
  orders: SupplierPurchaseOrder[];
  onClose: () => void;
}

export const PurchaseOrderPrintModal: React.FC<PurchaseOrderPrintModalProps> = ({
  orders,
  onClose,
}) => {
  const grandTotal = orders.reduce((s, o) => s + o.subtotal, 0);
  const totalUnits = orders.reduce(
    (s, o) => s + o.lines.reduce((ls, l) => ls + l.selectedQty, 0),
    0
  );
  const todayStr = new Date("2026-11-25T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070F]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Printable Purchase Order"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#ECE6D8] bg-white shadow-2xl dark:border-[#2A2A44] dark:bg-[#12121F]">
        <div className="no-print flex items-center justify-between border-b border-[#ECE6D8] px-6 py-4 dark:border-[#2A2A44]">
          <div>
            <h2 className="font-display text-base font-bold text-[#14112B] dark:text-[#F3EFE6]">
              Print-Friendly Purchase Order Plan
            </h2>
            <p className="text-xs text-[#6B6785] dark:text-[#A09CB5]">
              Use your browser print dialog to save as a crisp PDF or print directly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="mr-gold-cta inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8912B] whitespace-nowrap"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close print preview"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#ECE6D8] text-[#6B6785] hover:bg-[#F4F0E6] dark:border-[#2A2A44] dark:text-[#A09CB5] dark:hover:bg-[#1A1A2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3FD6]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Print Variant: Pure crisp white with dark ink and small gold foil logo */}
        <div
          id="inventra-print-po"
          className="overflow-y-auto bg-white p-8 text-[#14112B]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ECE6D8] pb-6">
            <InventraLogo showTagline surface="print" shimmerOnMount={false} />
            <div className="text-right">
              <p className="font-display text-lg font-bold text-[#4B3FD6]">
                CONSOLIDATED PURCHASE ORDER
              </p>
              <p className="mt-1 font-mono text-xs text-[#6B6785] tabular-nums">
                PO-INV-2026-1125 · Issued {todayStr}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-b border-[#ECE6D8] pb-6 text-sm">
            <div>
              <p className="text-xs font-medium text-[#6B6785]">Suppliers</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#14112B]">
                {orders.filter((o) => o.subtotal > 0).length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B6785]">Total Units Ordered</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#14112B]">
                {totalUnits.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#6B6785]">Total Estimated Spend</p>
              <p className="mt-1 font-mono text-lg font-semibold text-[#4B3FD6] tabular-nums">
                ₹{grandTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-8">
            {orders
              .filter((o) => o.lines.some((l) => l.selectedQty > 0))
              .map((po) => (
                <section key={po.supplier} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between border-b border-[#ECE6D8] pb-2">
                    <h3 className="font-display text-sm font-bold text-[#14112B]">
                      {po.supplier}
                    </h3>
                    <p className="text-xs text-[#6B6785] tabular-nums">
                      Lead time: {po.leadTimeDays}d · Expected delivery:{" "}
                      {po.expectedDeliveryDate}
                    </p>
                  </div>

                  <table className="mt-2 w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#ECE6D8] text-[#6B6785]">
                        <th className="py-2 font-medium">SKU</th>
                        <th className="py-2 font-medium">Product</th>
                        <th className="py-2 text-right font-medium">On Hand</th>
                        <th className="py-2 text-right font-medium">Order Qty</th>
                        <th className="py-2 text-right font-medium">Unit Cost</th>
                        <th className="py-2 text-right font-medium">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4F0E6]">
                      {po.lines
                        .filter((l) => l.selectedQty > 0)
                        .map((line) => (
                          <tr key={line.productId}>
                            <td className="py-2 font-mono text-[#6B6785]">
                              {line.sku}
                            </td>
                            <td className="py-2 font-medium text-[#14112B]">
                              {line.productName}
                            </td>
                            <td className="py-2 text-right font-mono tabular-nums text-[#6B6785]">
                              {line.currentStock}
                            </td>
                            <td className="py-2 text-right font-mono font-semibold tabular-nums text-[#14112B]">
                              {line.selectedQty}
                            </td>
                            <td className="py-2 text-right font-mono tabular-nums text-[#6B6785]">
                              ₹{line.unitCost.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2 text-right font-mono font-semibold tabular-nums text-[#14112B]">
                              ₹{line.lineTotal.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#ECE6D8]">
                        <td
                          colSpan={5}
                          className="py-2 text-right font-semibold text-[#14112B]"
                        >
                          Supplier Subtotal
                        </td>
                        <td className="py-2 text-right font-mono font-bold tabular-nums text-[#14112B]">
                          ₹{po.subtotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </section>
              ))}
          </div>

          <div className="mt-10 flex items-end justify-between border-t border-[#ECE6D8] pt-6 text-xs text-[#6B6785]">
            <div>
              <p className="font-semibold text-[#14112B]">
                Prepared by Inventra — AI Inventory & Demand Intelligence
              </p>
              <p className="mt-0.5">
                Predict demand. Perfect your stock. Quantities respect lead time, safety stock, and shelf-life limits.
              </p>
            </div>
            <div className="text-right">
              <div className="mb-1 h-8 w-44 border-b border-[#6B6785]/40" />
              <span>Authorized Store Buyer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
