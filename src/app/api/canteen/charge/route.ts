// Backs the canteen Ledger screen's "Move to ledger" action -- a thin
// same-origin proxy (see /api/canteen/search's own header comment for why
// this can't be called from the client directly) that passes the real
// backend's status/message straight through, so a real 400 (insufficient
// balance, frozen wallet) or 404 (no wallet) shows the real reason instead
// of a generic failure.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch, AuthExpiredError } from "@/lib/api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  try {
    const res = await apiFetch("/canteen/charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const responseBody = await res.text();
    return new NextResponse(responseBody, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    if (err instanceof AuthExpiredError) {
      return NextResponse.json({ message: "Session expired." }, { status: 401 });
    }
    return NextResponse.json({ message: "Could not reach the server." }, { status: 502 });
  }
}
