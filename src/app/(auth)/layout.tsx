import { Inter } from "next/font/google";
import type { ReactNode } from "react";

// The approved design (School EOS Login Redesign .dc.html) specifies Inter
// explicitly (its own <link> to Google Fonts, weights 400-800) -- the rest of
// this app loads Plus Jakarta Sans globally (see root layout.tsx), which the
// auth screens were silently inheriting instead. Scoped to just this route
// group via next/font (this app's established way of loading fonts, not a
// raw <link> tag) so the dashboard's own Plus Jakarta Sans is untouched.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className={inter.className}>{children}</div>;
}
