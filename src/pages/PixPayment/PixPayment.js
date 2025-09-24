import React, { useEffect, useMemo, useState } from "react";
import "./PixPayment.css";

const IconQrCode = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
  </svg>
);

const IconCopy = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const IconClock = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

export default function Payment({ payment }) {
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Lógica do cronômetro
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const expiresAtMs = useMemo(() => {
    if (!payment?.expires_at) return null;
    const date = new Date(payment.expires_at);
    return isNaN(date.getTime()) ? null : date.getTime();
  }, [payment?.expires_at]);

  const remainingTime = useMemo(() => {
    if (!expiresAtMs) return null;
    const diff = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
    const minutes = String(Math.floor(diff / 60)).padStart(2, "0");
    const seconds = String(diff % 60).padStart(2, "0");
    return { total: diff, label: `${minutes}:${seconds}` };
  }, [expiresAtMs, now]);
  
  const formatCurrency = (v) =>
    (Number(v) || 0).toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' });

  const handleCopyCode = async () => {
    if (!payment?.qrCode) return;
    try {
      await navigator.clipboard.writeText(payment.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar o código:", err);
    }
  };

  // Tela de carregamento
  if (!payment) {
    return (
      <div className="pix-payment-container">
        <div className="pix-payment-card">
          <div className="pix-loading-state">
            <IconQrCode size={48} />
            <h2>Pix</h2>
            <p>Carregando informações do pagamento...</p>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = remainingTime && remainingTime.total === 0;

  return (
    <div className="pix-payment-container">
      <div className="pix-payment-header">
        <IconQrCode size={32} />
        <h2>Pagamento via Pix</h2>
        <p className="pix-order-info">Pedido #{payment.orderId}</p>
      </div>

      <div className="pix-payment-card">
        <div className="pix-amount-section">
          <span className="pix-amount-label">Valor a pagar</span>
          <div className="pix-amount-value">{formatCurrency(payment.amount)}</div>
        </div>

        {remainingTime && (
          <div className={`pix-timer-section ${isExpired ? "expired" : ""}`}>
            <IconClock size={20} />
            <span>
              {isExpired ? "Código expirado!" : `Expira em ${remainingTime.label}`}
            </span>
          </div>
        )}

        <div className="pix-qr-section">
          {payment.qrCodeImage ? (
            <div className={`pix-qr-wrapper ${isExpired ? "expired" : ""}`}>
              <img
                className="pix-qr-image"
                src={payment.qrCodeImage}
                alt="QR Code PIX"
              />
              {isExpired && <div className="pix-expired-overlay">Expirado</div>}
            </div>
          ) : (
            <div className="pix-qr-placeholder">QR Code indisponível</div>
          )}
        </div>

        {!isExpired && (
          <div className="pix-action-section">
            <button className="pix-btn-primary" onClick={handleCopyCode}>
              <IconCopy size={20} />
              Copiar código Pix
            </button>
            {copied && <div className="pix-copied-feedback">✓ Código copiado!</div>}
          </div>
        )}
      </div>

      <div className="pix-instructions-card">
        <h3>Como pagar com Pix</h3>
        <div className="pix-steps">
          <div className="pix-step">
            <span className="pix-step-number">1</span>
            <p>Abra o aplicativo do seu banco e acesse a área Pix</p>
          </div>
          <div className="pix-step">
            <span className="pix-step-number">2</span>
            <p>Escolha a opção "Pagar com QR Code" ou "Pix Copia e Cola"</p>
          </div>
          <div className="pix-step">
            <span className="pix-step-number">3</span>
            <p>Escaneie o código acima ou cole o código copiado</p>
          </div>
          <div className="pix-step">
            <span className="pix-step-number">4</span>
            <p>Confirme os dados e finalize o pagamento</p>
          </div>
        </div>
      </div>
    </div>
  );
}