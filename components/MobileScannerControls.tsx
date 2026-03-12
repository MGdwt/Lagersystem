"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Phase } from "@/lib/scanner-types";

interface MobileScannerControlsProps {
  phase: Phase;
  barcode: string;
  delta: number;
  cameraOn: boolean;
  canCancel: boolean;
  canEditQty: boolean;
  canBook: boolean;
  onToggleCamera: () => void;
  onCancel: () => void;
  onBarcodeChange: (barcode: string) => void;
  onDeltaChange: (delta: number) => void;
  onFinalizeScan: (raw: string) => void;
  onBook: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function MobileScannerControls({
  phase,
  barcode,
  delta,
  cameraOn,
  canCancel,
  canEditQty,
  canBook,
  onToggleCamera,
  onCancel,
  onBarcodeChange,
  onDeltaChange,
  onFinalizeScan,
  onBook,
  videoRef,
}: MobileScannerControlsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={onToggleCamera} className="w-full">
          {cameraOn ? "Kamera stoppen" : "Kamera scannen"}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={!canCancel}
          className="w-full"
        >
          Abbrechen
        </Button>
      </div>

      {cameraOn && (
        <video
          ref={videoRef}
          className="w-full rounded-xl border border-black/10 bg-white"
        />
      )}

      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Oder Code eintippen</div>
        <Input
          value={barcode}
          onChange={(e) => {
            onBarcodeChange(e.target.value);
            if (phase === "ready") {
              // This would need to be handled by parent
            }
          }}
          placeholder="Barcode / IPN"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onFinalizeScan(barcode);
            }
          }}
        />
      </div>

      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">
          Menge (positiv / negativ)
        </div>
        <Input
          type="number"
          value={delta}
          onChange={(e) => onDeltaChange(parseInt(e.target.value || "0", 10))}
          placeholder="+ / - Menge"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onBook();
            }
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-14 text-2xl"
          onClick={() => onDeltaChange(delta + 1)}
        >
          +
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-14 text-2xl"
          onClick={() => onDeltaChange(delta - 1)}
        >
          −
        </Button>
      </div>

      <Button onClick={onBook} disabled={!canBook} className="w-full">
        Buchen
      </Button>
    </>
  );
}
