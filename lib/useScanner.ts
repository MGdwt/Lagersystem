"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { useQueryClient } from "@tanstack/react-query";
import {
  cleanBarcode,
  type Phase,
  type HistoryItem,
  type Person,
} from "@/lib/scanner-types";

const MAX_HISTORY = 20;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

export function useScanner() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const [phase, setPhase] = useState<Phase>("idle");

  const [barcode, setBarcode] = useState("");
  const [delta, setDelta] = useState<number>(0);

  const [infoTitle, setInfoTitle] = useState("Bereit");
  const [infoBody, setInfoBody] = useState("Drücke „Scannen starten“.");

  const [operator, setOperator] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("scanner_operator") ?? "";
    if (saved) setOperator(saved);
  }, []);

  useEffect(() => {
    if (!operator) return;
    localStorage.setItem("scanner_operator", operator);
  }, [operator]);

  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Desktop scanner
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const scanBufferRef = useRef<string>("");
  const finalizeTimerRef = useRef<number | null>(null);

  // Mobile camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const ua = navigator.userAgent.toLowerCase();
    const uaMobile = /iphone|ipad|android|mobile/.test(ua);
    return coarse || uaMobile;
  }, []);

  useEffect(() => {
    setMode(isMobile ? "mobile" : "desktop");
  }, [isMobile]);

  function focusHidden() {
    setTimeout(() => hiddenInputRef.current?.focus(), 50);
  }

  function resetAll(message?: { title: string; body: string }) {
    setCameraOn(false);
    setBarcode("");
    setDelta(0);
    scanBufferRef.current = "";
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";
    if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = null;

    setPhase("idle");
    setInfoTitle(message?.title ?? "Bereit");
    setInfoBody(message?.body ?? "Drücke „Scannen starten“.");
  }

  function refocusIfDesktop() {
    if (mode === "desktop") focusHidden();
  }

  async function finalizeScan(raw: string) {
    const cleaned = cleanBarcode(raw);
    scanBufferRef.current = "";
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";

    if (!cleaned) {
      setInfoTitle("Ungültiger Code");
      setInfoBody("Bitte erneut scannen.");
      setPhase("scanning");
      focusHidden();
      return;
    }

    setInfoTitle("Suche Produkt…");
    setInfoBody("Bitte warten…");

    try {
      const data = await queryClient.fetchQuery({
        queryKey: ["part-preview", cleaned],
        queryFn: async () => {
          const apiUrl = `${BASE_PATH}/api/part-preview?barcode=${cleaned}`;
          const res = await fetch(apiUrl);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Produkt nicht gefunden");
          return data;
        },
      });

      setBarcode(cleaned);
      setPhase("ready");
      setInfoTitle("Produkt erkannt");
      setInfoBody(
        `Produkt: ${data.partName}\nIPN/Code: ${cleaned}\nBestand: ${data.currentQty}\nJetzt Menge eingeben und buchen.`,
      );
    } catch (e: any) {
      setInfoTitle("Nicht gefunden");
      setInfoBody(e?.message ?? "Unbekannter Fehler");
      setPhase("idle");
    }
  }

  // Desktop: ENTER finalisiert, sonst 120ms idle finalisiert
  function onHiddenKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (phase !== "scanning") return;

    if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);

    if (e.key === "Enter") {
      e.preventDefault();
      finalizeScan(scanBufferRef.current);
      return;
    }

    if (e.key.length === 1) {
      scanBufferRef.current += e.key;
      finalizeTimerRef.current = window.setTimeout(
        () => finalizeScan(scanBufferRef.current),
        120,
      );
      e.preventDefault();
    }
  }

  function startScan() {
    setBarcode("");
    setDelta(0);
    scanBufferRef.current = "";
    if (hiddenInputRef.current) hiddenInputRef.current.value = "";
    if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = null;

    setPhase("scanning");
    setInfoTitle("Warte auf Scan…");
    setInfoBody("Bitte jetzt mit dem Handscanner scannen.");
    focusHidden();
  }

  // Mobile camera start/stop
  useEffect(() => {
    let controls: IScannerControls | null = null;

    async function startCamera() {
      if (!videoRef.current) return;

      try {
        // Check if camera permission is granted
        if (navigator.permissions) {
          const permission = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          if (permission.state === "denied") {
            throw new Error(
              "Camera permission denied. Please enable camera access in your browser settings.",
            );
          }
        }

        const reader = new BrowserMultiFormatReader();
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        if (devices.length === 0) {
          throw new Error("No camera devices found.");
        }

        const preferred =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ??
          devices[devices.length - 1];

        const deviceId = preferred?.deviceId;

        controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result) => {
            if (!result) return;
            const raw = result.getText();
            if (!raw) return;

            finalizeScan(raw);

            setCameraOn(false);
            controls?.stop();
          },
        );
      } catch (error) {
        console.error("Camera error:", error);
        setCameraOn(false);

        let errorMessage = "Camera error occurred.";
        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            errorMessage =
              "Camera access denied. Please allow camera access and try again.";
          } else if (error.name === "NotFoundError") {
            errorMessage =
              "No camera found. Please connect a camera and try again.";
          } else if (error.name === "NotReadableError") {
            errorMessage = "Camera is already in use by another application.";
          } else {
            errorMessage = error.message;
          }
        }

        setInfoTitle("Kamera Fehler");
        setInfoBody(errorMessage);
      }
    }

    if (mode === "mobile" && cameraOn) {
      setInfoTitle("Kamera");
      setInfoBody("Halte den Code in die Kamera.");
      startCamera();
    }

    return () => {
      controls?.stop();
    };
  }, [mode, cameraOn]);

  return {
    // State
    mode,
    phase,
    barcode,
    delta,
    infoTitle,
    infoBody,
    operator,
    history,
    cameraOn,
    hiddenInputRef,
    videoRef,

    // Computed
    canStartScan: mode === "desktop" && phase === "idle",
    canCancel: phase !== "booking",
    canEditQty: phase === "ready",
    hasOperator: operator.trim().length > 0,
    canBook: phase === "ready" && operator.trim().length > 0,
    isBooking: phase === "booking",

    // Actions
    setOperator,
    setBarcode,
    setDelta,
    setHistory,
    setCameraOn,
    resetAll,
    startScan,
    finalizeScan,
    onHiddenKeyDown,
  };
}
