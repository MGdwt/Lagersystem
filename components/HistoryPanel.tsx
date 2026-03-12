"use client";

import { Button } from "@/components/ui/button";
import { type HistoryItem } from "@/lib/scanner-types";

interface HistoryPanelProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

export function HistoryPanel({ history, onClearHistory }: HistoryPanelProps) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Verlauf</div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearHistory}
          disabled={history.length === 0}
        >
          Leeren
        </Button>
      </div>

      {history.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          Noch keine Buchungen in dieser Sitzung.
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((h) => (
            <div
              key={h.ts}
              className="rounded-xl border border-black/10 bg-[#fafafa] p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{h.partName}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(h.ts).toLocaleTimeString()}
                </div>
              </div>
              <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                {`IPN: ${h.barcode}\nNeue Ware / Ausgegeben: ${h.delta}\nBestand: ${h.from} → ${h.to}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
