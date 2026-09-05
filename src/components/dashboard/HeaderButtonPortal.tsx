"use client";

// Renders its children into a named slot elsewhere in the DOM (see
// HeaderButtonSlot below) -- for a form's own Save button to appear up in the
// profile header (under the header's own action buttons, above the stats
// row) while the <form> and its useActionState/pending state stay right next
// to the fields it's saving, further down the page. The slot element is
// server-rendered (empty) as part of ProfileHeader, so it already exists in
// the DOM by the time this mounts and looks for it.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function HeaderButtonSlot({ id }: { id: string }) {
  return <div id={id} className="flex items-center gap-3" />;
}

export function HeaderButtonPortal({ slotId, children }: { slotId: string; children: React.ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(slotId));
  }, [slotId]);

  if (!slot) return null;
  return createPortal(children, slot);
}
