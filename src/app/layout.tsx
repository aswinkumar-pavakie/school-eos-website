import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "School EOS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="font-sans bg-bg text-text">{children}</body>
    </html>
  );
}
