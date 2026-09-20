// Same-origin proxy for the AI assistant bot (school-eos-ai-bot, a separate
// service reachable at AI_BOT_BASE_URL). The browser can't call the bot
// directly: the bot's own contract wants the real access token in the JSON
// body, and that token lives in an httpOnly cookie invisible to browser JS.
// This route reads the CURRENT valid access token server-side (refreshing
// it if needed, via the same getValidAccessToken() every other
// authenticated call in this app uses -- no separate login/auth flow for
// this feature) and forwards it to the bot on the caller's behalf.
//
// AI_BOT_BASE_URL is deliberately NOT NEXT_PUBLIC_-prefixed -- it must stay
// server-only, exactly like MESSAGING_API_BASE_URL, or it would leak to the
// browser and defeat the point of proxying through this route at all.

import { NextRequest, NextResponse } from "next/server";
import { AuthExpiredError, getValidAccessToken } from "@/lib/api";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

export async function POST(request: NextRequest) {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof AuthExpiredError) {
      return NextResponse.json({ message: "Session expired." }, { status: 401 });
    }
    throw err;
  }

  const botBaseUrl = process.env.AI_BOT_BASE_URL;
  if (!botBaseUrl) {
    return NextResponse.json({ message: "Assistant is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { question?: string; conversationId?: string | null };
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ message: "A question is required." }, { status: 400 });
  }

  let botRes: Response;
  try {
    botRes = await fetchWithRetry(`${botBaseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, question, conversationId: body.conversationId ?? null }),
    });
  } catch {
    return NextResponse.json({ message: "Could not reach the assistant. Please try again shortly." }, { status: 502 });
  }

  const responseBody = await botRes.text();
  const headers = new Headers({ "Content-Type": botRes.headers.get("Content-Type") ?? "application/json" });
  const retryAfter = botRes.headers.get("Retry-After");
  if (retryAfter) headers.set("Retry-After", retryAfter);

  return new NextResponse(responseBody, { status: botRes.status, headers });
}
