"use client";

// A real, single-click local PDF download -- no new tab, no separate print
// route to navigate to. Builds the PDF entirely client-side from the exact
// same report data already rendered on screen (props, not a second fetch),
// so what's downloaded always matches what's on screen. jsPDF + autotable
// only (no headless-browser/server PDF rendering, which this app has no
// infrastructure for) -- the file saves straight to the browser's own
// Downloads folder via jsPDF's save(), the standard client-side PDF pattern.

import { useState } from "react";
import type { CanteenReports } from "@/lib/canteen-api";
import { formatMoneyDetail } from "@/lib/format";

const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const PRIMARY: [number, number, number] = [29, 78, 216];
const BORDER: [number, number, number] = [226, 232, 240];

export function DownloadReportButton({ data, rangeLabel }: { data: CanteenReports; rangeLabel: string }) {
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
      const autoTable = autoTableModule.default;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = 50;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...INK);
      doc.text("Canteen Reports", margin, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...MUTED);
      doc.text(rangeLabel, margin, y);
      doc.text(`Generated ${new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, pageWidth - margin, y, { align: "right" });
      y += 24;

      // ---- Summary stat cards (drawn as a 4-up row of boxes) ----
      const cards = [
        { label: "Total sales", value: formatMoneyDetail(data.salesPaise) },
        { label: "Transactions", value: String(data.transactionCount) },
        { label: "Unique students", value: String(data.uniqueStudents) },
        { label: "Avg. transaction", value: formatMoneyDetail(data.avgTransactionPaise) },
      ];
      const cardGap = 10;
      const cardWidth = (pageWidth - margin * 2 - cardGap * (cards.length - 1)) / cards.length;
      const cardHeight = 52;
      cards.forEach((c, i) => {
        const x = margin + i * (cardWidth + cardGap);
        doc.setDrawColor(...BORDER);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, cardHeight, 6, 6, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...MUTED);
        doc.text(c.label.toUpperCase(), x + 10, y + 18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...INK);
        doc.text(c.value, x + 10, y + 38);
      });
      y += cardHeight + 28;

      function sectionTitle(title: string) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12.5);
        doc.setTextColor(...INK);
        doc.text(title, margin, y);
        y += 8;
      }

      sectionTitle("Top-selling products");
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["#", "Product", "Qty sold", "Revenue"]],
        body:
          data.topProducts.length > 0
            ? data.topProducts.map((p, i) => [String(i + 1), p.productName, String(p.quantitySold), formatMoneyDetail(p.revenuePaise)])
            : [["", "No sales recorded in this range.", "", ""]],
        theme: "striped",
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9.5, textColor: INK, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 24 }, 2: { halign: "right", cellWidth: 60 }, 3: { halign: "right", cellWidth: 90 } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

      sectionTitle("Sales by class");
      const gradeTotal = data.gradeBreakdown.reduce((s, g) => s + g.totalPaise, 0);
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Grade", "Sales", "Share"]],
        body:
          data.gradeBreakdown.length > 0
            ? data.gradeBreakdown.map((g) => [g.gradeName, formatMoneyDetail(g.totalPaise), `${gradeTotal > 0 ? Math.round((g.totalPaise / gradeTotal) * 100) : 0}%`])
            : [["No sales recorded in this range.", "", ""]],
        theme: "striped",
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9.5, textColor: INK, cellPadding: 6 },
        columnStyles: { 1: { halign: "right", cellWidth: 90 }, 2: { halign: "right", cellWidth: 60 } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

      if (y > doc.internal.pageSize.getHeight() - 160) {
        doc.addPage();
        y = 50;
      }

      sectionTitle("Daily trend");
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Date", "Transactions", "Sales"]],
        body: data.dailyTrend.map((d) => [
          new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          String(d.transactionCount),
          formatMoneyDetail(d.totalPaise),
        ]),
        theme: "striped",
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 9, textColor: INK, cellPadding: 5 },
        columnStyles: { 1: { halign: "right", cellWidth: 80 }, 2: { halign: "right", cellWidth: 90 } },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

      if (y > doc.internal.pageSize.getHeight() - 120) {
        doc.addPage();
        y = 50;
      }

      sectionTitle("Inventory snapshot (live, not date-ranged)");
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Stock value", "Units on hand", "Products", "Low stock"]],
        body: [[
          formatMoneyDetail(data.inventory.totalValuePaise),
          String(data.inventory.totalUnits),
          String(data.inventory.productCount),
          String(data.lowStockProducts.length),
        ]],
        theme: "striped",
        headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold", fontSize: 9 },
        styles: { fontSize: 10, textColor: INK, cellPadding: 7, halign: "center" },
      });
      if (data.lowStockProducts.length > 0) {
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...MUTED);
        const lowStockLine = `Running low: ${data.lowStockProducts.map((p) => `${p.name} (${p.quantity})`).join(", ")}`;
        doc.text(doc.splitTextToSize(lowStockLine, pageWidth - margin * 2), margin, y);
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`canteen-report-${fileDate}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      style={{
        border: 0,
        background: "var(--can-gradient-accent)",
        color: "#fff",
        font: "600 13.5px/1 var(--can-font-sans)",
        borderRadius: 9,
        padding: "10px 16px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: busy ? "wait" : "pointer",
        boxShadow: "0 4px 14px rgba(29,78,216,.28)",
        opacity: busy ? 0.75 : 1,
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M4 19h16" />
      </svg>
      {busy ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}
