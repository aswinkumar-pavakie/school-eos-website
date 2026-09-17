"use client";

// Sports Admin's own signature capture -- same canvas -> real PNG base64
// logic as sports-faculty/SignaturePad.tsx (what IssueEquipmentDto's
// signaturePngBase64 expects, magic-bytes checked server-side), restyled
// with sports-ui's own CSS-variable tokens instead of the generic Tailwind
// classes that component uses, per this module's own per-role isolation
// convention (its own theme file, icons, primitives, shell).

import { useRef, useState } from "react";
import { FieldLabel } from "./primitives";

export function SignaturePad({ name, disabled }: { name: string; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [hasDrawn, setHasDrawn] = useState(false);

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    drawingRef.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pointFromEvent(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#10233B";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function end() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const url = canvasRef.current!.toDataURL("image/png");
    setDataUrl(url.replace(/^data:image\/png;base64,/, ""));
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setDataUrl("");
    setHasDrawn(false);
  }

  return (
    <div>
      <FieldLabel>Recipient&apos;s signature *</FieldLabel>
      <canvas
        ref={canvasRef}
        width={400}
        height={130}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        style={{ width: "100%", height: 130, marginTop: 8, touchAction: "none", borderRadius: 10, border: "1px solid var(--sport-input-border)", background: "#fff" }}
      />
      <input type="hidden" name={name} value={dataUrl} required />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span style={{ fontSize: 12, color: "var(--sport-tertiary)" }}>Have the recipient sign above.</span>
        <button type="button" onClick={clear} disabled={!hasDrawn || disabled} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12, fontWeight: 700, fontFamily: "inherit", opacity: !hasDrawn || disabled ? 0.5 : 1 }}>
          Clear
        </button>
      </div>
    </div>
  );
}
