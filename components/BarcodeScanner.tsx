
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  title?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  title = "Escanear Código",
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const containerId = "qr-scanner-container";

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId, { verbose: false } as any);
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 260, height: 180 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
      ],
    };

    let alreadyScanned = false;

    scanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText: string) => {
          if (!alreadyScanned) {
            alreadyScanned = true;
            setScanned(true);
            setScanning(false);
            scanner.stop().then(() => {
              onScan(decodedText);
            });
          }
        },
        () => {}
      )
      .then(() => {
        setScanning(true);
      })
      .catch((err: unknown) => {
        setError(
          "Nao foi possivel acessar a camera. Verifique as permissoes do navegador."
        );
        console.error("Scanner error:", err);
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          scannerRef.current = null;
          onClose();
        });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-rounded text-blue-600 !text-xl">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                QR Code · Codigo de Barras
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <span className="material-symbols-rounded text-xl">close</span>
          </button>
        </div>

        <div className="relative bg-slate-950 mx-4 mt-4 rounded-2xl overflow-hidden" style={{ height: 280 }}>
          <div id={containerId} className="w-full h-full" />

          {scanning && !error && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
              <style>{`
                @keyframes scanLine {
                  0% { top: 24px; }
                  50% { top: calc(100% - 32px); }
                  100% { top: 24px; }
                }
                .scan-line-anim {
                  position: absolute;
                  left: 24px;
                  right: 24px;
                  height: 2px;
                  background: linear-gradient(to right, transparent, #3b82f6, transparent);
                  animation: scanLine 2s ease-in-out infinite;
                }
              `}</style>
              <div className="scan-line-anim" />
            </div>
          )}

          {scanned && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-rounded !text-3xl">check</span>
                </div>
                <p className="font-black text-sm">Codigo lido!</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-6">
              <div className="text-center text-white">
                <span className="material-symbols-rounded !text-4xl text-red-400 mb-3 block">videocam_off</span>
                <p className="text-sm font-bold text-red-300 mb-1">Camera indisponivel</p>
                <p className="text-xs text-slate-400">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-5">
          <p className="text-center text-xs text-slate-400 font-medium mb-4">
            {scanning && !error
              ? "Aponte a camera para o codigo. A leitura e automatica."
              : error
              ? "Permita o acesso a camera nas configuracoes do navegador."
              : "Iniciando camera..."}
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
