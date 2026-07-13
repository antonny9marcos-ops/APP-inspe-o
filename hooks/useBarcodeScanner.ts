/**
 * useBarcodeScanner
 * -----------------
 * Hook reutilizavel para abrir o scanner de QR Code / Codigo de Barras
 * em qualquer componente do app.
 *
 * COMO USAR:
 * ----------
 * 1. Importe o hook e o componente:
 *    import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
 *    import { BarcodeScanner } from "./BarcodeScanner";
 *
 * 2. Inicialize o hook no seu componente:
 *    const { isOpen, openScanner, scannerProps } = useBarcodeScanner();
 *
 * 3. Adicione um botao que chama openScanner():
 *    <button onClick={() => openScanner({ title: "Codigo do Material", onScan: (code) => setMaterial(code) })}>
 *      Escanear
 *    </button>
 *
 * 4. Renderize o modal no JSX (pode ficar no final do return):
 *    {isOpen && scannerProps && <BarcodeScanner {...scannerProps} />}
 *
 * PARAMETROS de openScanner():
 *   - title?: string         -> Titulo exibido no modal (opcional)
 *   - onScan: (code) => void -> Callback chamado com o codigo lido
 *
 * O modal fecha automaticamente apos a leitura ou ao cancelar.
 */

import { useState, useCallback } from "react";

interface ScannerOptions {
  title?: string;
  onScan: (code: string) => void;
}

interface BarcodeScannerProps {
  title?: string;
  onScan: (code: string) => void;
  onClose: () => void;
}

interface UseBarcodeScanner {
  /** Se o modal do scanner esta aberto */
  isOpen: boolean;
  /** Abre o scanner com as opcoes fornecidas */
  openScanner: (opts: ScannerOptions) => void;
  /** Fecha o scanner manualmente */
  closeScanner: () => void;
  /** Props prontas para espalhar no componente <BarcodeScanner {...scannerProps} /> */
  scannerProps: BarcodeScannerProps | null;
}

export const useBarcodeScanner = (): UseBarcodeScanner => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ScannerOptions | null>(null);

  const openScanner = useCallback((opts: ScannerOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const scannerProps: BarcodeScannerProps | null = options
    ? {
        title: options.title,
        onScan: (code: string) => {
          options.onScan(code);
          closeScanner();
        },
        onClose: closeScanner,
      }
    : null;

  return { isOpen, openScanner, closeScanner, scannerProps };
};
