"use client";

import React from "react";
import { adjustStockAction } from "@/app/actions/adjust";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/LogoutButton";
import { OperatorSelector } from "@/components/OperatorSelector";
import { DesktopScannerControls } from "@/components/DesktopScannerControls";
import { MobileScannerControls } from "@/components/MobileScannerControls";
import { StatusDisplay } from "@/components/StatusDisplay";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useScanner } from "@/lib/useScanner";

export default function ScannerClient() {
  const scanner = useScanner();

  async function book() {
    if (scanner.phase !== "ready") return;
    if (!scanner.operator.trim()) {
      scanner.resetAll({
        title: "Fehlt",
        body: "Bitte deinen Namen auswählen.",
      });
      return;
    }

    scanner.resetAll({ title: "Buche…", body: "Bitte warten." });
    await new Promise((r) => setTimeout(r, 100));

    const cleaned = scanner.barcode;
    if (!cleaned) {
      scanner.resetAll({ title: "Fehlt", body: "Kein gültiger Code." });
      return;
    }
    if (!Number.isInteger(scanner.delta) || scanner.delta === 0) {
      scanner.resetAll({
        title: "Fehlt",
        body: "Bitte eine Menge eingeben (nicht 0).",
      });
      return;
    }

    try {
      const result = await adjustStockAction({
        barcode: cleaned,
        delta: scanner.delta,
        operator: scanner.operator,
      });

      if (result?.validationErrors) {
        toast.error("Ungültige Eingabe", {
          description: "Bitte Barcode und Menge prüfen.",
        });
        scanner.resetAll({ title: "Fehler", body: "Ungültige Eingabe." });
        return;
      }

      if (result?.serverError) {
        toast.error("Fehler beim Buchen", {
          description: String(result.serverError),
        });
        scanner.resetAll({ title: "Fehler", body: String(result.serverError) });
        return;
      }

      if (!result?.data) {
        scanner.resetAll({
          title: "Fehler",
          body: "Unbekannter Fehler (keine Daten).",
        });
        return;
      }

      const data = result.data;
      toast.success("Gebucht", {
        description: `${data.partName}: ${data.currentQty} → ${data.newQty}`,
      });

      scanner.setHistory((prev) =>
        [
          {
            ts: Date.now(),
            partName: data.partName,
            barcode: data.barcode ?? cleaned,
            delta: scanner.delta,
            from: data.currentQty,
            to: data.newQty,
          },
          ...prev,
        ].slice(0, 20),
      );

      scanner.resetAll({
        title: "Gebucht ✅",
        body: `Part: ${data.partName}\nBestand: ${data.currentQty} → ${data.newQty}`,
      });
      scanner.setBarcode("");
      scanner.setDelta(0);
    } catch (e: any) {
      toast.error("Unerwarteter Fehler", {
        description: e?.message ?? "Unbekannt",
      });
      scanner.resetAll({ title: "Fehler", body: e?.message ?? "Unbekannt" });
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] p-4">
      <div className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-[280px_1fr]">
        {/* Controls */}
        <Card className="h-fit border-black/10 bg-[#fafafa] sm:sticky sm:top-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base tracking-tight">
                IT-Support Lager
              </CardTitle>

              <div className="flex items-center gap-2">
                <LogoutButton />
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-primary"
                >
                  {scanner.mode === "mobile" ? "Mobile" : "Desktop"} ·{" "}
                  {scanner.phase}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <OperatorSelector
              operator={scanner.operator}
              onOperatorChange={scanner.setOperator}
            />

            {scanner.mode === "desktop" && (
              <DesktopScannerControls
                phase={scanner.phase}
                barcode={scanner.barcode}
                delta={scanner.delta}
                canStartScan={scanner.canStartScan}
                canCancel={scanner.canCancel}
                canEditQty={scanner.canEditQty}
                canBook={scanner.canBook}
                isBooking={scanner.isBooking}
                onStartScan={scanner.startScan}
                onCancel={() => scanner.resetAll()}
                onBarcodeChange={scanner.setBarcode}
                onDeltaChange={scanner.setDelta}
                onFinalizeScan={scanner.finalizeScan}
                onBook={book}
                onHiddenKeyDown={scanner.onHiddenKeyDown}
                hiddenInputRef={scanner.hiddenInputRef}
              />
            )}

            {scanner.mode === "mobile" && (
              <MobileScannerControls
                phase={scanner.phase}
                barcode={scanner.barcode}
                delta={scanner.delta}
                cameraOn={scanner.cameraOn}
                canCancel={scanner.canCancel}
                canEditQty={scanner.canEditQty}
                canBook={scanner.canBook}
                onToggleCamera={() => scanner.setCameraOn((v) => !v)}
                onCancel={() => scanner.resetAll()}
                onBarcodeChange={scanner.setBarcode}
                onDeltaChange={scanner.setDelta}
                onFinalizeScan={scanner.finalizeScan}
                onBook={book}
                videoRef={scanner.videoRef}
              />
            )}
          </CardContent>
        </Card>

        {/* Status and History */}
        <div className="space-y-4">
          <StatusDisplay
            infoTitle={scanner.infoTitle}
            infoBody={scanner.infoBody}
          />

          <Card className="border-black/10">
            <CardContent className="pt-6">
              <HistoryPanel
                history={scanner.history}
                onClearHistory={() => scanner.setHistory([])}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
