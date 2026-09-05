// Pure constants/types shared between server code (finance-api.ts) and Client
// Components. Deliberately has ZERO imports of its own — anything in here is safe to
// import from a "use client" file, unlike finance-api.ts (which pulls in apiFetch's
// next/headers dependency transitively, even for a Client Component that only wants a
// constant, and Next.js's bundler correctly refuses to build that).

export type PaymentMode = "UPI" | "CARD" | "NETBANKING" | "CASH" | "CHEQUE" | "DD" | "WALLET_TOPUP";
export const OFFLINE_PAYMENT_MODES: PaymentMode[] = ["CASH", "CHEQUE", "DD"];
export const ONLINE_PAYMENT_MODES: PaymentMode[] = ["UPI", "CARD", "NETBANKING", "WALLET_TOPUP"];

export const CONCESSION_TYPES = ["SIBLING", "STAFF_WARD", "SCHOLARSHIP", "RTE", "MERIT", "HARDSHIP", "GOVT_SCHEME", "OTHER"] as const;
export type ConcessionType = (typeof CONCESSION_TYPES)[number];

// Real DB CHECK constraint (fee_head_head_type_check).
export const FEE_HEAD_TYPES = ["TUITION", "SPECIAL", "TRANSPORT", "HOSTEL", "EXAM", "LAB", "LIBRARY", "ID_CARD", "OTHER"] as const;
export type FeeHeadType = (typeof FEE_HEAD_TYPES)[number];
