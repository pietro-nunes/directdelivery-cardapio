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
  const [permChecked, setPermChecked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

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

      const preferred = devices.find((d) => {
        const l = norm(d.label);
        return (
          l.includes("back") ||
          l.includes("rear") ||
          l.includes("traseira") ||
          l.includes("environment")
        );
      });

      const fallbackRear = devices[devices.length - 1];
      return (preferred || fallbackRear)?.id ?? null;
    } catch {
      return null;
    }
  };

  // Import dinâmico apenas do pacote principal
  const importHtml5Qrcode = async () => {
    const mod = await import("html5-qrcode");
    return mod?.Html5Qrcode;
  };

  const requestCameraPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg("Este navegador não suporta acesso à câmera.");
      setHasPermission(false);
      return false;
    }
    try {
      const test = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      test.getTracks().forEach((t) => t.stop());
      setHasPermission(true);
      setErrorMsg("");
      return true;
    } catch (err) {
      const msg = String(err?.name || err?.message || err || "");
      if (!window.isSecureContext) {
        setErrorMsg("Para usar a câmera no celular, acesse via HTTPS (ou localhost).");
      } else if (msg.includes("NotAllowedError")) {
        setErrorMsg("Permissão negada. Autorize a câmera nas configurações do navegador.");
      } else if (msg.includes("NotFoundError")) {
        setErrorMsg("Nenhuma câmera encontrada neste dispositivo.");
      } else if (msg.includes("NotReadableError")) {
        setErrorMsg("A câmera está em uso por outro app/aba. Feche-o e tente novamente.");
      } else if (/safari/i.test(navigator.userAgent)) {
        setErrorMsg("No iPhone, use Safari com HTTPS e permita o acesso à câmera.");
      } else {
        setErrorMsg("Não foi possível acessar a câmera.");
      }
      setHasPermission(false);
      return false;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsStarting(true);
    setErrorMsg("");

    try {
      if (!hasPermission) {
        const ok = await requestCameraPermission();
        if (!ok) throw new Error("Permissão de câmera não concedida.");
      }

      const Html5Qrcode = await importHtml5Qrcode();

      const inner = document.createElement("div");
      const id = elIdRef.current;
      containerRef.current.innerHTML = "";
      inner.id = id;
      containerRef.current.appendChild(inner);

      instanceRef.current = new Html5Qrcode(id, { verbose: false });

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
        (decodedText) => onScan?.(decodedText),
        () => {}
      );
    } catch (err) {
      console.error("Falha ao iniciar câmera/QR:", err);
      const msg = String(err?.message || err || "");
      let hint = "Não foi possível acessar a câmera.";
      if (!window.isSecureContext) {
        hint = "A câmera exige HTTPS. Abra o site via https:// (não http://).";
      } else if (msg.includes("NotAllowedError")) {
        hint = "Permissão negada. Autorize o acesso à câmera nas configurações do navegador.";
      } else if (msg.includes("NotFoundError")) {
        hint = "Nenhuma câmera encontrada neste dispositivo.";
      } else if (msg.includes("NotReadableError")) {
        hint = "A câmera pode estar em uso por outro app/aba. Feche outros apps e tente novamente.";
      } else if (/safari/i.test(navigator.userAgent)) {
        hint = "No iPhone, use o Safari com HTTPS e permita o acesso à câmera.";
      }
      setErrorMsg(hint);
      await stopScanner();
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  }, [hasPermission, onScan, requestCameraPermission, stopScanner]);

  const handleRetry = async () => {
    await stopScanner();
    await startScanner();
  };

  const handleCancel = useCallback(async () => {
    await stopScanner();
    onClose?.();
  }, [onClose, stopScanner]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isOpen) return;
      try {
        if (navigator.permissions?.query) {
          const res = await navigator.permissions.query({ name: "camera" });
          if (!mounted) return;
          if (res.state === "granted") {
            setHasPermission(true);
          } else {
            setHasPermission(false);
          }
        }
      } catch {}
      if (mounted) setPermChecked(true);
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (permChecked && hasPermission) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, permChecked, hasPermission, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="qrmodal-backdrop" onClick={handleCancel}>
      <div className="qrmodal" onClick={(e) => e.stopPropagation()}>
        <h3>Ler QR Code</h3>
        <p>Aponte a câmera traseira para o QR da comanda.</p>

        {!permChecked && <p>Preparando câmera…</p>}

        {permChecked && !hasPermission && (
          <div className="qrmodal-permission">
            <p>Precisamos da sua permissão para acessar a câmera.</p>
            {!window.isSecureContext && (
              <p className="qrmodal-hint">
                Dica: no celular, use <strong>HTTPS</strong> (ngrok/mkcert) ou localhost.
              </p>
            )}
            <button
              className="qrmodal-retry"
              onClick={async () => {
                const ok = await requestCameraPermission();
                if (ok) startScanner();
              }}
              disabled={isStarting}
            >
              Permitir câmera
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="qrmodal-error">
            {errorMsg}
            <button className="qrmodal-retry" onClick={handleRetry} disabled={isStarting}>
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
