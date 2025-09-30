// ModalQRCode.jsx
import React, { useEffect, useRef, useCallback } from "react";
import "./ModalQRCode.css";

export default function ModalQRCode({ isOpen, onClose, onScan }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const elIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    try {
      await instanceRef.current?.stop();
      await instanceRef.current?.clear();
    } catch {}
    instanceRef.current = null;

    // remove o nó interno, para garantir estado limpo
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  const handleCancel = useCallback(async () => {
    await stopScanner();
    onClose?.();
  }, [onClose, stopScanner]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    (async () => {
      try {
        if (isStartingRef.current) return;
        isStartingRef.current = true;

        // importa no client
        const mod = await import("html5-qrcode");
        const { Html5Qrcode } = mod;

        if (!containerRef.current || cancelled) return;

        // cria um div interno e SÓ DEPOIS inicia o scanner
        const inner = document.createElement("div");
        const id = elIdRef.current;
        inner.id = id;
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(inner);

        instanceRef.current = new Html5Qrcode(id);

        await instanceRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            if (cancelled) return;
            onScan?.(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Falha ao iniciar câmera/QR:", err);
        // garante limpeza para a próxima abertura
        await stopScanner();
        // fecha o modal
        onClose?.();
      } finally {
        isStartingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      // cleanup ao fechar o modal
      stopScanner();
    };
  }, [isOpen, onClose, onScan, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="qrmodal-backdrop" onClick={handleCancel}>
      <div className="qrmodal" onClick={(e) => e.stopPropagation()}>
        <h3>Ler QR Code</h3>
        <p>Aponte a câmera para o QR da comanda.</p>
        <div ref={containerRef} className="qrmodal-reader" />
        <button className="qrmodal-close" onClick={handleCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
