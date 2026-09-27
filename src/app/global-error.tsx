"use client";

// Next.js's own last-resort boundary: only engages if the ROOT LAYOUT itself
// throws (something error.tsx can't catch, since error.tsx renders inside
// the layout). Must render its own <html>/<body> -- the layout that would
// normally provide them is exactly what's failed. Kept deliberately minimal
// and dependency-free (no font/theme setup) since we can't assume anything
// above this boundary rendered successfully; inline styles only, so this
// still shows something safe and readable even if globals.css itself is
// somehow implicated.

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 560,
              textAlign: "center",
              border: "1px solid #e4e9f2",
              borderRadius: 16,
              padding: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 800, color: "#10243f", margin: 0 }}>
              Something went wrong
            </p>
            <p style={{ fontSize: 14, color: "#5c6b82", margin: 0 }}>
              Nothing was changed. Please try again in a moment. If it keeps happening, contact your school office.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                borderRadius: 11,
                background: "#1f6feb",
                color: "#fff",
                border: "none",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
