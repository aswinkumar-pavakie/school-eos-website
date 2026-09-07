// Home address fields -- lives on `person`, shared by Student and Faculty
// profiles alike (see PersonRepository). Fields only, no <form>/button of its
// own: both profiles fold this into one combined profile-save form with a
// single button, rather than a separate "Save address" button per section.

export interface AddressValues {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

export function AddressFields({ address, disabled }: { address: AddressValues; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Address line 1</span>
        <input
          name="addressLine1"
          defaultValue={address.addressLine1 ?? ""}
          disabled={disabled}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Address line 2</span>
        <input
          name="addressLine2"
          defaultValue={address.addressLine2 ?? ""}
          disabled={disabled}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">City</span>
          <input
            name="city"
            defaultValue={address.city ?? ""}
            disabled={disabled}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">State</span>
          <input
            name="state"
            defaultValue={address.state ?? ""}
            disabled={disabled}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Pincode</span>
          <input
            name="pincode"
            defaultValue={address.pincode ?? ""}
            disabled={disabled}
            placeholder="6 digits"
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          />
        </label>
      </div>
    </div>
  );
}
