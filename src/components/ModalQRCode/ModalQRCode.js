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

  const importHtml5Qrcode = async () => {
    const mod = await import("html5-qrcode");
    return mod?.Html5Qrcode;
  };

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
      // fallback “último” costuma ser traseira em muitos devices
      const fallbackRear = devices[devices.length - 1];
      return (preferred || fallbackRear)?.id ?? null;
    } catch {
      return null;
    }
  };

  // 1) Solicita permissão via gesto do usuário
  const requestPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Este navegador não suporta acesso à câmera.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    // encerra imediatamente — lib assumirá depois
    stream.getTracks().forEach((t) => t.stop());
  }, []);

  const ensureContainer = () => {
    const id = elIdRef.current;
    containerRef.current.innerHTML = "";
    const inner = document.createElement("div");
    inner.id = id;
    containerRef.current.appendChild(inner);
    return id;
  };

  // Tenta iniciar com uma fonte específica; se não houver frames em X segundos, rejeita
  const tryStartWithSource = async (Html5Qrcode, source) => {
    const id = ensureContainer();
    instanceRef.current = new Html5Qrcode(id, { verbose: false });

    const config = {
      fps: 10,
      qrbox: { width: 260, height: 260 },
      rememberLastUsedCamera: false,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      aspectRatio: 1,
    };

    let gotAnyFrame = false;

    // Html5-qrcode não expõe “frame”, então usamos timeout:
    // se em 3s ainda não houve callback de falha/leitura, assumimos travado.
    const FRAMES_TIMEOUT_MS = 3000;
    clearTimeout(frameTimerRef.current);
    frameTimerRef.current = setTimeout(() => {
      if (!gotAnyFrame) {
        // força erro que será capturado pelo caller
        instanceRef.current?.stop().finally(() => {
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
      // “onScanFailure” é chamado por ciclo; usamos como indicação de frames vivos
      () => {
        gotAnyFrame = true;
      }
    );
  };

  // 2) Inicia o leitor com múltiplas estratégias (traseira → environment → user)
  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    setIsStarting(true);
    setErrorMsg("");

    try {
      const Html5Qrcode = await importHtml5Qrcode();

      // STRAT A: deviceId traseira
      try {
        const backId = await pickBackCameraId(Html5Qrcode);
        if (backId) {
          await tryStartWithSource(Html5Qrcode, { deviceId: { exact: backId } });
          return; // sucesso
        }
        throw new Error("Sem deviceId traseiro detectado.");
      } catch (eA) {
        // continua para B
      }

      // STRAT B: facingMode environment
      try {
        await tryStartWithSource(Html5Qrcode, { facingMode: "environment" });
        return; // sucesso
      } catch (eB) {
        // continua para C
      }

      // STRAT C: facingMode user (selfie) — último recurso
      await tryStartWithSource(Html5Qrcode, { facingMode: "user" });
      // sucesso (talvez apareça frontal, mas pelo menos não fica cinza)
    } catch (err) {
      console.error("Falha ao iniciar câmera/QR:", err);
      const msg = String(err?.name || err?.message || err || "");
      let hint = "Não foi possível acessar a câmera.";
      if (!window.isSecureContext) {
        hint =
          "A câmera exige HTTPS no celular. Use https:// (ou localhost no desktop).";
      } else if (msg.includes("NotAllowedError")) {
        hint =
          "Permissão negada. Autorize a câmera nas configurações do navegador.";
      } else if (msg.includes("NotFoundError")) {
        hint = "Nenhuma câmera encontrada neste dispositivo.";
      } else if (msg.includes("NotReadableError")) {
        hint =
          "A câmera pode estar em uso por outro app/aba. Feche-os e tente novamente.";
      } else if (/safari/i.test(navigator.userAgent)) {
        hint =
          "No iPhone/iPad, use Safari com HTTPS e toque em “Conceder permissão e iniciar”.";
      } else if (msg.includes("Sem frames")) {
        hint =
          "Vídeo não gerou frames. Tente “Tentar novamente” ou escolha outra câmera.";
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

  // Clique principal: solicita permissão e inicia
  const handleGrantAndStart = async () => {
    try {
      setErrorMsg("");
      setIsStarting(true);
      await requestPermission(); // mantém a solicitação explícita de permissão
      await startScanner();
    } catch (err) {
      console.error(err);
      let txt =
        "Não foi possível solicitar a permissão. Verifique as configurações do navegador.";
      if (!window.isSecureContext) {
        txt =
          "A permissão da câmera exige HTTPS no celular. Use https:// (ou localhost no desktop).";
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

  // Limpa quando o modal fecha
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
