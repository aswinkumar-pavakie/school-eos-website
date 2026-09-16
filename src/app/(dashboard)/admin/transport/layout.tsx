import type { ReactNode } from "react";

// Admin's Transport pages render in Admin's own visual system (its own
// KpiCard/Shell/theme, not Transport Manager's blue-accented reframe) -- this
// layout only adds the Material Symbols Outlined icon font, scoped to this
// route only (the same real icon set Transport Manager's own pages use for
// Edit/Delete/bus glyphs, so Admin's rebuilt Transport UI can use the same
// <MaterialIcon> component without importing TransportReframeTheme's own
// full-page theme override). See TransportReframeTheme.tsx's own identical
// .material-symbols-outlined rule -- copied here scoped under
// .admin-transport-icons instead of a reframe scope class, since Admin's
// shell/theme is otherwise untouched.
const SCOPE = "admin-transport-icons";

export default function AdminTransportLayout({ children }: { children: ReactNode }) {
  return (
    <div className={SCOPE}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,200..500,0,-25..0"
      />
      <style>{`
        .${SCOPE} .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          user-select: none;
        }
      `}</style>
      {children}
    </div>
  );
}
