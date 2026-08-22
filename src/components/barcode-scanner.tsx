"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "barcode-scanner-container";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // ignore scan failures
        }
      );
      setIsScanning(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Camera access denied. Please allow camera permission."
      );
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <div className="space-y-4">
      <div
        id={containerId}
        className="w-full rounded-xl overflow-hidden bg-black min-h-[200px]"
      />

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-2">
        {!isScanning ? (
          <Button onClick={startScanner} className="flex-1" size="lg">
            <Camera className="h-5 w-5" />
            Start Scanner
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="secondary" className="flex-1" size="lg">
            Stop Scanner
          </Button>
        )}
        {onClose && (
          <Button onClick={onClose} variant="ghost" size="lg">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
