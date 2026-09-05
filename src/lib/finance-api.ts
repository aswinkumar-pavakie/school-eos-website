// Server-side-only Finance API client — every call goes through apiFetch (Server
// Actions/Server Components only), matching this app's convention: the browser never
// calls the backend directly and never holds a token. Field names/shapes mirror the
// backend's real, DB-verified state machines exactly (see school-eos-backend's Finance
// README) — money is always a digit-string (never `number`), never a float.

import { apiFetch } from "./api";

export interface ApiEnvelope<T> {
  data: T;
  meta?: { total: number; page: number; pageSize: number };
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

// ---------- Master data ----------

export interface FeeHead {
  id: string;
  name: string;
  code: string;
  headType: string;
  isRefundable: boolean;
  status: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string | null;
  pettyLimitPaise: string;
}

export { FEE_HEAD_TYPES } from "./finance-constants";
export type { FeeHeadType } from "./finance-constants";

export async function listFeeHeads(): Promise<FeeHead[]> {
  const res = await apiFetch("/finance/fee-heads");
  return (await parseOrThrow<ApiEnvelope<FeeHead[]>>(res)).data;
}

export async function getFeeHead(id: string): Promise<FeeHead> {
  const res = await apiFetch(`/finance/fee-heads/${id}`);
  return (await parseOrThrow<ApiEnvelope<FeeHead>>(res)).data;
}

export async function createFeeHead(input: { name: string; code: string; headType: string; isRefundable?: boolean }): Promise<FeeHead> {
  const res = await apiFetch("/finance/fee-heads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<FeeHead>>(res)).data;
}

export async function activateFeeHead(id: string): Promise<FeeHead> {
  const res = await apiFetch(`/finance/fee-heads/${id}/activate`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<FeeHead>>(res)).data;
}

export async function deactivateFeeHead(id: string): Promise<FeeHead> {
  const res = await apiFetch(`/finance/fee-heads/${id}/deactivate`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<FeeHead>>(res)).data;
}

export interface Grade {
  id: string;
  name: string;
  levelNo: number;
}

export async function listGrades(): Promise<Grade[]> {
  const res = await apiFetch("/finance/grades");
  return (await parseOrThrow<ApiEnvelope<Grade[]>>(res)).data;
}

export interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

export async function listAcademicYears(): Promise<AcademicYear[]> {
  const res = await apiFetch("/finance/academic-years");
  return (await parseOrThrow<ApiEnvelope<AcademicYear[]>>(res)).data;
}

export interface Medium {
  id: string;
  name: string;
}

export async function listMediums(): Promise<Medium[]> {
  const res = await apiFetch("/finance/mediums");
  return (await parseOrThrow<ApiEnvelope<Medium[]>>(res)).data;
}

export interface SchoolProfile {
  name: string;
  board: string | null;
  recognitionNo: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export async function getSchoolProfile(): Promise<SchoolProfile | null> {
  const res = await apiFetch("/finance/school-profile");
  return (await parseOrThrow<ApiEnvelope<SchoolProfile | null>>(res)).data;
}

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const res = await apiFetch("/finance/expense-categories");
  return (await parseOrThrow<ApiEnvelope<ExpenseCategory[]>>(res)).data;
}

export async function createExpenseCategory(input: { name: string; code?: string; pettyLimitPaise?: string }): Promise<ExpenseCategory> {
  const res = await apiFetch("/finance/expense-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<ExpenseCategory>>(res)).data;
}

// ---------- Fee Structures (2.1) ----------
// Real state machine: DRAFT -> PENDING_APPROVAL -> ACTIVE -> SUPERSEDED (rejection reverts PENDING_APPROVAL -> DRAFT).

export type FeeStructureState = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "SUPERSEDED";

export interface FeeStructure {
  id: string;
  academicYearId: string;
  academicYearName: string | null;
  gradeId: string;
  gradeName: string | null;
  mediumId: string | null;
  category: string | null;
  totalPaise: string;
  approvalRequestId: string | null;
  state: FeeStructureState;
  createdAt: string;
  updatedAt: string;
}

export interface FeeStructureLine {
  id: string;
  feeStructureId: string;
  feeHeadId: string;
  feeHeadName: string | null;
  amountPaise: string;
  instalmentNo: number;
  dueDate: string;
  lateFeePaise: string;
}

export interface FeeStructureLineInput {
  feeHeadId: string;
  amountPaise: string;
  instalmentNo?: number;
  dueDate: string;
  lateFeePaise?: string;
}

export async function listFeeStructures(filter: { academicYearId?: string; gradeId?: string; state?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<FeeStructure[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/fee-structures?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getFeeStructure(id: string): Promise<{ structure: FeeStructure; lines: FeeStructureLine[] }> {
  const res = await apiFetch(`/finance/fee-structures/${id}`);
  return (await parseOrThrow<ApiEnvelope<{ structure: FeeStructure; lines: FeeStructureLine[] }>>(res)).data;
}

export async function createFeeStructure(input: { academicYearId: string; gradeId: string; mediumId?: string; category?: string; lines: FeeStructureLineInput[] }): Promise<FeeStructure> {
  const res = await apiFetch("/finance/fee-structures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<FeeStructure>>(res)).data;
}

export async function updateFeeStructure(id: string, input: { category?: string; lines?: FeeStructureLineInput[] }): Promise<FeeStructure> {
  const res = await apiFetch(`/finance/fee-structures/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<FeeStructure>>(res)).data;
}

export async function deleteFeeStructure(id: string): Promise<void> {
  const res = await apiFetch(`/finance/fee-structures/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Delete failed");
}

export async function activateFeeStructure(id: string): Promise<FeeStructure> {
  const res = await apiFetch(`/finance/fee-structures/${id}/activate`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<FeeStructure>>(res)).data;
}

export async function deactivateFeeStructure(id: string): Promise<FeeStructure> {
  const res = await apiFetch(`/finance/fee-structures/${id}/deactivate`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<FeeStructure>>(res)).data;
}

// ---------- Obligations / fee_demand (2.2) ----------
// Real state machine: PENDING, PARTIAL, PAID, WAIVED, OVERDUE, CANCELLED.

export type ObligationState = "PENDING" | "PARTIAL" | "PAID" | "WAIVED" | "OVERDUE" | "CANCELLED";

export interface Obligation {
  id: string;
  assignmentId: string;
  studentId: string;
  studentDisplayName: string | null;
  studentAdmissionNo: string | null;
  feeHeadId: string | null;
  instalmentNo: number;
  amountPaise: string;
  lateFeePaise: string;
  paidPaise: string;
  dueDate: string;
  state: ObligationState;
  bulkImportJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listObligations(filter: { studentId?: string; state?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<Obligation[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/obligations?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getObligation(id: string): Promise<Obligation> {
  const res = await apiFetch(`/finance/obligations/${id}`);
  return (await parseOrThrow<ApiEnvelope<Obligation>>(res)).data;
}

export async function createObligation(input: { assignmentId: string; studentId: string; feeHeadId?: string; instalmentNo: number; amountPaise: string; lateFeePaise?: string; dueDate: string }): Promise<Obligation> {
  const res = await apiFetch("/finance/obligations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Obligation>>(res)).data;
}

export async function deleteObligation(id: string): Promise<void> {
  const res = await apiFetch(`/finance/obligations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Delete failed");
}

export async function waiveObligation(id: string, reason: string): Promise<Obligation> {
  const res = await apiFetch(`/finance/obligations/${id}/waive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
  return (await parseOrThrow<ApiEnvelope<Obligation>>(res)).data;
}

// ---------- Payments (2.4/2.5/2.6) ----------
// Real mode enum: UPI/CARD/NETBANKING/CASH/CHEQUE/DD/WALLET_TOPUP. Real state enum:
// INITIATED/PENDING/CONFIRMED/FAILED/RECONCILED/REVERSED.

export type { PaymentMode } from "./finance-constants";
export { OFFLINE_PAYMENT_MODES, ONLINE_PAYMENT_MODES } from "./finance-constants";
import type { PaymentMode } from "./finance-constants";
export type PaymentState = "INITIATED" | "PENDING" | "CONFIRMED" | "FAILED" | "RECONCILED" | "REVERSED";

export interface Payment {
  id: string;
  paidByPersonId: string | null;
  amountPaise: string;
  mode: PaymentMode;
  gateway: string | null;
  gatewayRef: string | null;
  idempotencyKey: string;
  state: PaymentState;
  initiatedAt: string;
  confirmedAt: string | null;
  reconciledAt: string | null;
  failureReason: string | null;
  collectedBy: string | null;
}

/** What the Payments list shows beyond the bare payment: who it's for (blank for a
 * genuine multi-student split) and, when it resolved to exactly one receipt, that
 * receipt's own id — enough to link straight to Print without an extra page. */
export interface PaymentListItem extends Payment {
  studentNames: string | null;
  receiptId: string | null;
  receiptNo: string | null;
  receiptCount: number;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  feeDemandId: string;
  amountPaise: string;
  allocatedAt: string;
}

export interface Receipt {
  id: string;
  paymentId: string;
  studentId: string;
  receiptNo: string;
  financialYear: string;
  amountPaise: string;
  issuedOn: string;
  pdfObjectKey: string | null;
  isReprintOf: string | null;
}

export interface ReceiptLineItem {
  feeHeadId: string | null;
  feeHeadName: string | null;
  instalmentNo: number;
  amountPaise: string;
}

export interface ReceiptDetail {
  receipt: Receipt;
  payment: Payment;
  student: StudentLedger | null;
  lineItems: ReceiptLineItem[];
  school: SchoolProfile | null;
}

export async function getReceiptDetail(receiptId: string): Promise<ReceiptDetail> {
  const res = await apiFetch(`/finance/receipts/${receiptId}`);
  return (await parseOrThrow<ApiEnvelope<ReceiptDetail>>(res)).data;
}

export type RefundState = "PENDING" | "APPROVED" | "PROCESSED" | "REJECTED" | "FAILED";

export interface Refund {
  id: string;
  paymentId: string | null;
  studentId: string;
  amountPaise: string;
  reason: string;
  refundToSourceRef: string | null;
  approvalRequestId: string | null;
  state: RefundState;
  processedAt: string | null;
  createdAt: string;
}

export async function listPayments(
  filter: { state?: string; mode?: string; studentSearch?: string; fromDate?: string; toDate?: string; page?: number; pageSize?: number } = {},
): Promise<ApiEnvelope<PaymentListItem[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/payments?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getPayment(id: string): Promise<Payment> {
  const res = await apiFetch(`/finance/payments/${id}`);
  return (await parseOrThrow<ApiEnvelope<Payment>>(res)).data;
}

/** DD only: PENDING ("received") -> CONFIRMED ("cleared") — only now does it reduce the obligation's balance and generate a receipt. */
export async function clearEducationLoanDD(paymentId: string): Promise<{ payment: Payment; receipt: Receipt | null }> {
  const res = await apiFetch(`/finance/payments/${paymentId}/clear-dd`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<{ payment: Payment; receipt: Receipt | null }>>(res)).data;
}

export interface EducationLoanDD extends Payment {
  studentId: string;
  studentDisplayName: string;
  studentAdmissionNo: string;
}

export async function listAllEducationLoanDDs(filter: { search?: string; state?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<EducationLoanDD[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/education-loan-dds?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function createPayment(input: { amountPaise: string; mode: PaymentMode; paidByPersonId?: string; idempotencyKey: string; gateway?: string }): Promise<Payment> {
  const res = await apiFetch("/finance/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Payment>>(res)).data;
}

export async function allocatePayment(id: string, allocations: { feeDemandId: string; amountPaise: string }[]): Promise<{ allocations: PaymentAllocation[]; receipts: Receipt[] }> {
  const res = await apiFetch(`/finance/payments/${id}/allocations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ allocations }) });
  return (await parseOrThrow<ApiEnvelope<{ allocations: PaymentAllocation[]; receipts: Receipt[] }>>(res)).data;
}

export async function getReceipts(paymentId: string): Promise<Receipt[]> {
  const res = await apiFetch(`/finance/payments/${paymentId}/receipt`);
  return (await parseOrThrow<ApiEnvelope<Receipt[]>>(res)).data;
}

export async function generateReceipts(paymentId: string): Promise<Receipt[]> {
  const res = await apiFetch(`/finance/payments/${paymentId}/receipt`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<Receipt[]>>(res)).data;
}

export async function listRefundsForPayment(paymentId: string): Promise<Refund[]> {
  const res = await apiFetch(`/finance/payments/${paymentId}/refunds`);
  return (await parseOrThrow<ApiEnvelope<Refund[]>>(res)).data;
}

export async function createRefund(paymentId: string, input: { studentId: string; amountPaise: string; reason: string }): Promise<Refund> {
  const res = await apiFetch(`/finance/payments/${paymentId}/refunds`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Refund>>(res)).data;
}

export async function getRefund(id: string): Promise<Refund> {
  const res = await apiFetch(`/finance/refunds/${id}`);
  return (await parseOrThrow<ApiEnvelope<Refund>>(res)).data;
}

export async function processRefundPayout(id: string): Promise<Refund> {
  const res = await apiFetch(`/finance/refunds/${id}/process`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<Refund>>(res)).data;
}

// ---------- Concessions ----------
// Real state machine: PENDING, APPROVED, REJECTED, CANCELLED. Always 2-step FINANCE->PRINCIPAL.

export { CONCESSION_TYPES } from "./finance-constants";
export type { ConcessionType } from "./finance-constants";
import type { ConcessionType } from "./finance-constants";
export type ConcessionState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Concession {
  id: string;
  studentId: string;
  studentDisplayName: string | null;
  studentAdmissionNo: string | null;
  academicYearId: string;
  concessionType: ConcessionType;
  amountPaise: string | null;
  percent: string | null;
  reason: string;
  approvalRequestId: string | null;
  state: ConcessionState;
  createdAt: string;
}

export async function listConcessions(filter: { studentId?: string; state?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<Concession[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/concessions?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getConcession(id: string): Promise<Concession> {
  const res = await apiFetch(`/finance/concessions/${id}`);
  return (await parseOrThrow<ApiEnvelope<Concession>>(res)).data;
}

export async function createConcession(input: { studentId: string; academicYearId: string; concessionType: ConcessionType; amountPaise?: string; percent?: string; reason: string }): Promise<Concession> {
  const res = await apiFetch("/finance/concessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Concession>>(res)).data;
}

export async function updateConcession(id: string, input: { amountPaise?: string; percent?: string; reason?: string }): Promise<Concession> {
  const res = await apiFetch(`/finance/concessions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Concession>>(res)).data;
}

export async function deleteConcession(id: string): Promise<void> {
  const res = await apiFetch(`/finance/concessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Delete failed");
}

// ---------- Expenses (2.8) ----------
// Real state machine: RECORDED -> PENDING_APPROVAL -> APPROVED/REJECTED -> PAID. No SUBMITTED/CANCELLED states exist.

export type ExpenseState = "RECORDED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PAID";

export interface Expense {
  id: string;
  categoryId: string;
  amountPaise: string;
  incurredOn: string;
  vendorName: string | null;
  description: string | null;
  billObjectKey: string | null;
  recordedBy: string | null;
  approvalRequestId: string | null;
  state: ExpenseState;
  createdAt: string;
}

export async function listExpenses(filter: { state?: string; categoryId?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<Expense[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/expenses?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getExpense(id: string): Promise<Expense> {
  const res = await apiFetch(`/finance/expenses/${id}`);
  return (await parseOrThrow<ApiEnvelope<Expense>>(res)).data;
}

export async function createExpense(input: { categoryId: string; amountPaise: string; incurredOn: string; vendorName?: string; description?: string; billObjectKey?: string }): Promise<Expense> {
  const res = await apiFetch("/finance/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Expense>>(res)).data;
}

export async function updateExpense(id: string, input: { amountPaise?: string; incurredOn?: string; vendorName?: string; description?: string; billObjectKey?: string }): Promise<Expense> {
  const res = await apiFetch(`/finance/expenses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Expense>>(res)).data;
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await apiFetch(`/finance/expenses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Delete failed");
}

export async function submitExpense(id: string): Promise<Expense> {
  const res = await apiFetch(`/finance/expenses/${id}/submit`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<Expense>>(res)).data;
}

export async function payExpense(id: string): Promise<Expense> {
  const res = await apiFetch(`/finance/expenses/${id}/pay`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<Expense>>(res)).data;
}

// ---------- Obligation Imports / Bulk Import (2.3) — requires migration 0002 ----------

export type ImportJobState = "DRAFT" | "VALIDATED" | "VALIDATION_FAILED" | "COMMITTED" | "CANCELLED";

export interface ImportJob {
  id: string;
  jobType: string;
  sourceObjectKey: string;
  fileName: string;
  totalRows: number | null;
  validRows: number | null;
  errorRows: number | null;
  rowErrors: unknown;
  state: ImportJobState;
  createdBy: string;
  validatedAt: string | null;
  committedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface ImportRow {
  assignmentId: string;
  studentId: string;
  feeHeadId?: string;
  instalmentNo: number;
  amountPaise: string;
  lateFeePaise?: string;
  dueDate: string;
}

export async function listImportJobs(filter: { state?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<ImportJob[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/obligation-imports?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getImportJob(id: string): Promise<ImportJob> {
  const res = await apiFetch(`/finance/obligation-imports/${id}`);
  return (await parseOrThrow<ApiEnvelope<ImportJob>>(res)).data;
}

export async function createImportJob(input: { fileName: string; sourceObjectKey: string; jobType?: string }): Promise<ImportJob> {
  const res = await apiFetch("/finance/obligation-imports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<ImportJob>>(res)).data;
}

export async function validateImportJob(id: string, rows: ImportRow[]): Promise<ImportJob> {
  const res = await apiFetch(`/finance/obligation-imports/${id}/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
  return (await parseOrThrow<ApiEnvelope<ImportJob>>(res)).data;
}

export async function confirmImportJob(id: string, rows: ImportRow[]): Promise<ImportJob> {
  const res = await apiFetch(`/finance/obligation-imports/${id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
  return (await parseOrThrow<ApiEnvelope<ImportJob>>(res)).data;
}

export async function cancelImportJob(id: string): Promise<ImportJob> {
  const res = await apiFetch(`/finance/obligation-imports/${id}/cancel`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<ImportJob>>(res)).data;
}

// ---------- Reconciliation (2.9) — requires migration 0003 ----------

export type ReconciliationState = "DRAFT" | "RUNNING" | "NEEDS_REVIEW" | "CLOSED";

export interface Reconciliation {
  id: string;
  gateway: string;
  periodFrom: string;
  periodTo: string;
  settlementObjectKey: string | null;
  state: ReconciliationState;
  matchedCount: number;
  unmatchedCount: number;
  discrepancyCount: number;
  createdBy: string;
  runAt: string | null;
  closedBy: string | null;
  closedAt: string | null;
  createdAt: string;
}

export interface ReconciliationEntry {
  id: string;
  reconciliationId: string;
  paymentId: string | null;
  gatewayRef: string;
  gatewayAmountPaise: string;
  matchState: "MATCHED" | "UNMATCHED" | "DISCREPANCY" | "RESOLVED";
  discrepancyReason: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

export async function listReconciliations(filter: { state?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<Reconciliation[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/reconciliations?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getReconciliation(id: string): Promise<{ reconciliation: Reconciliation; entries: ReconciliationEntry[] }> {
  const res = await apiFetch(`/finance/reconciliations/${id}`);
  return (await parseOrThrow<ApiEnvelope<{ reconciliation: Reconciliation; entries: ReconciliationEntry[] }>>(res)).data;
}

export async function createReconciliation(input: { gateway: string; periodFrom: string; periodTo: string; settlementObjectKey?: string }): Promise<Reconciliation> {
  const res = await apiFetch("/finance/reconciliations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Reconciliation>>(res)).data;
}

export async function deleteReconciliation(id: string): Promise<void> {
  const res = await apiFetch(`/finance/reconciliations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Delete failed");
}

export async function runReconciliation(id: string, settlementRows: { gatewayRef: string; amountPaise: string }[]): Promise<Reconciliation> {
  const res = await apiFetch(`/finance/reconciliations/${id}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settlementRows }) });
  return (await parseOrThrow<ApiEnvelope<Reconciliation>>(res)).data;
}

export async function resolveReconciliationEntry(id: string, entryId: string, resolutionNote: string): Promise<Reconciliation> {
  const res = await apiFetch(`/finance/reconciliations/${id}/resolve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entryId, resolutionNote }) });
  return (await parseOrThrow<ApiEnvelope<Reconciliation>>(res)).data;
}

export async function closeReconciliation(id: string): Promise<Reconciliation> {
  const res = await apiFetch(`/finance/reconciliations/${id}/close`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<Reconciliation>>(res)).data;
}

// ---------- Approvals (Feature 1 — used from Finance detail pages) ----------

export interface ApprovalRequest {
  id: string;
  requestType: string;
  subjectObjectType: string;
  subjectObjectId: string;
  requestedBy: string;
  requestedByName: string | null;
  payload: Record<string, unknown>;
  amountPaise: string | null;
  currentStep: number;
  state: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETROSPECTIVE_PENDING";
  dueAt: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalStep {
  id: string;
  requestId: string;
  sequenceNo: number;
  approverRoleCode: string;
  decidedBy: string | null;
  decision: "APPROVED" | "REJECTED" | null;
  comment: string | null;
  decidedAt: string | null;
  escalatedAt: string | null;
}

export async function listApprovals(filter: { requestType?: string; status?: "PENDING" | "APPROVED" | "REJECTED" } = {}): Promise<ApprovalRequest[]> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/approvals?${qs.toString()}`);
  return (await parseOrThrow<ApiEnvelope<ApprovalRequest[]>>(res)).data;
}

export async function getApproval(id: string): Promise<{ request: ApprovalRequest; steps: ApprovalStep[] }> {
  const res = await apiFetch(`/approvals/${id}`);
  return (await parseOrThrow<ApiEnvelope<{ request: ApprovalRequest; steps: ApprovalStep[] }>>(res)).data;
}

export async function approveRequest(id: string, comment?: string): Promise<{ request: ApprovalRequest; steps: ApprovalStep[] }> {
  const res = await apiFetch(`/approvals/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment }) });
  return (await parseOrThrow<ApiEnvelope<{ request: ApprovalRequest; steps: ApprovalStep[] }>>(res)).data;
}

export async function rejectRequest(id: string, comment: string): Promise<{ request: ApprovalRequest; steps: ApprovalStep[] }> {
  const res = await apiFetch(`/approvals/${id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comment }) });
  return (await parseOrThrow<ApiEnvelope<{ request: ApprovalRequest; steps: ApprovalStep[] }>>(res)).data;
}

export async function withdrawRequest(id: string): Promise<ApprovalRequest> {
  const res = await apiFetch(`/approvals/${id}/withdraw`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<ApprovalRequest>>(res)).data;
}

// ---------- Students (the Fee Payments / Student Workspace hub) ----------
// Finance's own minimal student lookup — no People/Academics module exists yet to
// list/search students from. community_category is our schema's real equivalent of
// "quota" (SC/ST/MBC/BC/OBC/MINORITY/GENERAL) — not an invented field.

export type DueStatus = "PAID" | "PARTIAL" | "OVERDUE" | "PENDING" | "NO_DEMAND";

export interface StudentLedger {
  id: string;
  admissionNo: string;
  displayName: string;
  communityCategory: string | null;
  gradeName: string | null;
  sectionName: string | null;
  academicYearName: string | null;
  assignmentId: string | null;
  totalDemandPaise: string;
  paidPaise: string;
  outstandingPaise: string;
  lastPaymentAt: string | null;
  dueStatus: DueStatus;
}

export async function listStudents(filter: { search?: string; gradeId?: string; dueStatus?: string; page?: number; pageSize?: number } = {}): Promise<ApiEnvelope<StudentLedger[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/students?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getStudent(id: string): Promise<StudentLedger> {
  const res = await apiFetch(`/finance/students/${id}`);
  return (await parseOrThrow<ApiEnvelope<StudentLedger>>(res)).data;
}

export async function listStudentPayments(studentId: string): Promise<PaymentListItem[]> {
  const res = await apiFetch(`/finance/students/${studentId}/payments`);
  return (await parseOrThrow<ApiEnvelope<PaymentListItem[]>>(res)).data;
}

export async function listStudentEducationLoanDDs(studentId: string): Promise<PaymentListItem[]> {
  const res = await apiFetch(`/finance/students/${studentId}/education-loan-dds`);
  return (await parseOrThrow<ApiEnvelope<PaymentListItem[]>>(res)).data;
}

export async function receiveStudentPayment(
  studentId: string,
  input: { feeDemandId: string; amountPaise: string; mode: "CASH" | "CHEQUE" | "DD"; idempotencyKey: string; bankName?: string; ddReferenceNo?: string },
): Promise<{ payment: Payment; receipt: Receipt | null }> {
  const res = await apiFetch(`/finance/students/${studentId}/receive-payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<{ payment: Payment; receipt: Receipt | null }>>(res)).data;
}

// ---------- Purchase Requests / Service Requests + Purchase Orders ----------
// Principal raises one (GOODS = Purchase Request, SERVICE = Service Request); it routes
// through the generic approvals engine to a single FINANCE step. The moment Finance
// approves it, the backend auto-creates the linked purchase_order so Finance can track
// its physical fulfillment (Ordered -> Dispatched -> In Transit -> Delivered), bounded
// by DB-enforced quantity constraints. See school-eos-backend's
// database/migrations/0004_purchase_requests.sql.

export type PurchaseRequestType = "GOODS" | "SERVICE";
export type PurchaseRequestState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface PurchaseRequest {
  id: string;
  referenceNo: string;
  requestType: PurchaseRequestType;
  itemName: string;
  description: string | null;
  quantity: number | null;
  vendorName: string | null;
  estimatedAmountPaise: string | null;
  neededBy: string | null;
  departmentId: string | null;
  departmentName: string | null;
  requestedBy: string;
  requestedByName: string | null;
  requestedByEmail: string | null;
  approvalRequestId: string | null;
  state: PurchaseRequestState;
  createdAt: string;
}

/** Real, DB-computed KPI numbers behind the POP/SOP Approval dashboard cards — never derived client-side from a capped page of rows. */
export interface PurchaseRequestSummary {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  totalCount: number;
  approvedValuePaise: string;
}

export type PurchaseOrderStage = "ORDERED" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "PART_DELIVERED" | "CANCELLED";

export interface PurchaseOrder {
  id: string;
  purchaseRequestId: string;
  orderNo: string;
  quantityOrdered: number;
  quantityDelivered: number;
  quantityAllotted: number;
  stage: PurchaseOrderStage;
  placedOn: string;
  expectedOn: string | null;
  createdBy: string;
  createdAt: string;
  /** Joined from the originating request — display-only, never written back through this row. */
  itemName?: string;
  referenceNo?: string;
  requestType?: PurchaseRequestType;
  description?: string | null;
  vendorName?: string | null;
  estimatedAmountPaise?: string | null;
  departmentName?: string | null;
  requestedByName?: string | null;
  requestedByEmail?: string | null;
}

export interface PurchaseOrderSummary {
  totalOrders: number;
  inProgressCount: number;
  deliveredCount: number;
  awaitingAllotmentCount: number;
  approvedValuePaise: string;
}

export interface PurchaseOrderEvent {
  id: string;
  purchaseOrderId: string;
  stage: PurchaseOrderStage;
  quantityDelivered: number | null;
  note: string | null;
  recordedBy: string;
  recordedByEmail: string | null;
  recordedAt: string;
}

export interface Department {
  id: string;
  name: string;
}

export async function listDepartments(): Promise<Department[]> {
  const res = await apiFetch("/finance/departments");
  return (await parseOrThrow<ApiEnvelope<Department[]>>(res)).data;
}

export async function listPurchaseRequests(
  filter: { state?: string; requestType?: string; departmentId?: string; search?: string; page?: number; pageSize?: number } = {},
): Promise<ApiEnvelope<PurchaseRequest[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/purchase-requests?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getPurchaseRequestsSummary(requestType: PurchaseRequestType): Promise<PurchaseRequestSummary> {
  const res = await apiFetch(`/finance/purchase-requests/summary?requestType=${requestType}`);
  return (await parseOrThrow<ApiEnvelope<PurchaseRequestSummary>>(res)).data;
}

export async function getPurchaseRequest(id: string): Promise<{ request: PurchaseRequest; order: PurchaseOrder | null }> {
  const res = await apiFetch(`/finance/purchase-requests/${id}`);
  return (await parseOrThrow<ApiEnvelope<{ request: PurchaseRequest; order: PurchaseOrder | null }>>(res)).data;
}

export async function createPurchaseRequest(input: {
  requestType: PurchaseRequestType;
  itemName: string;
  description?: string;
  quantity?: number;
  vendorName?: string;
  estimatedAmountPaise?: string;
  neededBy?: string;
  departmentId?: string;
}): Promise<PurchaseRequest> {
  const res = await apiFetch("/finance/purchase-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<PurchaseRequest>>(res)).data;
}

export async function listPurchaseOrders(
  filter: { stage?: string; requestType?: string; search?: string; page?: number; pageSize?: number } = {},
): Promise<ApiEnvelope<PurchaseOrder[]>> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/finance/purchase-orders?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getPurchaseOrdersSummary(requestType: PurchaseRequestType): Promise<PurchaseOrderSummary> {
  const res = await apiFetch(`/finance/purchase-orders/summary?requestType=${requestType}`);
  return (await parseOrThrow<ApiEnvelope<PurchaseOrderSummary>>(res)).data;
}

export async function getPurchaseOrder(id: string): Promise<{ order: PurchaseOrder; events: PurchaseOrderEvent[] }> {
  const res = await apiFetch(`/finance/purchase-orders/${id}`);
  return (await parseOrThrow<ApiEnvelope<{ order: PurchaseOrder; events: PurchaseOrderEvent[] }>>(res)).data;
}

export async function updatePurchaseOrderStage(id: string, input: { stage: PurchaseOrderStage; quantityDelivered?: number; note?: string }): Promise<PurchaseOrder> {
  const res = await apiFetch(`/finance/purchase-orders/${id}/update-stage`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<PurchaseOrder>>(res)).data;
}

export async function allotPurchaseOrder(id: string, input: { quantity: number; note?: string }): Promise<PurchaseOrder> {
  const res = await apiFetch(`/finance/purchase-orders/${id}/allot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<PurchaseOrder>>(res)).data;
}
