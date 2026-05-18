"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cleanBarcode, type Phase } from "@/lib/scanner-types";

interface DesktopScannerControlsProps {
  phase: Phase;
  barcode: string;
  delta: number;
  canStartScan: boolean;
  canCancel: boolean;
  canEditQty: boolean;
  canBook: boolean;
  isBooking: boolean;
  onStartScan: () => void;
  onCancel: () => void;
  onBarcodeChange: (barcode: string) => void;
  onDeltaChange: (delta: number) => void;
  onFinalizeScan: (raw: string) => void;
  onBook: () => void;
  onHiddenKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  hiddenInputRef: React.RefObject<HTMLInputElement | null>;
}

export function DesktopScannerControls({
  phase,
  barcode,
  delta,
  canStartScan,
  canCancel,
  canEditQty,
  canBook,
  isBooking,
  onStartScan,
  onCancel,
  onBarcodeChange,
  onDeltaChange,
  onFinalizeScan,
  onBook,
  onHiddenKeyDown,
  hiddenInputRef,
}: DesktopScannerControlsProps) {
  return (
    <>
      <input
        ref={hiddenInputRef}
        onKeyDown={onHiddenKeyDown}
        style={{
          opacity: 0,
          position: "absolute",
          pointerEvents: "none",
        }}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onStartScan}
          disabled={!canStartScan}
          className="w-full"
        >
          Scannen starten
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

      {/* ✅ NEU: Code eintippen wie Mobile */}
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
          disabled={!canEditQty}
        />
      </div>

      <Button onClick={onBook} disabled={!canBook} className="w-full">
        {isBooking ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buche…
          </span>
        ) : (
          "Buchen"
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        Tipp: Erst „Scannen starten“, dann scannen. Ergebnis bleibt stehen, bis
        du neu startest.
      </p>
    </>
  );
}
