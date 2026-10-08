import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  initialValue?: string;
  onChange: (dataUrl: string | null) => void;
}

export default function SignaturePad({ onChange, initialValue }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(c).color;
    if (initialValue) {
      const image = new Image();
      image.onload = () => { ctx.drawImage(image, 0, 0, rect.width, rect.height); hasInk.current = true; };
      image.src = initialValue;
    }
  }, [initialValue]);

  const pos = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasInk.current = true;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasInk.current) onChange(canvasRef.current?.toDataURL("image/png") || null);
  };
  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    hasInk.current = false;
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        className="w-full h-40 rounded-lg border-2 border-dashed border-border bg-background text-foreground cursor-crosshair"
        style={{ touchAction: "none" }}
        aria-label="אזור חתימה"
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">חתמו כאן בעזרת העכבר או האצבע</span>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>נקה חתימה</Button>
      </div>
    </div>
  );
}
