import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Checkout.css";
import ModalEndereco from "../../components/ModalEndereco/ModalEndereco";
import { useNavigate } from "react-router-dom";
import ModalTroco from "../../components/ModalTroco/ModalTroco";
import { Bounce, toast } from "react-toastify";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import { MdLocationPin } from "react-icons/md";
import Cookies from "js-cookie";
import { formatarNumero } from "../../utils/functions";

const Checkout = ({
  cartItems,
  setCartItems,
  onLogout,
  tenantData,
  setLastOrder,
}) => {
  const navigate = useNavigate();
  const [enderecos, setEnderecos] = useState([]);
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const enderecosRef = useRef(enderecos);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState({});
  const [troco, setTroco] = useState("");
  const [modalTrocoVisible, setModalTrocoVisible] = useState(false);
  const [modalEnderecoVisible, setModalEnderecoVisible] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [tipoEntrega, setTipoEntrega] = useState("");
  const { fetchWithLoading } = useFetchWithLoading();
  const [observation, setObservation] = useState("");

  useEffect(() => {
    const clienteLocalStorage = JSON.parse(Cookies.get("token"));
    setCliente(clienteLocalStorage);
  }, []);

  useEffect(() => {
    enderecosRef.current = enderecos;
  }, [enderecos]);

  const formatarTelefone = (telefone) => {
    const apenasNumeros = telefone.replace(/\D/g, "");
    const match = apenasNumeros.match(/(\d{2})(\d{5})(\d{4})/);
    if (match) {
      return `(${match[1]}) ${match[2]} -${match[3]}`;
    }
    return telefone;
  };

  const parseCurrencyToNumber = (value) => {
    if (!value) return 0;
    const cleaned = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const calcularTotal = () => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;
    const subtotal = cartItems.reduce((total, item) => {
      const itemTotal = item.totalPrice * item.count;
      return total + itemTotal;
    }, 0);
    return subtotal + parseFloat(taxaEntrega);
  };

  const total = calcularTotal();

  const handleFinalizarPedido = async () => {
    if (!tipoEntrega) {
      toast.warn("Por favor, selecione se deseja entrega ou retirada.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    if (total === 0) {
      toast.warn("Adicione produtos ao carrinho antes de finalizar.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    if (!formaPagamentoSelecionada.id) {
      toast.warn("Por favor, selecione uma forma de pagamento.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    const pedido = {
      customerId: cliente?.id,
      tenantId: tenantData.id,
      itens: cartItems,
      total,
      retirada: tipoEntrega === "retirada",
      endereco: enderecos[0] || "{}",
      formaPagamento: formaPagamentoSelecionada.id,
      troco: formaPagamentoSelecionada.need_change ? parseCurrencyToNumber(troco) : null,
      observacaoPedido: observation,
      nomeFormaPagamento: formaPagamentoSelecionada.name
    };

    try {
      const postResponse = await fetchWithLoading(`${config.baseURL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedido),
      });

      if (postResponse.ok) {
        const order = await postResponse.json();
        localStorage.removeItem("carrinho-" + tenantData.slug);
        setCartItems([]);
        setLastOrder(pedido);
        navigate(`/${tenantData.slug}/orderCompleted`);
      }
    } catch (error) {
      console.error("Erro na consulta à API:", error);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate(`/${tenantData.slug}/login`);
  };

  const handleFormaPagamentoChange = (e) => {
    const formaSelecionada = e.target.value;
    setFormaPagamentoSelecionada(formaSelecionada);

    if (formaSelecionada.need_change) {
      setModalTrocoVisible(true);
    } else {
      setModalTrocoVisible(false);
      setTroco("");
    }
  };

  const handleAddressSubmit = useCallback((endereco) => {
    if (!endereco.endereco || !endereco.numero || !endereco.bairro || !endereco.cidade) {
      toast.warn("Por favor, preencha todos os campos obrigatórios.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    setEnderecos([endereco]);
    setTipoEntrega("entrega");
    enderecosRef.current = [endereco];
    setTaxaEntrega(parseFloat(endereco.deliveryFee) || 0);
    setModalEnderecoVisible(false);
  }, []);

  const handleEntregaChange = () => {
    setModalEnderecoVisible(true);
  };

  const handleModalEnderecoClose = () => {
    if (!enderecosRef.current.length || !enderecosRef.current[0]?.endereco) {
      setTipoEntrega("");
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

  return (
    <div className="checkout-container">
      <h2>Este pedido será entregue a:</h2>
      <div className="customer-info">
        {cliente ? (
          <>
            <p>{cliente.name}</p>
            <p>{formatarTelefone(cliente.phone)}</p>
          </>
        ) : (
          <p>Carregando informações do cliente...</p>
        )}
        <button onClick={handleLogout} className="change-button">
          Trocar
        </button>
      </div>

      <h2>Escolha o tipo da entrega:</h2>
      <div className="delivery-card-list">
        <div
          className={`address-card ${tipoEntrega === "entrega" ? "selected" : ""}`}
          onClick={handleEntregaChange}
        >
          <strong>Entrega</strong>
          <p>Receber no seu endereço</p>
        </div>

        <div
          className={`address-card ${tipoEntrega === "retirada" ? "selected" : ""}`}
          onClick={() => {
            setTipoEntrega("retirada");
            setTaxaEntrega(0);
          }}
        >
          <strong>Retirada no local</strong>
          <p>Buscar direto no balcão</p>
        </div>
      </div>

      <div className="delivery-type">
        {tipoEntrega === "retirada" && (
          <>
            <p>Você escolheu retirar o pedido no local.</p>
            <span>
              <MdLocationPin size={14} /> {tenantData.address}, {tenantData.number},{" "}
              {tenantData.neighborhood} - {tenantData.city}
            </span>
          </>
        )}

        {tipoEntrega === "entrega" && (
          <>
            <p>O pedido será entregue em: </p>
            {enderecos && enderecos.length > 0 && (
              <span>
                <MdLocationPin size={14} /> {enderecos[0].endereco}, {enderecos[0].numero},{" "}
                {enderecos[0].bairro}, {enderecos[0].complemento}, {enderecos[0].cidade}
              </span>
            )}
          </>
        )}
      </div>

      <h2>Escolha a forma de pagamento:</h2>
      <div className="payment-info">
        <div className="payment-card-list">
          {tenantData?.paymentTypes?.map(
            (forma) =>
              forma.isActive && (
                <div
                  key={forma.id}
                  className={`address-card ${
                    formaPagamentoSelecionada.id === forma.id ? "selected" : ""
                  }`}
                  onClick={() =>
                    handleFormaPagamentoChange({ target: { value: forma } })
                  }
                >
                  <strong>{forma.name}</strong>
                </div>
              )
          )}
        </div>
      </div>

      <ModalTroco
        isVisible={modalTrocoVisible}
        onClose={() => setModalTrocoVisible(false)}
        onTrocoSubmit={handleTrocoSubmit}
        troco={troco}
        setTroco={setTroco}
        handleNoTroco={handleNoTroco}
      />

      <ModalEndereco
        isVisible={modalEnderecoVisible}
        onClose={handleModalEnderecoClose}
        onAddressSubmit={handleAddressSubmit}
        enderecoAtual={enderecos[0] || {}}
        tenantData={tenantData}
        enderecos={cliente?.addresses || []}
      />

      <h2>Observação do pedido:</h2>
      <textarea
        className="observations-mobile"
        placeholder="Ex.: Apertar campainha, não buzinar, etc."
        maxLength={150}
        value={observation}
        onChange={(e) => setObservation(e.target.value)}
      />

      <div className="finish-order-info">
        <div className="total-box">
          <div className="total-row">
            <span>Subtotal:</span>
            <strong>R$ {formatarNumero(calcularTotal() - taxaEntrega)}</strong>
          </div>
          <div className="total-row">
            <span>Taxa de entrega:</span>
            <strong>R$ {formatarNumero(taxaEntrega)}</strong>
          </div>
          <div className="total-row total-row-highlight">
            <span>Total:</span>
            <strong>R$ {formatarNumero(total)}</strong>
          </div>
          {formaPagamentoSelecionada.need_change && troco && (
            <div className="total-row">
              <span>Troco:</span>
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
