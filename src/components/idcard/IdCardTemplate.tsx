// One physical ID card face -- portrait CR80 (2.125in x 3.375in), the standard
// lanyard-card size. Used both for a single card (profile "Print ID card") and
// tiled in a grid for a whole filtered group, so this stays a pure, self-sized
// component with no page-level assumptions.

import { resolvePhotoUrl } from "@/lib/resolve-photo-url";

export interface IdCardData {
  photoUrl: string | null;
  name: string;
  idLabel: string; // "Admission no." or "Employee no."
  idValue: string;
  lineLabel: string; // "Standard 7 · A" or "Post Graduate Teacher - English"
  bloodGroup?: string | null;
  validity: string; // "2025-2026" or similar
}

export function IdCardTemplate({
  schoolName,
  schoolAddress,
  card,
}: {
  schoolName: string;
  schoolAddress: string;
  card: IdCardData;
}) {
  const photoSrc = resolvePhotoUrl(card.photoUrl);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface"
      style={{ width: "2.125in", height: "3.375in", breakInside: "avoid" }}
    >
      <div className="bg-primary px-2 py-2 text-center text-white">
        <p className="text-[9px] font-extrabold uppercase leading-[11px] tracking-[0.03em]">{schoolName}</p>
        <p className="mt-0.5 text-[6.5px] leading-[8px] opacity-90">{schoolAddress}</p>
      </div>

      <div className="flex flex-1 flex-col items-center px-2.5 pt-2.5">
        <div className="h-[1.1in] w-[1.1in] shrink-0 overflow-hidden rounded-[8px] border border-border bg-field">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- print page, no next/image optimization needed
            <img src={photoSrc} alt={card.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[9px] text-text-muted">No photo</div>
          )}
        </div>

        <p className="mt-2 text-center text-[11px] font-extrabold leading-[13px] text-text">{card.name}</p>
        <p className="mt-0.5 text-center text-[9px] leading-[11px] text-text-muted">{card.lineLabel}</p>

        <div className="mt-2 w-full border-t border-border pt-1.5 text-center">
          <p className="text-[7px] font-bold uppercase tracking-[0.06em] text-text-muted">{card.idLabel}</p>
          <p className="font-mono text-[10px] font-bold text-text">{card.idValue}</p>
        </div>

        {card.bloodGroup && (
          <div className="mt-1 text-center">
            <p className="text-[7px] font-bold uppercase tracking-[0.06em] text-text-muted">Blood group</p>
            <p className="text-[10px] font-bold text-critical-text">{card.bloodGroup}</p>
          </div>
        )}
      </div>

      <div className="bg-field px-2 py-1.5 text-center">
        <p className="text-[6.5px] leading-[8px] text-text-muted">
          Valid {card.validity} · Property of {schoolName}. If found, please return to the school office.
        </p>
      </div>
    </div>
  );
}
