// ModalQRCode.jsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import "./ModalQRCode.css";

export default function ModalQRCode({ isOpen, onClose, onScan }) {
  const containerRef = useRef(null);
  const instanceRef = useRef(null);
  const elIdRef = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const isStartingRef = useRef(false);
  const frameTimerRef = useRef(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [hasTriedStart, setHasTriedStart] = useState(false);

  // --- util: parar e limpar leitor ---
  const stopScanner = useCallback(async () => {
    clearTimeout(frameTimerRef.current);
    frameTimerRef.current = null;
    try {
      await instanceRef.current?.stop();
      await instanceRef.current?.clear();
    } catch {}
    instanceRef.current = null;
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }
  }, []);

  // --- import dinâmico (ESM) ---
  const importHtml5Qrcode = async () => {
    const mod = await import("html5-qrcode");
    return mod?.Html5Qrcode;
  };

  // --- tenta escolher câmera traseira ---
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

      // fallback: último costuma ser traseira em vários devices
      const fallbackRear = devices[devices.length - 1];
      return (preferred || fallbackRear)?.id ?? null;
    } catch {
      return null;
    }
  };

  // --- pede permissão em gesto do usuário (iOS requer) ---
  const requestPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Este navegador não suporta acesso à câmera.");
    }

    // dica: alguns iOS só liberam labels após enumerateDevices
    try { await navigator.mediaDevices.enumerateDevices(); } catch {}

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        // Essas “hints” ajudam Safari/Chrome iOS a escolher melhor
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false,
    });
    // encerra de imediato — a lib assumirá depois
    stream.getTracks().forEach((t) => t.stop());
  }, []);

  // --- garante um div interno pra lib renderizar ---
  const ensureContainer = () => {
    const id = elIdRef.current;
    containerRef.current.innerHTML = "";
    const inner = document.createElement("div");
    inner.id = id;
    containerRef.current.appendChild(inner);
    return id;
  };

  // --- tenta iniciar com uma fonte; se não gerar frames em X ms, falha ---
  const tryStartWithSource = async (Html5Qrcode, source) => {
    const id = ensureContainer();
    instanceRef.current = new Html5Qrcode(id, { verbose: false });

    const config = {
      fps: 10,
      qrbox: { width: 260, height: 260 },
      rememberLastUsedCamera: false,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      aspectRatio: 1
    };

    let gotAnyFrame = false;
    const FRAMES_TIMEOUT_MS = 3000;

    clearTimeout(frameTimerRef.current);
    frameTimerRef.current = setTimeout(() => {
      if (!gotAnyFrame) {
        instanceRef.current?.stop().finally(() => {
          // será capturado no caller
          throw new Error("Sem frames do vídeo (timeout).");
        });
      }
    }, FRAMES_TIMEOUT_MS);

    await instanceRef.current.start(
      source,
      config,
      (decodedText) => {
        gotAnyFrame = true;
        onScan?.(decodedText);
      },
      // onScanFailure roda a cada ciclo — usamos como “tem frames”
      () => { gotAnyFrame = true; }
    );
  };

  // --- inicia leitor com múltiplas estratégias ---
  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsStarting(true);
    setErrorMsg("");

    try {
      const Html5Qrcode = await importHtml5Qrcode();

      // A) tentar por deviceId (traseira)
      try {
        const backId = await pickBackCameraId(Html5Qrcode);
        if (backId) {
          await tryStartWithSource(Html5Qrcode, { deviceId: { exact: backId } });
          return;
        }
        throw new Error("Sem deviceId traseiro detectado.");
      } catch {
        // continua
      }

      // B) environment
      try {
        await tryStartWithSource(Html5Qrcode, { facingMode: "environment" });
        return;
      } catch {
        // continua
      }

      // C) user (frontal) — último recurso
      await tryStartWithSource(Html5Qrcode, { facingMode: "user" });
    } catch (err) {
      console.error("Falha ao iniciar câmera/QR:", err);
      const msg = String(err?.name || err?.message || err || "");
      let hint = "Não foi possível acessar a câmera.";
      if (!window.isSecureContext) {
        hint = "A câmera exige HTTPS no celular. Use https:// (ou localhost no desktop).";
      } else if (msg.includes("NotAllowedError")) {
        hint = "Permissão negada. Autorize a câmera nas configurações do navegador.";
      } else if (msg.includes("NotFoundError")) {
        hint = "Nenhuma câmera encontrada neste dispositivo.";
      } else if (msg.includes("NotReadableError")) {
        hint = "A câmera pode estar em uso por outro app/aba. Feche-os e tente novamente.";
      } else if (/safari/i.test(navigator.userAgent)) {
        hint = "No iPhone/iPad, use Safari com HTTPS e toque em “Conceder permissão e iniciar”.";
      } else if (msg.includes("Sem frames")) {
        hint = "Vídeo não gerou frames. Toque em “Tentar novamente” ou escolha outra câmera.";
      }
      setErrorMsg(hint);
      await stopScanner();
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
      setHasTriedStart(true);
      clearTimeout(frameTimerRef.current);
      frameTimerRef.current = null;
    }
  }, [onScan, stopScanner]);

  // --- pedir permissão e iniciar (em clique do usuário) ---
  const handleGrantAndStart = async () => {
    try {
      setErrorMsg("");
      setIsStarting(true);
      await requestPermission();
      await startScanner();
    } catch (err) {
      console.error(err);
      let txt = "Não foi possível solicitar a permissão. Verifique as configurações do navegador.";
      if (!window.isSecureContext) {
        txt = "A permissão da câmera exige HTTPS no celular. Use https:// (ou localhost no desktop).";
      }
      setErrorMsg(txt);
      setHasTriedStart(true);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRetry = async () => {
    await stopScanner();
    await handleGrantAndStart();
  };

  const handleCancel = useCallback(async () => {
    await stopScanner();
    onClose?.();
  }, [onClose, stopScanner]);

  // pausa se aba/tab ficar oculta (iOS suspende stream) e tenta retomar
  useEffect(() => {
    const onVis = async () => {
      if (document.hidden) {
        await stopScanner();
      } else if (isOpen) {
        // retoma quando volta
        setTimeout(() => handleGrantAndStart(), 150);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [isOpen, handleGrantAndStart, stopScanner]);

  // limpa quando fechar
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setErrorMsg("");
      setHasTriedStart(false);
    }
  }, [isOpen, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="qrmodal-backdrop" onClick={handleCancel}>
      <div className="qrmodal" onClick={(e) => e.stopPropagation()}>
        <h3>Ler QR Code</h3>
        <p>Aponte a câmera para o QR da comanda.</p>

        {!hasTriedStart && (
          <button
            className="qrmodal-retry"
            onClick={handleGrantAndStart}
            disabled={isStarting}
          >
            {isStarting ? "Iniciando câmera…" : "Conceder permissão e iniciar"}
          </button>
        )}

        {errorMsg && (
          <div className="qrmodal-error">
            {errorMsg}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className="qrmodal-retry"
                onClick={handleRetry}
                disabled={isStarting}
              >
                Tentar novamente
              </button>

              {/* Fallback: upload de imagem com QR */}
              <label className="qrmodal-retry" style={{ cursor: "pointer" }}>
                Ler de uma imagem
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const Html5Qrcode = await importHtml5Qrcode();
                      const id = elIdRef.current;

                      if (!instanceRef.current) {
                        containerRef.current.innerHTML = "";
                        const inner = document.createElement("div");
                        inner.id = id;
                        containerRef.current.appendChild(inner);
                        instanceRef.current = new Html5Qrcode(id, { verbose: false });
                      }

                      const result = await instanceRef.current.scanFileV2(file, true);
                      if (result?.decodedText) {
                        onScan?.(result.decodedText);
                      } else {
                        setErrorMsg("Não consegui reconhecer um QR nessa imagem.");
                      }
                    } catch (er) {
                      console.error(er);
                      setErrorMsg("Falha ao ler o QR da imagem.");
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}

        <div ref={containerRef} className="qrmodal-reader" />

        <button
          className="qrmodal-close"
          onClick={handleCancel}
          disabled={isStarting}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
