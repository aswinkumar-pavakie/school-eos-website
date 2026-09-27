// Shared next/font loaders for the SIS-mockup design reframe (Outfit for UI
// text, JetBrains Mono for every data value) -- one shared module so
// Principal/Admin/Vice Principal's own layout.tsx files don't each call
// next/font/google separately for the identical fonts. next/font/google font
// loaders are safe to call once at module scope and share across importers.

import { Outfit, JetBrains_Mono } from "next/font/google";

export const reframeSans = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-reframe-sans",
});

export const reframeMono = JetBrains_Mono({
  subsets: ["latin"],
  // 800 included -- KPI values render font-extrabold; without this weight
  // actually loaded, the browser fakes/skips the bold and numbers look thin.
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-reframe-mono",
});

// Transport Manager now shares the same canonical Outfit + JetBrains Mono
// pair as every other role (brain/SIS Principal/Design Architecture.dc.html)
// -- kept as its own export/variable name only so TransportReframeTheme.tsx
// and its callers don't need to change, not because the font actually
// differs from reframeSans any more.
export const transportReframeSans = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-transport-reframe-sans",
});
