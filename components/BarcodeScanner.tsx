import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  title?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  title = "Escanear Codigo",
}) => {
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = (results: { rawValue: string }[]) => {
    if (scanned) return;
    if (results && results.length > 0 && results[0].rawValue) {
      setScanned(true);
      setTimeout(() => {
        onScan(results[0].rawValue);
      }, 500);
    }
  };

  const handleError = (err: unknown) => {
    console.error("Scanner error:", err);
    if (err instanceof Error) {
      if (
        err.message.includes("Permission") ||
        err.message.includes("permission") ||
        err.message.includes("NotAllowed")
      ) {
        setError("Permissao de camera negada. Verifique as configuracoes do navegador.");
      } else if (
        err.message.includes("NotFound") ||
        err.message.includes("DevicesNotFound")
      ) {
        setError("Nenhuma camera encontrada neste dispositivo.");
      } else {
        setError("Nao foi possivel iniciar a camera.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-rounded text-blue-600" style={{ fontSize: 20 }}>qr_code_scanner</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p style={{ fontSize: 10 }} className="text-slate-400 font-medium uppercase tracking-widest">
                QR Code · Codigo de Barras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden bg-slate-950" style={{ height: 300 }}>
          {!error && !scanned && (
            <Scanner
              onScan={handleScan}
              onError={handleError}
              constraints={{ facingMode: "environment" }}
              styles={{
                container: { width: "100%", height: "100%", position: "relative" },
                video: { width: "100%", height: "100%", objectFit: "cover" },
              }}
              components={{
                audio: false,
                torch: false,
              }}
            />
          )}

          {/* Scan overlay guides */}
          {!error && !scanned && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-5 left-5 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-5 right-5 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-5 left-5 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-5 right-5 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              <style>{`
                @keyframes scanLine {
                  0% { top: 20px; }
                  50% { top: calc(100% - 28px); }
                  100% { top: 20px; }
                }
                .scan-anim {
                  position: absolute;
                  left: 20px;
                  right: 20px;
                  height: 2px;
                  background: linear-gradient(to right, transparent, #3b82f6, transparent);
                  animation: scanLine 2s ease-in-out infinite;
                }
              `}</style>
              <div className="scan-anim" />
            </div>
          )}

          {/* Success */}
          {scanned && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-rounded" style={{ fontSize: 36 }}>check</span>
                </div>
                <p className="font-black text-sm">Codigo lido com sucesso!</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6">
              <div className="text-center text-white">
                <span className="material-symbols-rounded text-red-400 block mb-3" style={{ fontSize: 48 }}>videocam_off</span>
                <p className="text-sm font-bold text-red-300 mb-2">Camera indisponivel</p>
                <p style={{ fontSize: 11 }} className="text-slate-400">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5">
          <p className="text-center text-slate-400 font-medium mb-4" style={{ fontSize: 12 }}>
            {scanned
              ? "Preenchendo o campo automaticamente..."
              : error
              ? "Verifique as permissoes de camera no navegador."
              : "Aponte a camera para o QR Code ou Codigo de Barras."}
          </p>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
