// ModalQRCode.jsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import "./ModalQRCode.css";

export default function ModalQRCode({ isOpen, onClose, onScan }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const elIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const isStartingRef = useRef(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const stopScanner = useCallback(async () => {
    try {
      await instanceRef.current?.stop();
      await instanceRef.current?.clear();
    } catch {}
    instanceRef.current = null;
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  const pickBackCameraId = async (Html5Qrcode) => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || !devices.length) return null;

      const norm = (s) => (s || "").toLowerCase();

      // tenta por label conhecida
      const preferred = devices.find((d) => {
        const l = norm(d.label);
        return (
          l.includes("back") ||
          l.includes("rear") ||
          l.includes("traseira") ||
          l.includes("environment")
        );
      });

      // heurística: se labels vazios (iOS pré-permissão), pega o último
      const fallbackRear = devices[devices.length - 1];

      return (preferred || fallbackRear)?.id ?? null;
    } catch {
      return null;
    }
  };

  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsStarting(true);
    setErrorMsg("");

    try {
      const mod = await import("html5-qrcode");
      const { Html5Qrcode } = mod;

      // cria o nó interno ANTES de instanciar o reader
      const inner = document.createElement("div");
      const id = elIdRef.current;
      containerRef.current.innerHTML = "";
      inner.id = id;
      containerRef.current.appendChild(inner);

      instanceRef.current = new Html5Qrcode(id, { verbose: false });

      // força traseira: tenta deviceId específico; senão facingMode: environment
      const backId = await pickBackCameraId(Html5Qrcode);
      const startSource = backId
        ? { deviceId: { exact: backId } }
        : { facingMode: "environment" };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: false,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        aspectRatio: 1,
      };

      await instanceRef.current.start(
        startSource,
        config,
        (decodedText) => {
          onScan?.(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error("Falha ao iniciar câmera/QR:", err);
      let hint = "Não foi possível acessar a câmera.";
      const msg = String(err?.message || err || "");

      if (!window.isSecureContext) {
        hint = "A câmera exige HTTPS. Abra o site via https:// (não http://).";
      } else if (msg.includes("NotAllowedError")) {
        hint = "Permissão negada. Autorize o acesso à câmera nas configurações do navegador.";
      } else if (msg.includes("NotFoundError")) {
        hint = "Nenhuma câmera encontrada neste dispositivo.";
      } else if (msg.includes("NotReadableError")) {
        hint = "A câmera pode estar em uso por outro app. Feche outros apps e tente novamente.";
      } else if (/safari/i.test(navigator.userAgent)) {
        hint = "No iPhone, use o Safari com HTTPS e permita o acesso à câmera.";
      }

      setErrorMsg(hint);
      // mantém o modal aberto; apenas limpa o estado do leitor
      await stopScanner();
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  }, [onScan, stopScanner]);

  const handleRetry = async () => {
    await stopScanner();
    await startScanner();
  };

  const handleCancel = useCallback(async () => {
    await stopScanner();
    onClose?.();
  }, [onClose, stopScanner]);

  useEffect(() => {
    if (!isOpen) return;
    // abre scanner ao abrir o modal
    startScanner();

    // cleanup ao fechar/desmontar
    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="qrmodal-backdrop" onClick={handleCancel}>
      <div className="qrmodal" onClick={(e) => e.stopPropagation()}>
        <h3>Ler QR Code</h3>
        <p>Aponte a câmera traseira para o QR da comanda.</p>

        {errorMsg && (
          <div className="qrmodal-error">
            {errorMsg}
            <button
              className="qrmodal-retry"
              onClick={handleRetry}
              disabled={isStarting}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div ref={containerRef} className="qrmodal-reader" />

        <button className="qrmodal-close" onClick={handleCancel} disabled={isStarting}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
