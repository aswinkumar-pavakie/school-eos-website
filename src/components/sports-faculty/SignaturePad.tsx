"use client";

// Canvas signature capture -> real PNG base64, matching what
// IssueEquipmentDto.signaturePngBase64 expects server-side (magic-bytes
// checked, not just "non-empty string"). Mouse + touch, no external library.

import { useRef, useState } from "react";

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
    ctx.strokeStyle = "#101828";
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
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold tracking-wide text-text-muted uppercase">
        Student&apos;s signature <span className="text-critical-text">*</span>
      </span>
      <canvas
        ref={canvasRef}
        width={400}
        height={140}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="w-full touch-none rounded-[var(--radius-input)] border border-border bg-white"
      />
      <input type="hidden" name={name} value={dataUrl} required />
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">Have the student sign above.</p>
        <button type="button" onClick={clear} disabled={!hasDrawn || disabled} className="text-xs font-bold text-primary hover:underline disabled:opacity-50">
          Clear
        </button>
      </div>
    </div>
  );
}
