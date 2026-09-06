// Server-side-only Library API client — every call goes through apiFetch (Server
// Actions/Server Components only), matching this app's convention: the browser never
// calls the backend directly and never holds a token. Mirrors src/lib/finance-api.ts's
// own shape (ApiEnvelope<T>, parseOrThrow, one typed function per endpoint) since
// Library is architecturally the same thing Finance is — a new role with its own
// login, its own full CRUD dashboard — not a page nested inside Admin. Money is
// always a paise integer (string or number from the backend), never a float.

import { apiFetch } from "./api";

export interface ApiEnvelope<T> {
  data: T;
  meta?: { page: number; limit: number; total: number };
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return body as T;
}

function qs(filter: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

// ---------- Categories ----------

export type CategoryStatus = "ACTIVE" | "INACTIVE";

export interface LibraryCategory {
  id: string;
  name: string;
  status: CategoryStatus;
}

export async function listCategories(filter: { status?: string } = {}): Promise<LibraryCategory[]> {
  const res = await apiFetch(`/library/categories?${qs(filter)}`);
  return (await parseOrThrow<ApiEnvelope<LibraryCategory[]>>(res)).data;
}

export async function createCategory(name: string): Promise<LibraryCategory> {
  const res = await apiFetch("/library/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
  return (await parseOrThrow<ApiEnvelope<LibraryCategory>>(res)).data;
}

export async function updateCategory(id: string, input: { name?: string; status?: CategoryStatus }): Promise<LibraryCategory> {
  const res = await apiFetch(`/library/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<LibraryCategory>>(res)).data;
}

// ---------- Books ----------

export type BookStatus = "ACTIVE" | "WITHDRAWN";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  publisher: string | null;
  edition: string | null;
  categoryId: string | null;
  categoryName: string | null;
  publicationYear: number | null;
  language: string | null;
  description: string | null;
  coverImageUrl: string | null;
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
}

/** The 3 counts the catalog list table renders -- cheaper than the full
 * per-status breakdown findCopiesSummary computes for a single book. */
export interface ListCopiesSummary {
  total: number;
  available: number;
  issued: number;
}

export interface BookListRow extends Book {
  copiesSummary: ListCopiesSummary;
}

export interface CopiesSummary {
  total: number;
  available: number;
  issued: number;
  lost: number;
  damaged: number;
  underRepair: number;
  retired: number;
}

export interface BookDetail extends Book {
  copiesSummary: CopiesSummary;
}

export async function listBooks(
  filter: {
    search?: string;
    categoryId?: string;
    author?: string;
    publisher?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<ApiEnvelope<BookListRow[]>> {
  const res = await apiFetch(`/library/books?${qs(filter)}`);
  return parseOrThrow(res);
}

export async function getBook(id: string): Promise<BookDetail> {
  const res = await apiFetch(`/library/books/${id}`);
  return (await parseOrThrow<ApiEnvelope<BookDetail>>(res)).data;
}

export interface BookInput {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  categoryId?: string;
  publicationYear?: number;
  language?: string;
  description?: string;
  coverImageUrl?: string;
}

export async function createBook(input: BookInput): Promise<Book> {
  const res = await apiFetch("/library/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Book>>(res)).data;
}

export async function updateBook(id: string, input: Partial<BookInput>): Promise<Book> {
  const res = await apiFetch(`/library/books/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Book>>(res)).data;
}

export async function withdrawBook(id: string): Promise<Book> {
  const res = await apiFetch(`/library/books/${id}/withdraw`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<Book>>(res)).data;
}

// ---------- Book copies ----------

export type CopyStatus = "AVAILABLE" | "ISSUED" | "RESERVED" | "LOST" | "DAMAGED" | "UNDER_REPAIR" | "RETIRED";

export interface BookCopy {
  id: string;
  bookId: string;
  copyCode: string;
  shelfLocation: string | null;
  status: CopyStatus;
  acquisitionDate: string | null;
  acquisitionCostPaise: string | number | null;
}

export async function listBookCopies(bookId: string): Promise<BookCopy[]> {
  const res = await apiFetch(`/library/books/${bookId}/copies`);
  return (await parseOrThrow<ApiEnvelope<BookCopy[]>>(res)).data;
}

export interface BookCopyInput {
  copyCode: string;
  shelfLocation?: string;
  acquisitionDate?: string;
  acquisitionCostPaise?: string;
}

export async function createBookCopy(bookId: string, input: BookCopyInput): Promise<BookCopy> {
  const res = await apiFetch(`/library/books/${bookId}/copies`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<BookCopy>>(res)).data;
}

export async function updateBookCopy(id: string, input: { copyCode?: string; shelfLocation?: string }): Promise<BookCopy> {
  const res = await apiFetch(`/library/copies/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<BookCopy>>(res)).data;
}

export async function markCopyLost(id: string, input: { reason?: string; notes?: string } = {}): Promise<BookCopy> {
  const res = await apiFetch(`/library/copies/${id}/mark-lost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<BookCopy>>(res)).data;
}

export async function markCopyDamaged(id: string, input: { reason?: string; notes?: string } = {}): Promise<BookCopy> {
  const res = await apiFetch(`/library/copies/${id}/mark-damaged`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<BookCopy>>(res)).data;
}

export async function withdrawCopy(id: string): Promise<BookCopy> {
  const res = await apiFetch(`/library/copies/${id}/withdraw`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<BookCopy>>(res)).data;
}

export async function markCopyUnderRepair(id: string): Promise<BookCopy> {
  const res = await apiFetch(`/library/copies/${id}/mark-under-repair`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<BookCopy>>(res)).data;
}

export async function restoreCopy(id: string): Promise<BookCopy> {
  const res = await apiFetch(`/library/copies/${id}/restore`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<BookCopy>>(res)).data;
}

// ---------- Members ----------

export type MemberType = "STUDENT" | "STAFF";
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface LibraryMember {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  memberType: MemberType;
  /** Admission no. (student) or employee no. (staff). */
  identifier: string | null;
  gradeId: string | null;
  gradeName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  maxBooksAllowed: number;
  status: MemberStatus;
  suspendedReason: string | null;
}

/** The Members list's own row shape -- adds the two counts the list table
 * renders (cheaper than fetching each member's own detail). */
export interface LibraryMemberListRow extends LibraryMember {
  activeIssuesCount: number;
  overdueCount: number;
  pendingFinesAmountPaise: string | number;
}

export interface LibraryMemberDetail extends LibraryMember {
  activeIssuesCount: number;
  pendingFinesAmountPaise: string | number;
}

export interface LibraryGrade {
  id: string;
  name: string;
}

export interface LibrarySection {
  id: string;
  gradeId: string;
  name: string;
}

/** A person not yet a Library member — for the "add member" picker. Shape mirrors
 * the app's other lightweight person-search hits (dashboard/PersonPicker's PersonHit). */
export interface EligiblePerson {
  personId: string;
  firstName: string;
  lastName: string | null;
  memberType: MemberType;
  /** Admission no. (student) or employee no. (staff). */
  identifier: string;
}

export async function listMembers(
  filter: {
    search?: string;
    status?: string;
    memberType?: string;
    gradeId?: string;
    sectionId?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<ApiEnvelope<LibraryMemberListRow[]>> {
  const res = await apiFetch(`/library/members?${qs(filter)}`);
  return parseOrThrow(res);
}

export async function listMemberGrades(): Promise<LibraryGrade[]> {
  const res = await apiFetch("/library/members/grades-lookup");
  return (await parseOrThrow<ApiEnvelope<LibraryGrade[]>>(res)).data;
}

export async function listMemberSections(gradeId?: string): Promise<LibrarySection[]> {
  const res = await apiFetch(`/library/members/sections-lookup?${qs({ gradeId })}`);
  return (await parseOrThrow<ApiEnvelope<LibrarySection[]>>(res)).data;
}

export async function getMember(id: string): Promise<LibraryMemberDetail> {
  const res = await apiFetch(`/library/members/${id}`);
  return (await parseOrThrow<ApiEnvelope<LibraryMemberDetail>>(res)).data;
}

export async function listEligibleMembers(search?: string): Promise<EligiblePerson[]> {
  const res = await apiFetch(`/library/members/eligible?${qs({ search })}`);
  return (await parseOrThrow<ApiEnvelope<EligiblePerson[]>>(res)).data;
}

export async function createMember(input: { personId: string; memberType: MemberType; maxBooksAllowed?: number }): Promise<LibraryMember> {
  const res = await apiFetch("/library/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<LibraryMember>>(res)).data;
}

export async function updateMember(id: string, input: { memberType?: MemberType; maxBooksAllowed?: number }): Promise<LibraryMember> {
  const res = await apiFetch(`/library/members/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<LibraryMember>>(res)).data;
}

export async function suspendMember(id: string, reason: string): Promise<LibraryMember> {
  const res = await apiFetch(`/library/members/${id}/suspend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
  return (await parseOrThrow<ApiEnvelope<LibraryMember>>(res)).data;
}

export async function reactivateMember(id: string): Promise<LibraryMember> {
  const res = await apiFetch(`/library/members/${id}/reactivate`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<LibraryMember>>(res)).data;
}

// ---------- Circulation (issues) ----------

export type IssueStatus = "ISSUED" | "RETURNED" | "OVERDUE" | "LOST";

export interface LibraryIssue {
  id: string;
  copyId: string;
  bookTitle: string;
  copyCode: string;
  memberId: string;
  memberName: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  renewedCount: number;
  status: IssueStatus;
  isOverdue: boolean;
  daysOverdue: number;
  /** Not a real charge until the book is actually returned late -- daysOverdue
   * times the current fine-per-day rate, for an honest "if returned today" estimate. */
  projectedFinePaise: string | number;
}

export async function listIssues(
  filter: {
    status?: string;
    search?: string;
    memberId?: string;
    overdueOnly?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<ApiEnvelope<LibraryIssue[]>> {
  const res = await apiFetch(`/library/issues?${qs(filter)}`);
  return parseOrThrow(res);
}

export async function getIssue(id: string): Promise<LibraryIssue> {
  const res = await apiFetch(`/library/issues/${id}`);
  return (await parseOrThrow<ApiEnvelope<LibraryIssue>>(res)).data;
}

export async function createIssue(input: { copyId: string; memberId: string }): Promise<LibraryIssue> {
  const res = await apiFetch("/library/issues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<LibraryIssue>>(res)).data;
}

export async function returnIssue(id: string): Promise<LibraryIssue> {
  const res = await apiFetch(`/library/issues/${id}/return`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<LibraryIssue>>(res)).data;
}

export async function renewIssue(id: string): Promise<LibraryIssue> {
  const res = await apiFetch(`/library/issues/${id}/renew`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<LibraryIssue>>(res)).data;
}

export async function markIssueLost(id: string, input: { reason?: string; notes?: string } = {}): Promise<LibraryIssue> {
  const res = await apiFetch(`/library/issues/${id}/mark-lost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<LibraryIssue>>(res)).data;
}

// ---------- Reservations ----------

export type ReservationStatus = "PENDING" | "READY" | "FULFILLED" | "CANCELLED" | "EXPIRED";

export interface LibraryReservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  reservedAt: string;
  status: ReservationStatus;
  /** 1-based FIFO position among this book's other PENDING reservations --
   * only meaningful while status is PENDING, null otherwise. */
  queuePosition: number | null;
  /** When this reservation became READY (the copy is now held for this
   * member specifically) -- null until then. */
  readyAt: string | null;
  fulfilledIssueId: string | null;
  /** Set the moment the reservation becomes READY, computed server-side from
   * the current hold-period config -- when it passes, the reservation
   * self-expires and the copy moves to whoever's next in queue. */
  expiresAt: string | null;
}

export async function listReservations(
  filter: { status?: string; bookId?: string; memberId?: string; search?: string } = {},
): Promise<LibraryReservation[]> {
  const res = await apiFetch(`/library/reservations?${qs(filter)}`);
  return (await parseOrThrow<ApiEnvelope<LibraryReservation[]>>(res)).data;
}

export async function getReservation(id: string): Promise<LibraryReservation> {
  const res = await apiFetch(`/library/reservations/${id}`);
  return (await parseOrThrow<ApiEnvelope<LibraryReservation>>(res)).data;
}

export async function createReservation(input: { bookId: string; memberId: string }): Promise<LibraryReservation> {
  const res = await apiFetch("/library/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<LibraryReservation>>(res)).data;
}

export async function cancelReservation(id: string): Promise<LibraryReservation> {
  const res = await apiFetch(`/library/reservations/${id}/cancel`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<LibraryReservation>>(res)).data;
}

// ---------- Fines ----------
// This endpoint is readable by LIBRARY, ADMIN and FINANCE — Finance's own
// Library-fines page (src/app/(dashboard)/finance/library/page.tsx) reads this
// SAME listFines()/getFine() below; it must never fetch or render a second copy
// of this data from anywhere else.

export type FineReason = "OVERDUE" | "LOST" | "DAMAGED";
export type FineStatus = "PENDING" | "SENT_TO_FINANCE" | "PARTIALLY_PAID" | "PAID" | "WAIVED" | "CANCELLED";

export interface LibraryFine {
  id: string;
  issueId: string;
  memberId: string;
  memberName: string;
  reason: FineReason;
  amountPaise: string | number;
  assessedAt: string;
  status: FineStatus;
  financeReceivableId: string | null;
  waivedReason: string | null;
}

export async function listFines(
  filter: { status?: string; memberId?: string; page?: number; limit?: number } = {},
): Promise<ApiEnvelope<LibraryFine[]>> {
  const res = await apiFetch(`/library/fines?${qs(filter)}`);
  return parseOrThrow(res);
}

export async function getFine(id: string): Promise<LibraryFine> {
  const res = await apiFetch(`/library/fines/${id}`);
  return (await parseOrThrow<ApiEnvelope<LibraryFine>>(res)).data;
}

export async function sendFineToFinance(id: string): Promise<LibraryFine> {
  const res = await apiFetch(`/library/fines/${id}/send-to-finance`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<LibraryFine>>(res)).data;
}

export async function refreshFineStatus(id: string): Promise<LibraryFine> {
  const res = await apiFetch(`/library/fines/${id}/refresh-status`, { method: "POST" });
  return (await parseOrThrow<ApiEnvelope<LibraryFine>>(res)).data;
}

export async function waiveFine(id: string, reason: string): Promise<LibraryFine> {
  const res = await apiFetch(`/library/fines/${id}/waive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
  return (await parseOrThrow<ApiEnvelope<LibraryFine>>(res)).data;
}

// ---------- Config ----------

export interface LibraryConfig {
  loanPeriodDays: number;
  maxRenewals: number;
  finePerDayPaise: string | number;
  maxBooksPerMember: number;
  reservationHoldDays: number;
}

export async function getLibraryConfig(): Promise<LibraryConfig> {
  const res = await apiFetch("/library/config");
  return (await parseOrThrow<ApiEnvelope<LibraryConfig>>(res)).data;
}

export async function updateLibraryConfig(input: Partial<LibraryConfig>): Promise<LibraryConfig> {
  const res = await apiFetch("/library/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<LibraryConfig>>(res)).data;
}

// ---------- Audit / History ----------
// Same generic audit_event feed Reports' "Transaction History" reads (see
// backend LibraryAuditLogRepository) -- this is the richer, filterable,
// detail-capable view over that one repository, not a second event log.

export interface LibraryAuditEntry {
  id: string;
  action: string;
  objectType: string;
  objectId: string;
  outcome: string;
  actorPersonId: string | null;
  actorName: string | null;
  actorRoleCode: string | null;
  correlationId: string | null;
  detail: string | null;
  occurredAt: string;
  beforeData: unknown;
  afterData: unknown;
}

export interface LibraryAuditFilterOptions {
  actions: string[];
  objectTypes: string[];
}

export async function listLibraryAudit(
  filter: {
    action?: string;
    objectType?: string;
    actorPersonId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<ApiEnvelope<LibraryAuditEntry[]>> {
  const res = await apiFetch(`/library/audit?${qs(filter)}`);
  return parseOrThrow(res);
}

export async function getLibraryAuditEntry(id: string): Promise<LibraryAuditEntry> {
  const res = await apiFetch(`/library/audit/${id}`);
  return (await parseOrThrow<ApiEnvelope<LibraryAuditEntry>>(res)).data;
}

export async function getLibraryAuditFilters(): Promise<LibraryAuditFilterOptions> {
  const res = await apiFetch("/library/audit/filters");
  return (await parseOrThrow<ApiEnvelope<LibraryAuditFilterOptions>>(res)).data;
}

// ---------- Overview ----------
// The ONE oversight surface Admin's /admin/library page is allowed to read —
// deliberately the only Library endpoint that page calls.

export interface LibraryRecentActivity {
  id: string;
  action: string;
  detail: string;
  occurredAt: string;
}

export interface LibraryOverview {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  reservedCopies: number;
  overdueCount: number;
  lostCopies: number;
  damagedCopies: number;
  underRepairCopies: number;
  retiredCopies: number;
  activeMembers: number;
  pendingReservationsCount: number;
  readyReservationsCount: number;
  pendingFinesAmountPaise: string | number;
  sentToFinanceFinesAmountPaise: string | number;
  recentActivity: LibraryRecentActivity[];
}

export async function getLibraryOverview(): Promise<LibraryOverview> {
  const res = await apiFetch("/library/overview");
  return (await parseOrThrow<ApiEnvelope<LibraryOverview>>(res)).data;
}

// ---------- Lost & Damaged ----------
// Read-only here -- the actual report is created as a side effect of
// markCopyLost/markCopyDamaged/markIssueLost above (backend inserts one
// library_lost_damaged_report row), never a separate create call.

export interface LibraryLostDamagedReport {
  id: string;
  copyId: string;
  copyCode: string;
  bookId: string;
  bookTitle: string;
  /** The copy's CURRENT live status, not a stored field on this row -- see
   * backend repository comment. AVAILABLE/RETIRED effectively means resolved. */
  currentCopyStatus: CopyStatus;
  issueId: string | null;
  memberId: string | null;
  memberName: string | null;
  type: "LOST" | "DAMAGED";
  reason: string | null;
  notes: string | null;
  fineId: string | null;
  fineStatus: FineStatus | null;
  fineAmountPaise: string | number | null;
  reportedBy: string;
  reportedByName: string;
  reportedAt: string;
}

export async function listLostDamagedReports(
  filter: { type?: string; status?: string; search?: string; page?: number; limit?: number } = {},
): Promise<ApiEnvelope<LibraryLostDamagedReport[]>> {
  const res = await apiFetch(`/library/lost-damaged?${qs(filter)}`);
  return parseOrThrow(res);
}

export async function getLostDamagedReport(id: string): Promise<LibraryLostDamagedReport> {
  const res = await apiFetch(`/library/lost-damaged/${id}`);
  return (await parseOrThrow<ApiEnvelope<LibraryLostDamagedReport>>(res)).data;
}

// ---------- Reports ----------
// Read-only aggregation. Inventory/Circulation/Overdue/Reservation/Lost &
// Damaged/Member Activity/Fine reports all call the SAME endpoints their own
// modules already expose (listIssues, listReservations, listLostDamagedReports,
// listMembers, listFines, getLibraryOverview above) -- only Transaction History
// is a genuinely new query, so it's the only new function here.

export interface LibraryTransactionHistoryEntry {
  id: string;
  action: string;
  objectType: string;
  objectId: string;
  outcome: string;
  actorName: string | null;
  detail: string | null;
  occurredAt: string;
}

export async function listTransactionHistory(
  filter: { startDate?: string; endDate?: string; page?: number; limit?: number } = {},
): Promise<ApiEnvelope<LibraryTransactionHistoryEntry[]>> {
  const res = await apiFetch(`/library/reports/transaction-history?${qs(filter)}`);
  return parseOrThrow(res);
}
