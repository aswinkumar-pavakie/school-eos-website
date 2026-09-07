import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev-mode badge (bottom-left, build-activity indicator) never ships
  // to production — it's a local dev-only overlay, not part of the app's own UI —
  // but it's been read as part of the design, so it's turned off here too.
  devIndicators: false,
};

export default nextConfig;
