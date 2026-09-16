import Link from "next/link";

// Plain navigational tabs (status is a real query param, not client state) --
// styled to match the design's pill-toggle group exactly. No "use client"
// needed since these are just links, not form controls.
export function EbooksTabs({ status, search, subject }: { status: string; search?: string; subject?: string }) {
  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "WITHDRAWN", label: "Withdrawn" },
  ];

  function href(key: string) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (subject && subject !== "all") params.set("subject", subject);
    if (key !== "all") params.set("status", key);
    const qs = params.toString();
    return `/library/ebooks${qs ? `?${qs}` : ""}`;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, borderRadius: 11, background: "var(--lib-panel)" }}>
      {tabs.map((t) => {
        const active = status === t.key;
        return (
          <Link
            key={t.key}
            href={href(t.key)}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              font: "500 15px/1.2 var(--lib-font-sans)",
              background: active ? "var(--lib-white)" : "transparent",
              color: active ? "var(--lib-ink)" : "var(--lib-body-muted)",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
