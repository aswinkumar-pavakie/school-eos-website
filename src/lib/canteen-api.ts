// Canteen counter -- talks to the real backend module at
// school-eos-backend/src/modules/canteen/ (CANTEEN_VENDOR-only). No NFC
// reader is wired up yet, so `searchStudents` is the manual stand-in for a
// card tap: canteen staff types a name/admission number and picks the
// match themselves (see the backend repository's own header comment).

import { apiFetch, AuthExpiredError } from "./api";

interface ApiEnvelope<T> {
  data: T;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new AuthExpiredError();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export interface CanteenStudent {
  id: string;
  name: string;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  hasWallet: boolean;
  walletActive: boolean;
  balancePaise: number | null;
}

export interface CanteenChargeItem {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface CanteenChargeReceipt {
  transactionId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  amountPaise: number;
  itemsTotalPaise: number;
  balanceAfterPaise: number;
  createdAt: string;
}

export interface CanteenHistoryEntry {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  amountPaise: number;
  itemsTotalPaise: number;
  balanceAfterPaise: number;
  createdAt: string;
  performedByName: string | null;
  items: CanteenChargeItem[];
}

export interface CanteenProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  pricePerUnitPaise: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CanteenDashboard {
  todaySalesPaise: number;
  todayTransactionCount: number;
  todayUniqueStudents: number;
  todayAvgTransactionPaise: number;
  /** null when yesterday had zero sales (no real baseline to compare against). */
  salesDeltaPct: number | null;
  transactionsDeltaPct: number | null;
  /** null when nothing sold yet today. */
  peakHour: number | null;
  declinedToday: number;
  weeklyTrend: { date: string; totalPaise: number }[];
  hourlyToday: { hour: number; totalPaise: number }[];
  gradeBreakdown: { gradeName: string; totalPaise: number }[];
  recentTransactions: CanteenHistoryEntry[];
  lowStockCount: number;
  lowStockProducts: { name: string; quantity: number }[];
  inventoryUnits: number;
  inventoryValuePaise: number;
  inventoryProductCount: number;
}

export interface CanteenReports {
  range: { from: string; to: string };
  salesPaise: number;
  transactionCount: number;
  uniqueStudents: number;
  avgTransactionPaise: number;
  declinedCount: number;
  dailyTrend: { date: string; totalPaise: number; transactionCount: number }[];
  gradeBreakdown: { gradeName: string; totalPaise: number }[];
  topProducts: { productName: string; quantitySold: number; revenuePaise: number }[];
  lowStockProducts: { name: string; quantity: number }[];
  inventory: { productCount: number; totalUnits: number; totalValuePaise: number };
}

export async function searchCanteenStudents(query: string): Promise<CanteenStudent[]> {
  if (query.trim().length < 2) return [];
  const res = await apiFetch(`/canteen/students/search?query=${encodeURIComponent(query)}`);
  return (await parseOrThrow<ApiEnvelope<CanteenStudent[]>>(res)).data;
}

// No listCanteenHistory-style wrapper for charging -- /api/canteen/charge
// (the client-facing route) calls apiFetch("/canteen/charge", ...) directly
// and passes the real backend status/message straight through verbatim, so
// a real 400 (insufficient balance, frozen wallet, out of stock) surfaces
// as itself rather than being swallowed into a generic Error by
// parseOrThrow here.

export async function listCanteenHistory(limit = 50): Promise<CanteenHistoryEntry[]> {
  const res = await apiFetch(`/canteen/history?limit=${limit}`);
  return (await parseOrThrow<ApiEnvelope<CanteenHistoryEntry[]>>(res)).data;
}

export async function getCanteenDashboard(): Promise<CanteenDashboard> {
  const res = await apiFetch("/canteen/dashboard");
  return (await parseOrThrow<ApiEnvelope<CanteenDashboard>>(res)).data;
}

export async function getCanteenReports(from: string, to: string): Promise<CanteenReports> {
  const res = await apiFetch(`/canteen/reports?from=${from}&to=${to}`);
  return (await parseOrThrow<ApiEnvelope<CanteenReports>>(res)).data;
}

// ============================================================
// Inventory CRUD
// ============================================================

export async function listCanteenProducts(includeInactive = false): Promise<CanteenProduct[]> {
  const res = await apiFetch(`/canteen/products${includeInactive ? "?includeInactive=true" : ""}`);
  return (await parseOrThrow<ApiEnvelope<CanteenProduct[]>>(res)).data;
}
