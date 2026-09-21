"use client";

// Pixel-matched to the user's own reference (Cloudflare's "Ask AI" empty
// panel): a tight, evenly-arranged dotted grid using this app's own real
// brand color (--color-primary) instead of the reference's orange.
//
// Rebuilt as a real per-dot canvas simulation, replacing an earlier
// CSS-mask version that only revealed a second, already-brighter dot
// layer under the cursor -- explicit repeated feedback was that the dots
// themselves must physically move away from the cursor as it approaches,
// not just relight in place. Every dot here is tracked individually: at
// rest all dots sit dull and unmoved (DULL_ALPHA, zero displacement); any
// dot within INFLUENCE_RADIUS of the cursor is pushed away from it (a real
// position offset, stronger the closer the cursor is) and brightened in
// the same proportion, eased toward its target every frame (EASE) so dots
// visibly glide into their moved, lit-up position and glide back out
// again, rather than snapping. Deliberately just those two things -- move
// + brighten, nothing else: an earlier pass also grew the dot's radius and
// drew a soft blurred halo behind it, which read as "too much"/messy per
// explicit follow-up feedback; the radius is now fixed (RADIUS) and there
// is no halo, for a plainer, more restrained/elite feel.
//
// The actual bug behind "hovering does nothing" wasn't this simulation --
// it was that this component's own root div sits BEHIND the chat's real
// content layer (AiChatScreen renders the empty state / message list in a
// sibling div with z-10 on top of this one), and that content layer's box
// covers the entire chat area even where nothing is visibly drawn in it
// (an empty flex box still occupies its full layout box for hit-testing).
// A `onMouseMove` handler on THIS div therefore never fired at all -- every
// mousemove over the chat area was being captured by the layer on top of
// it first. Fixed by listening on `document` instead: a document-level
// listener receives every mousemove regardless of which element is
// topmost at that point (nothing above it calls stopPropagation), so this
// now tracks the cursor correctly across the whole chat area, including
// over message bubbles and the empty-state text.

import { useEffect, useRef } from "react";

const GRID = 14; // px spacing between dot centers
const RADIUS = 1.3; // fixed -- dots never grow, per explicit feedback that enlarging them read as "too much"
const INFLUENCE_RADIUS = 85; // px -- how far from the cursor a dot starts reacting
const MAX_DISPLACEMENT = 8; // px -- how far a dot moves away from the cursor at peak proximity
const EASE = 0.16; // per-frame smoothing toward the target (0..1, higher = snappier)
const DULL_ALPHA = 0.22;
const LIT_ALPHA = 1;
const FALLBACK_RGB: [number, number, number] = [43, 111, 224]; // --color-primary's own value, used only if the CSS var can't be read

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace("#", "");
  if (clean.length !== 3 && clean.length !== 6) return null;
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface Dot {
  x: number;
  y: number;
  dispX: number;
  dispY: number;
  targetDispX: number;
  targetDispY: number;
  glow: number;
  targetGlow: number;
}

export function DotGridBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const colorRef = useRef<[number, number, number]>(FALLBACK_RGB);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cssColor = getComputedStyle(document.documentElement).getPropertyValue("--color-primary");
    const parsed = hexToRgb(cssColor);
    if (parsed) colorRef.current = parsed;

    function buildGrid() {
      const rect = container!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = Math.max(1, Math.round(rect.width * dpr));
      canvas!.height = Math.max(1, Math.round(rect.height * dpr));
      canvas!.style.width = `${rect.width}px`;
      canvas!.style.height = `${rect.height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dots: Dot[] = [];
      for (let y = GRID / 2; y < rect.height; y += GRID) {
        for (let x = GRID / 2; x < rect.width; x += GRID) {
          dots.push({ x, y, dispX: 0, dispY: 0, targetDispX: 0, targetDispY: 0, glow: 0, targetGlow: 0 });
        }
      }
      dotsRef.current = dots;
    }

    buildGrid();
    const resizeObserver = new ResizeObserver(buildGrid);
    resizeObserver.observe(container);

    function onDocumentMouseMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouseRef.current = null;
      } else {
        mouseRef.current = { x, y };
      }
    }
    function onDocumentMouseLeave() {
      mouseRef.current = null;
    }
    document.addEventListener("mousemove", onDocumentMouseMove);
    document.addEventListener("mouseleave", onDocumentMouseLeave);

    let rafId = 0;
    function frame() {
      const dots = dotsRef.current;
      const mouse = mouseRef.current;
      const [r, g, b] = colorRef.current;
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const dot of dots) {
        if (mouse) {
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < INFLUENCE_RADIUS) {
            const proximity = 1 - dist / INFLUENCE_RADIUS;
            const nx = dist < 0.001 ? 0 : dx / dist;
            const ny = dist < 0.001 ? 0 : dy / dist;
            dot.targetDispX = nx * proximity * MAX_DISPLACEMENT;
            dot.targetDispY = ny * proximity * MAX_DISPLACEMENT;
            dot.targetGlow = proximity;
          } else {
            dot.targetDispX = 0;
            dot.targetDispY = 0;
            dot.targetGlow = 0;
          }
        } else {
          dot.targetDispX = 0;
          dot.targetDispY = 0;
          dot.targetGlow = 0;
        }

        dot.dispX += (dot.targetDispX - dot.dispX) * EASE;
        dot.dispY += (dot.targetDispY - dot.dispY) * EASE;
        dot.glow += (dot.targetGlow - dot.glow) * EASE;

        const alpha = DULL_ALPHA + (LIT_ALPHA - DULL_ALPHA) * dot.glow;
        const px = dot.x + dot.dispX;
        const py = dot.y + dot.dispY;

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx!.arc(px, py, RADIUS, 0, Math.PI * 2);
        ctx!.fill();
      }

      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      document.removeEventListener("mousemove", onDocumentMouseMove);
      document.removeEventListener("mouseleave", onDocumentMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
