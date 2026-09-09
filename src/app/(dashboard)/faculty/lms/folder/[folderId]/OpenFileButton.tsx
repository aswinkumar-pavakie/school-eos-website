"use client";

import { useState } from "react";
import { PlainButton } from "@/components/ui/Button";
import { getFileUrlAction } from "../../actions";

// A signed URL is only ever fetched on demand, right before opening it -- the
// 10-minute TTL means a stale link sitting in the page would already be
// pointless to prefetch.
export function OpenFileButton({ fileId, fileName }: { fileId: string; fileName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setLoading(true);
    try {
      const url = await getFileUrlAction(fileId);
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PlainButton type="button" variant="secondary" onClick={handleOpen} disabled={loading}>
      {loading ? "Opening…" : `Open ${fileName}`}
    </PlainButton>
  );
}
