// Authenticated proxy for Sports Admin's client-side "+ Add ___" panels'
// squad pickers -- same reasoning as /api/students-search: the access token
// lives in an httpOnly cookie a "use client" component can't reach directly,
// so this Route Handler (server context) does the real apiFetch call and the
// client components fetch this path with a plain browser fetch instead.

import { NextResponse } from "next/server";
import { listMyTeams } from "@/lib/sports-admin-api";

export async function GET() {
  try {
    const teams = await listMyTeams();
    return NextResponse.json({ data: teams });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
