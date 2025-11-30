import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Checkout.css";
import ModalEndereco from "../../components/ModalEndereco/ModalEndereco";
import { useNavigate } from "react-router-dom";
import ModalTroco from "../../components/ModalTroco/ModalTroco";
import ModalQRCode from "../../components/ModalQRCode/ModalQRCode";
import { Bounce, toast } from "react-toastify";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import {
  MdLocationPin,
  MdLocalShipping,
  MdStore,
  MdTableBar,
} from "react-icons/md";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import Cookies from "js-cookie";
import { formatarNumero, toTitleCase } from "../../utils/functions";
import Textarea from "../../components/TextArea/TextArea";
import CryptoJS from "crypto-js";

const Checkout = ({
  cartItems,
  setCartItems,
  onLogout,
  onLogin,
  tenantData,
  basePath,
  setLastOrder,
  isTableMode,
  setPaymentData,
  tableNumber,
}) => {
  // console.log(tenantData);
  const salt = "directdeliveryacertsoft1865sala804";
  const navigate = useNavigate();
  const [enderecos, setEnderecos] = useState([]);
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const enderecosRef = useRef(enderecos);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState(
    {}
  );
  const [troco, setTroco] = useState("");
  const [modalTrocoVisible, setModalTrocoVisible] = useState(false);
  const [modalEnderecoVisible, setModalEnderecoVisible] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [tipoEntrega, setTipoEntrega] = useState("");
  const { fetchWithLoading } = useFetchWithLoading();
  const [observation, setObservation] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [scannedComanda, setScannedComanda] = useState(null);
  const submitAfterScanRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const scannedTabIdRef = useRef(null); // número da comanda lido no QR

  useEffect(() => {
    try {
      const clienteLocalStorage = JSON.parse(
        Cookies.get(`token-${tenantData.slug}`)
      );
      setCliente(clienteLocalStorage);
    } catch (e) {
      console.error("Erro ao carregar token do cliente:", e);
      onLogout();
    }
  }, [onLogout, tenantData.slug]);

  useEffect(() => {
    enderecosRef.current = enderecos;
  }, [enderecos]);

  // Fecha o modal somente após o endereço ser atualizado
  useEffect(() => {
    if (enderecos.length > 0 && tipoEntrega === "entrega") {
      setModalEnderecoVisible(false);
    }
  }, [enderecos, tipoEntrega]);

  const formatarTelefone = (telefone) => {
    const apenasNumeros = telefone?.replace(/\D/g, "");
    if (!apenasNumeros) return "";
    const match = apenasNumeros.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return telefone;
  };

  const parseCurrencyToNumber = (value) => {
    if (!value) return 0;
    const cleaned = value
      .toString()
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const calcularSubtotal = () => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
    return cartItems.reduce(
      (total, item) => total + item.unitPrice * item.count,
      0
    );
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    return subtotal + parseFloat(taxaEntrega);
  };

  const total = calcularTotal();

  const handleFinalizarPedido = async () => {
    // Em mesa: exigir QR antes
    if (isTableMode && !scannedTabIdRef.current) {
      setQrOpen(true);
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setIsSubmitting(true);

      if (!tipoEntrega && !isTableMode) {
        toast.warn("Por favor, selecione o tipo de entrega.", {
          theme: "colored",
          transition: Bounce,
        });
        return;
      }

      if (total <= 0) {
        toast.warn("Adicione produtos ao carrinho antes de finalizar.", {
          theme: "colored",
          transition: Bounce,
        });
        return;
      }

      if (!formaPagamentoSelecionada.id && !isTableMode) {
        toast.warn("Por favor, selecione uma forma de pagamento.", {
          theme: "colored",
          transition: Bounce,
        });
        return;
      }

      if (
        tipoEntrega === "entrega" &&
        (!enderecos[0]?.endereco || !enderecos[0]?.numero)
      ) {
        toast.warn(
          "Por favor, selecione ou adicione um endereço de entrega válido.",
          { theme: "colored", transition: Bounce }
        );
        return;
      }

      const pedido = {
        customerId: isTableMode ? null : cliente?.id,
        tenantId: tenantData.id,
        itens: cartItems.map((item) => ({
          ...item,
          totalPrice: item.totalPrice,
        })),
        total,
        retirada: isTableMode ? true : tipoEntrega === "retirada",
        endereco: enderecos[0] || null,
        formaPagamento: formaPagamentoSelecionada.id,
        troco: formaPagamentoSelecionada.need_change
          ? parseCurrencyToNumber(troco)
          : null,
        observacaoPedido: observation,
        nomeFormaPagamento: formaPagamentoSelecionada.name,
        pagamentoOnline: formaPagamentoSelecionada.onlinePayment,
        tabId: isTableMode ? Number(scannedTabIdRef.current) : null,
        tableNumber: isTableMode ? Number(tableNumber) : null,
      };

      const postResponse = await fetchWithLoading(`${config.baseURL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      });

      if (postResponse.ok) {
        const dataPedido = await postResponse.json();

        const response = await fetchWithLoading(
          `${config.baseURL}/customers/${tenantData.id}/phone/${cliente.phone}`
        );

        const clienteAtt = await response.json();
        const tokenData = JSON.stringify(clienteAtt);

        localStorage.removeItem("carrinho-" + tenantData.slug);
        setCartItems([]);
        setLastOrder({
          ...dataPedido,
          nomeFormaPagamento: pedido?.nomeFormaPagamento,
        });
        onLogin(tokenData);

        if (formaPagamentoSelecionada.onlinePayment) {
          const onlinePaymentResponse = await fetchWithLoading(
            `${config.baseURL}/orders/canvi/pix/${dataPedido.tenantId}/${dataPedido.id}`,
            { method: "POST", headers: { "Content-Type": "application/json" } }
          );
          const json = await onlinePaymentResponse.json();
          setPaymentData(json);
          navigate(`${basePath}/payment`);
        } else {
          navigate(`${basePath}/orderCompleted`);
        }
      } else {
        const errorData = await postResponse.json();
        toast.error(
          `Erro ao finalizar pedido: ${
            errorData.message || postResponse.statusText
          }`,
          {
            theme: "colored",
            transition: Bounce,
          }
        );
      }
    } catch (error) {
      console.error("Erro na consulta à API:", error);
      toast.error("Ocorreu um erro ao tentar finalizar o pedido.", {
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate(`${basePath}/login`);
  };

  const handleFormaPagamentoClick = (forma) => {
    setFormaPagamentoSelecionada(forma);
    if (forma.need_change) {
      setModalTrocoVisible(true);
    } else {
      setModalTrocoVisible(false);
      setTroco("");
    }
  };

  const handleAddressSubmit = useCallback(
    (endereco) => {
      if (!endereco.endereco || !endereco.numero || !endereco.bairro) {
        toast.warn(
          "Por favor, preencha todos os campos obrigatórios do endereço.",
          {
            theme: "colored",
            transition: Bounce,
          }
        );
        return;
      }

      const bairroCompleto = tenantData?.neighborhoods?.find(
        (n) => n.id === endereco.bairroId
      );
      const cidadeCompleta = tenantData?.cities?.find(
        (c) => c.id === endereco.cidadeId
      );

      const novoEndereco = {
        ...endereco,
        address: endereco.endereco,
        number: endereco.numero,
        nickname: endereco.apelidoEndereco,
        zipcode: endereco.cep,
        referencePoint: endereco.ptReferencia,
        complement: endereco.complemento,
        neighborhood: bairroCompleto || {
          id: endereco.bairroId,
          name: endereco.bairro,
        },
        city: cidadeCompleta || {
          id: endereco.cidadeId,
          name: endereco.cidade,
        },
      };

      setEnderecos([novoEndereco]);
      setTipoEntrega("entrega");
      setTaxaEntrega(parseFloat(endereco.deliveryFee) || 0);
    },
    [tenantData]
  );

  const handleEntregaClick = () => {
    if (!cliente?.addresses || cliente?.addresses.length === 0) {
      setEnderecos([]);
      setModalEnderecoVisible(true);
      return;
    }
    setTipoEntrega("entrega");
    setModalEnderecoVisible(true);
  };

  const handleRetiradaClick = () => {
    setTipoEntrega("retirada");
    setTaxaEntrega(0);
    setEnderecos([]);
  };

  const handleModalEnderecoClose = () => {
    if (!enderecos.length) {
      setTipoEntrega("");
      setTaxaEntrega(0);
    }
    setModalEnderecoVisible(false);
  };

  const handleTrocoSubmit = () => {
    setModalTrocoVisible(false);
  };

  const handleNoTroco = () => {
    setTroco("0");
    setModalTrocoVisible(false);
  };

  const handleQrScan = (decodedText) => {
    try {
      const text = String(decodedText).trim();
      const bytes = CryptoJS.AES.decrypt(text, salt);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        toast.warn("Comanda não localizada!", {
          theme: "colored",
          transition: Bounce,
        });
        return;
      }

      // Guarda só o número da comanda e finaliza
      scannedTabIdRef.current = decrypted;
      handleFinalizarPedido();
    } catch (e) {
      console.error("Falha ao interpretar QR:", e);
      toast.error("Erro ao interpretar QR Code.", {
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setQrOpen(false); // fecha o leitor em qualquer caso
    }
  };

  return (
    <div className="checkout-container">
      {/* Informações do Cliente */}
      <section className="checkout-section">
        <div className="section-header">
          <h2>Seu pedido será para:</h2>
        </div>
        <div className="card customer-card selected">
          {cliente ? (
            <div
              className="card-header-row"
              style={{
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <div>
                <p>
                  <strong>{cliente.name}</strong>
                </p>
                <p>{formatarTelefone(cliente.phone)}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="change-button"
                >
                  Trocar
                </button>
              </div>
            </div>
          ) : (
            <p>Carregando informações do cliente...</p>
          )}
        </div>
      </section>

      {/* Tipo de Entrega */}
      {isTableMode === false && (
        <section className="checkout-section">
          <h2>Escolha o tipo da entrega:</h2>

          <div className="delivery-card-list">
            {/* ENTREGA – só mostra se NÃO for só retirada */}
            {tenantData.onlyWithdraw === false && (
              <div
                className={`card delivery-card ${
                  tipoEntrega === "entrega" ? "selected" : ""
                }`}
                onClick={handleEntregaClick}
              >
                <div className="card-header-row">
                  <MdLocalShipping size={24} className="card-icon" />
                  <div className="card-content">
                    <strong>Entrega</strong>
                    <p>Receber no seu endereço</p>
                  </div>
                </div>

                {tipoEntrega === "entrega" && enderecos.length > 0 && (
                  <div className="card-footer">
                    <span className="footer-line">
                      <MdLocationPin size={20} />
                      {enderecos[0].neighborhood.name}, {enderecos[0].address},{" "}
                      {enderecos[0].number} - {enderecos[0].city.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* RETIRADA – sempre mostra */}
            <div
              className={`card delivery-card ${
                tipoEntrega === "retirada" ? "selected" : ""
              }`}
              onClick={handleRetiradaClick}
            >
              <div className="card-header-row">
                <MdStore size={24} className="card-icon" />
                <div className="card-content">
                  <strong>Retirada no local</strong>
                  <p>Buscar direto no balcão</p>
                </div>
              </div>

              {tipoEntrega === "retirada" && (
                <div className="card-footer">
                  <span className="footer-line">
                    <MdLocationPin size={20} />
                    {tenantData.address &&
                      tenantData.address !== "0" &&
                      `${toTitleCase(tenantData.address)}, `}
                    {tenantData.number &&
                      tenantData.number !== "0" &&
                      `${tenantData.number}, `}
                    {tenantData.neighborhood &&
                      tenantData.neighborhood !== "0" &&
                      `${toTitleCase(tenantData.neighborhood)} - `}
                    {tenantData.city &&
                      tenantData.city !== "0" &&
                      toTitleCase(tenantData.city)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Mesa */}
      {isTableMode === true && (
        <section className="checkout-section">
          <h2>Atendimento na mesa</h2>
          <div
            className="card delivery-card selected"
            style={{ cursor: "default" }}
            aria-live="polite"
          >
            <div className="card-header-row">
              <MdTableBar size={24} className="card-icon" />
              <div className="card-content">
                <strong>Entrega na mesa</strong>
                <p>
                  Seu pedido será entregue na mesa{" "}
                  <strong>Nº {tableNumber}</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Forma de Pagamento */}
      {isTableMode === false && (
        <section className="checkout-section">
          <h2>Escolha a forma de pagamento:</h2>

          {/* PAGUE ONLINE */}
          {tenantData?.paymentTypes?.some(
            (f) => f.isActive && f.onlinePayment
          ) && (
            <>
              <h3>Pague online</h3>
              <div className="payment-card-list">
                {tenantData.paymentTypes
                  .filter((forma) => forma.isActive && forma.onlinePayment)
                  .map((forma) => (
                    <div
                      key={forma.id}
                      className={`card payment-card ${
                        formaPagamentoSelecionada.id === forma.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleFormaPagamentoClick(forma)}
                    >
                      <div className="card-header-row">
                        <RiMoneyDollarCircleLine
                          size={24}
                          className="card-icon"
                        />
                        <div className="card-content">
                          <strong>{toTitleCase(forma.name)}</strong>
                          {forma.need_change && <p>Precisa de troco?</p>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {/* PAGUE NA ENTREGA */}
          {tenantData?.paymentTypes?.some(
            (f) => f.isActive && !f.onlinePayment
          ) && (
            <>
              <h3>Pague na entrega</h3>
              <div className="payment-card-list">
                {tenantData.paymentTypes
                  .filter((forma) => forma.isActive && !forma.onlinePayment)
                  .map((forma) => (
                    <div
                      key={forma.id}
                      className={`card payment-card ${
                        formaPagamentoSelecionada.id === forma.id
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleFormaPagamentoClick(forma)}
                    >
                      <div className="card-header-row">
                        <RiMoneyDollarCircleLine
                          size={24}
                          className="card-icon"
                        />
                        <div className="card-content">
                          <strong>{toTitleCase(forma.name)}</strong>
                          {forma.need_change && <p>Precisa de troco?</p>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Observações */}
      <section className="checkout-section">
        <h2>Observações do pedido:</h2>
        <Textarea
          id="obs-entrega"
          name="deliveryObservations"
          value={observation}
          onChange={setObservation}
          max={80}
          placeholder="Ex.: Apertar campainha, não buzinar, etc."
        />
      </section>

      {/* Modais */}
      <ModalTroco
        isVisible={modalTrocoVisible}
        onClose={() => setModalTrocoVisible(false)}
        onTrocoSubmit={handleTrocoSubmit}
        troco={troco}
        setTroco={setTroco}
        handleNoTroco={handleNoTroco}
        total={total}
      />
      <ModalEndereco
        isVisible={modalEnderecoVisible}
        onClose={handleModalEnderecoClose}
        onAddressSubmit={handleAddressSubmit}
        enderecoAtual={enderecos[0] || null}
        tenantData={tenantData}
        enderecos={cliente?.addresses || []}
      />

      {/* Modal QR para ler comanda/mesa */}
      <ModalQRCode
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        onScan={handleQrScan}
      />

      {/* Resumo e Finalizar */}
      <div className="finish-order-info">
        <div className="total-box">
          {!isTableMode && (
            <>
              <div className="total-row">
                <span>Subtotal:</span>
                <strong>R$ {formatarNumero(calcularSubtotal())}</strong>
              </div>
              <div className="total-row">
                <span>Taxa de entrega:</span>
                <strong>R$ {formatarNumero(taxaEntrega)}</strong>
              </div>
            </>
          )}
          <div className="total-row total-row-highlight">
            <span>Total:</span>
            <strong>R$ {formatarNumero(total)}</strong>
          </div>
          {formaPagamentoSelecionada.need_change && troco && troco !== "0" && (
            <div className="total-row total-row-troco">
              <span>Troco para:</span>
              <strong>R$ {formatarNumero(parseCurrencyToNumber(troco))}</strong>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleFinalizarPedido}
          className={`finalizar-button ${isSubmitting ? "is-loading" : ""}`}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="spinner" aria-hidden="true" /> Enviando...
            </>
          ) : (
            "Finalizar Pedido"
          )}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
