// Back face of the ID card -- same fixed CR80 portrait size as the front
// (IdCardTemplate), so the two print as a matched pair. Shows the holder's real
// home address (person.address_line1/2/city/state/pincode) -- nothing here is
// derived or guessed; a missing address just renders as "Not on file".

export interface IdCardAddress {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

function hasAddress(address: IdCardAddress): boolean {
  return Boolean(address.addressLine1 || address.addressLine2 || address.city || address.state || address.pincode);
}

export function IdCardBackTemplate({
  schoolName,
  schoolAddress,
  address,
}: {
  schoolName: string;
  schoolAddress: string;
  address: IdCardAddress;
}) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[10px] border border-border bg-surface"
      style={{ width: "2.125in", height: "3.375in", breakInside: "avoid" }}
    >
      <div className="bg-primary px-2 py-2 text-center text-white">
        <p className="text-[9px] font-extrabold uppercase leading-[11px] tracking-[0.03em]">{schoolName}</p>
        <p className="mt-0.5 text-[6.5px] leading-[8px] opacity-90">{schoolAddress}</p>
      </div>

      <div className="flex flex-1 flex-col px-3 pt-3">
        <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-text-muted">Home address</p>
        {hasAddress(address) ? (
          <div className="mt-1.5 text-[10px] leading-[14px] text-text">
            {address.addressLine1 && <p>{address.addressLine1}</p>}
            {address.addressLine2 && <p>{address.addressLine2}</p>}
            <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
            {address.pincode && <p>{address.pincode}</p>}
          </div>
        ) : (
          <p className="mt-1.5 text-[10px] text-text-muted">Not on file</p>
        )}
      </div>

      <div className="bg-field px-2 py-1.5 text-center">
        <p className="text-[6.5px] leading-[8px] text-text-muted">
          If found, please return this card to the school office.
        </p>
      </div>
    </div>
  );
}
