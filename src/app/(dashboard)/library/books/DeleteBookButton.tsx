"use client";

// Ports the design's own icon-button "Delete book" + ask() confirm exactly.
// withdrawBookAction is real -- there is no hard delete in the real schema
// (a book with copies/history can't just vanish), so this maps to the same
// real "withdraw" action the pre-rebuild page already used, worded to match
// what actually happens.

import { ConfirmAction } from "@/components/library-ui/ConfirmModal";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import { withdrawBookAction } from "./actions";

export function DeleteBookButton({ bookId, title }: { bookId: string; title: string }) {
  const toast = useLibraryToast();
  return (
    <ConfirmAction
      title="Withdraw book"
      body={`Withdraw "${title}" from the catalogue? Its copies and borrowing history are kept, but it can no longer be issued.`}
      cta="Withdraw"
      danger
      onConfirm={async () => {
        await withdrawBookAction(bookId);
        toast.show(`${title} withdrawn`);
      }}
      trigger={(open) => (
        <button
          type="button"
          onClick={open}
          title="Withdraw book"
          className="lib-danger-icon-hover"
          style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "1px solid var(--lib-border)", borderRadius: 9, background: "var(--lib-white)", color: "var(--lib-body-muted)", cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
            <path d="M5 6.5h10M8 6.5V4.8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6.5M6.5 6.5V16a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6.5" />
          </svg>
        </button>
      )}
    />
  );
}
