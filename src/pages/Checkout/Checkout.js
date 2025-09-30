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
import { formatarNumero } from "../../utils/functions";

const Checkout = ({
  cartItems,
  setCartItems,
  onLogout,
  tenantData,
  basePath,
  setLastOrder,
  isTableMode,
  setPaymentData,
  tableNumber,
}) => {
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
  const isSubmittingRef = useRef(false);
  const scannedTabIdRef = useRef(null); // número da comanda lido no QR

  useEffect(() => {
    try {
      const clienteLocalStorage = JSON.parse(Cookies.get("token"));
      setCliente(clienteLocalStorage);
    } catch (e) {
      console.error("Erro ao carregar token do cliente:", e);
      onLogout();
    }
  }, [onLogout]);

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
      (total, item) => total + item.totalPrice * item.count,
      0
    );
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    return subtotal + parseFloat(taxaEntrega);
  };

  const total = calcularTotal();

  const handleFinalizarPedido = async () => {
    // 🔴 Exige QR sempre em modo mesa
    if (isTableMode && !scannedTabIdRef.current) {
      setQrOpen(true);
      return; // NÃO prossegue; envio só após leitura do QR
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (!tipoEntrega && !isTableMode) {
        toast.warn("Por favor, selecione o tipo de entrega.", {
          theme: "colored",
          transition: Bounce,
        });
        isSubmittingRef.current = false;
        return;
      }

      if (total <= 0) {
        toast.warn("Adicione produtos ao carrinho antes de finalizar.", {
          theme: "colored",
          transition: Bounce,
        });
        isSubmittingRef.current = false;
        return;
      }

      if (!formaPagamentoSelecionada.id && !isTableMode) {
        toast.warn("Por favor, selecione uma forma de pagamento.", {
          theme: "colored",
          transition: Bounce,
        });
        isSubmittingRef.current = false;
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
        isSubmittingRef.current = false;
        return;
      }

      const pedido = {
        customerId: isTableMode ? null : cliente?.id,
        tenantId: tenantData.id,
        itens: cartItems.map((item) => ({
          ...item,
          totalPrice: item.totalPrice * item.count,
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
        tabId: isTableMode ? Number(scannedTabIdRef.current) : null, // ✅ sempre do QR
        tableNumber: isTableMode ? Number(tableNumber) : null, // ignorado em mesa
      };

      const postResponse = await fetchWithLoading(`${config.baseURL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      });

      if (postResponse.ok) {
        const dataPedido = await postResponse.json();
        localStorage.removeItem("carrinho-" + tenantData.slug);
        setCartItems([]);
        setLastOrder(pedido);

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
      const match = String(decodedText).match(/\d+/);
      const numero = match ? parseInt(match[0], 10) : null;

      if (!numero) {
        toast.warn("QR lido, mas não encontrei número da comanda.", {
          theme: "colored",
          transition: Bounce,
        });
        return;
      }

      scannedTabIdRef.current = numero; // guarda para o envio
      setQrOpen(false);

      // Envia na sequência, já com o tabId lido
      handleFinalizarPedido();
    } catch (e) {
      console.error("Falha ao interpretar QR:", e);
      toast.error("Erro ao interpretar QR Code.", {
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setQrOpen(false);
    }
  };

  return (
    <div className="checkout-container">
      {/* Informações do Cliente */}
      <section className="checkout-section">
        <div className="section-header">
          <h2>Seu pedido será para:</h2>
          <button onClick={handleLogout} className="change-button">
            Trocar
          </button>
        </div>
        <div className="card customer-card">
          {cliente ? (
            <>
              <p>
                <strong>{cliente.name}</strong>
              </p>
              <p>{formatarTelefone(cliente.phone)}</p>
            </>
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
            <div
              className={`card delivery-card ${
                tipoEntrega === "entrega" ? "selected" : ""
              }`}
              onClick={handleEntregaClick}
            >
              <MdLocalShipping size={24} className="card-icon" />
              <div className="card-content">
                <strong>Entrega</strong>
                <p>Receber no seu endereço</p>
              </div>
            </div>
            <div
              className={`card delivery-card ${
                tipoEntrega === "retirada" ? "selected" : ""
              }`}
              onClick={handleRetiradaClick}
            >
              <MdStore size={24} className="card-icon" />
              <div className="card-content">
                <strong>Retirada no local</strong>
                <p>Buscar direto no balcão</p>
              </div>
            </div>
          </div>
          {tipoEntrega === "retirada" && (
            <div className="delivery-details">
              <span>
                <MdLocationPin size={14} /> {tenantData.address},{" "}
                {tenantData.number}, {tenantData.neighborhood} -{" "}
                {tenantData.city}
              </span>
            </div>
          )}
          {tipoEntrega === "entrega" && enderecos.length > 0 && (
            <div className="delivery-details">
              <span>
                <MdLocationPin size={14} /> {enderecos[0].neighborhood.name},{" "}
                {enderecos[0].address}, {enderecos[0].number} -{" "}
                {enderecos[0].city.name}
              </span>
            </div>
          )}
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
            <MdTableBar size={24} className="card-icon" />
            <div className="card-content">
              <strong>Entrega na mesa</strong>
              <p>
                Seu pedido será entregue na mesa{" "}
                <strong>Nº {tableNumber}</strong>.
              </p>
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
                      <RiMoneyDollarCircleLine
                        size={24}
                        className="card-icon"
                      />
                      <div className="card-content">
                        <strong>{forma.name}</strong>
                        {forma.need_change && <p>Precisa de troco?</p>}
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
                      <RiMoneyDollarCircleLine
                        size={24}
                        className="card-icon"
                      />
                      <div className="card-content">
                        <strong>{forma.name}</strong>
                        {forma.need_change && <p>Precisa de troco?</p>}
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
        <textarea
          className="observations-textarea"
          placeholder="Ex.: Apertar campainha, não buzinar, etc."
          maxLength={150}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
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
        <button onClick={handleFinalizarPedido} className="finalizar-button">
          Finalizar Pedido
        </button>
      </div>
    </div>
  );
};

export default Checkout;
