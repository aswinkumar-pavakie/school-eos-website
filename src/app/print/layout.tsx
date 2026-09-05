// Print-only pages (ID cards) -- same auth guard as the dashboard layout, but
// deliberately without the Shell (sidebar/topbar): those are chrome the browser
// print dialog would otherwise render onto the page.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ACCESS_TOKEN_COOKIE } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

export default async function PrintLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  return <div className="min-h-screen bg-bg">{children}</div>;
}
