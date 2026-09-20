// Nav icon path data ported verbatim from the design's own inline SVGs
// (brain/SIS Mediaroom/Media Room.dc.html) -- same viewBox="0 0 18 18"/
// stroke-width 1.7 convention as every other icon in that file.
import type { CSSProperties } from "react";

export function DashboardIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" style={style}>
      <rect x="2" y="2" width="6" height="6" rx="1.5" />
      <rect x="10" y="2" width="6" height="6" rx="1.5" />
      <rect x="2" y="10" width="6" height="6" rx="1.5" />
      <rect x="10" y="10" width="6" height="6" rx="1.5" />
    </svg>
  );
}
export function CalendarIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" style={style}>
      <rect x="2" y="3.5" width="14" height="12.5" rx="2" />
      <line x1="2" y1="7.5" x2="16" y2="7.5" />
      <line x1="6" y1="1.6" x2="6" y2="4.4" strokeLinecap="round" />
      <line x1="12" y1="1.6" x2="12" y2="4.4" strokeLinecap="round" />
    </svg>
  );
}
export function AnalyticsIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" style={style}>
      <polyline points="2,13 6.5,8 10,11 16,4" />
      <polyline points="12,4 16,4 16,8" />
    </svg>
  );
}
export function SocialIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" style={style}>
      <circle cx="13.5" cy="4" r="2.3" />
      <circle cx="4.5" cy="9" r="2.3" />
      <circle cx="13.5" cy="14" r="2.3" />
      <line x1="6.6" y1="7.9" x2="11.4" y2="5.1" />
      <line x1="6.6" y1="10.1" x2="11.4" y2="12.9" />
    </svg>
  );
}
export function ShootsIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" style={style}>
      <rect x="1.8" y="5" width="10" height="8" rx="2" />
      <path d="M11.8 8.6 16.2 6v6l-4.4-2.6z" strokeLinejoin="round" />
    </svg>
  );
}
export function InventoryIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" style={style}>
      <path d="M9 1.8 16 5.4v7.2L9 16.2 2 12.6V5.4z" />
      <path d="M2 5.4 9 9l7-3.6" />
      <line x1="9" y1="9" x2="9" y2="16.2" />
    </svg>
  );
}
export function IndentIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" style={style}>
      <rect x="3" y="2" width="12" height="14" rx="2" />
      <line x1="6" y1="6" x2="12" y2="6" />
      <line x1="6" y1="9.4" x2="12" y2="9.4" />
      <line x1="6" y1="12.8" x2="9.6" y2="12.8" />
    </svg>
  );
}
export function TeamIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" style={style}>
      <circle cx="7" cy="6" r="2.8" />
      <path d="M2.2 15c0-2.7 2.2-4.6 4.8-4.6S11.8 12.3 11.8 15" strokeLinecap="round" />
      <path d="M12.4 10.6c1.9.3 3.4 1.9 3.4 4.4" strokeLinecap="round" />
      <circle cx="13.2" cy="6.4" r="2.2" />
    </svg>
  );
}
// New feature (AI assistant chat), no design source -- same 18x18/1.7-stroke
// convention as every icon above.
export function AssistantIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" style={style}>
      <path d="M3 4h12v8.5H7l-3 2.5v-2.5H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 7.5h6M6 9.8h3.5" strokeLinecap="round" />
    </svg>
  );
}
export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8b95a5" strokeWidth="1.8">
      <circle cx="7" cy="7" r="5" />
      <line x1="11" y1="11" x2="15" y2="15" strokeLinecap="round" />
    </svg>
  );
}
export function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="#0b1b3a" strokeWidth="1.7">
      <path d="M4 7a5 5 0 0 1 10 0c0 3 1 4 1 4H3s1-1 1-4z" strokeLinejoin="round" />
      <path d="M7.4 14.5a1.8 1.8 0 0 0 3.2 0" strokeLinecap="round" />
    </svg>
  );
}

export const KIND_COLOR: Record<string, string> = { POSTER: "#1d4ed8", VIDEO: "#7c3aed", COVERAGE: "#15803d" };
export const KIND_ICON: Record<string, string> = { POSTER: "\u{1F5BC}", VIDEO: "\u{1F3A5}", COVERAGE: "\u{1F4F7}" };
export const PLATFORM_COLOR: Record<string, string> = { Instagram: "#d62976", LinkedIn: "#0a66c2", YouTube: "#dc2626" };
