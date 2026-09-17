import type { Metadata } from "next";
import { IBM_Plex_Mono, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

// Data font -- used only where figures are compared down a column (money, marks,
// counts) -- Design Architecture v0.1, --eos-num.
// Weight 400 added alongside the existing 500 for the Faculty portal rebuild
// (brain/SIS Class teacher/Class Teacher Portal.dc.html uses both weights) --
// purely additive, changes nothing for any page not opting into font-normal
// on mono text.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

// Media Room's own data font (brain/SIS Mediaroom/Media Room.dc.html uses
// JetBrains Mono, not IBM Plex Mono) -- purely additive, changes nothing for
// any page not opting into font-media-mono.
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "School EOS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} ${jetBrainsMono.variable}`}>
      <body className="font-sans bg-bg text-text">{children}</body>
    </html>
  );
}
