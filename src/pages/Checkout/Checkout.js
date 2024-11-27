import React, { useState, useEffect, useCallback, useRef } from "react";
import "./Checkout.css";
import ModalEndereco from "../../components/ModalEndereco/ModalEndereco";
import { useNavigate } from "react-router-dom";
import ModalTroco from "../../components/ModalTroco/ModalTroco";
import { Bounce, toast } from "react-toastify";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";

const Checkout = ({ cartItems, setCartItems, onLogout, tenantData, setLastOrder }) => {
  const navigate = useNavigate();
  const [enderecos, setEnderecos] = useState([]);
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const enderecosRef = useRef(enderecos);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] =
    useState("");
  const [troco, setTroco] = useState("");
  const [modalTrocoVisible, setModalTrocoVisible] = useState(false);
  const [modalEnderecoVisible, setModalEnderecoVisible] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [tipoEntrega, setTipoEntrega] = useState("");
  const { fetchWithLoading } = useFetchWithLoading();

  useEffect(() => {
    const formasPagamentoFake = [
      { id: "1", nome: "Cartão de Crédito/Débito" },
      { id: "3", nome: "Pix" },
      { id: "4", nome: "Dinheiro na Entrega" },
    ];
    setFormasPagamento(formasPagamentoFake);

    const clienteLocalStorage = JSON.parse(localStorage.getItem("token"));
    setCliente(clienteLocalStorage);
  }, []);

  useEffect(() => {
    enderecosRef.current = enderecos;
  }, [enderecos]);

  const formatarTelefone = (telefone) => {
    const apenasNumeros = telefone.replace(/\D/g, "");
    const match = apenasNumeros.match(/(\d{2})(\d{5})(\d{4})/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return telefone;
  };

  // Função para calcular o total
  const calcularTotal = () => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return 0;

    const subtotal = cartItems.reduce((total, item) => {
      const itemTotal = item.totalPrice * item.count; // Preço total de cada item
      return total + itemTotal;
    }, 0);

    return subtotal + parseFloat(taxaEntrega); // Inclui a taxa de entrega no total
  };

  const total = calcularTotal();

  const handleFinalizarPedido = async () => {
    if (total === 0) {
      toast.warn("Adicione produtos ao carrinho antes de finalizar.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }
    if (!formaPagamentoSelecionada) {
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
      endereco: enderecos[0] || "",
      formaPagamento: formaPagamentoSelecionada,
      troco: formaPagamentoSelecionada === "4" ? troco : null,
    };


    try {
      const postResponse = await fetchWithLoading(
        `${config.baseURL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pedido),
        }
      );

      if (postResponse.ok) {
        const order = await postResponse.json();
        localStorage.removeItem('carrinho');
        setCartItems([])
        setLastOrder(order);
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

    if (formaSelecionada === "4") {
      setModalTrocoVisible(true);
    } else {
      setModalTrocoVisible(false);
      setTroco("");
    }
  };

  const handleAddressSubmit = useCallback((endereco) => {
    if (
      !endereco.endereco ||
      !endereco.numero ||
      !endereco.bairro ||
      !endereco.cidade
    ) {
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

  const handleTrocoSubmit = (e) => {
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

      <h2>Entrega</h2>
      <div className="delivery-info">
        <div className="delivery-option">
          <label>
            <input
              type="radio"
              value="entrega"
              checked={tipoEntrega === "entrega"}
              onChange={handleEntregaChange}
            />
            <span>Entrega</span>
          </label>
        </div>
        <div className="delivery-option">
          <label>
            <input
              type="radio"
              value="retirada"
              checked={tipoEntrega === "retirada"}
              onChange={() => {
                setTipoEntrega("retirada");
                setTaxaEntrega(0);
              }}
            />
            <span>Retirada no local</span>
          </label>
        </div>
      </div>

      <div className="delivery-type">
        {tipoEntrega === "retirada" && (
          <>
            <p>Você escolheu retirar o pedido no local.</p>
            <span>
              *Avenida Paraguassú 1865, Sala 804, Centro, Capão da Canoa
            </span>
          </>
        )}

        {tipoEntrega === "entrega" && (
          <>
            <p>Você escolheu entrega.</p>
            {enderecos && enderecos.length > 0 && (
              <span>
                *{enderecos[0].endereco}, {enderecos[0].numero},{" "}
                {enderecos[0].bairro}, {enderecos[0].complemento},{" "}
                {enderecos[0].cidade}
              </span>
            )}
          </>
        )}
      </div>

      <h2>Escolha a forma de pagamento</h2>
      <div className="payment-info">
        <select
          className="payment-select"
          onChange={handleFormaPagamentoChange}
          value={formaPagamentoSelecionada}
        >
          <option value="">Selecione uma forma de pagamento</option>
          {formasPagamento.map((forma) => (
            <option key={forma.id} value={forma.id}>
              {forma.nome}
            </option>
          ))}
        </select>
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

      <h2>Observação do pedido</h2>
      <textarea
        className="observations-mobile"
        placeholder="Ex.: Apertar campainha, não buzinar, etc."
      />

      <div className="finish-order-info">
        <h3>Subtotal: R$ {(calcularTotal() - taxaEntrega).toFixed(2)}</h3>
        <h3>Taxa de entrega: R$ {taxaEntrega.toFixed(2)}</h3>
        <h2>Total: R$ {total.toFixed(2)}</h2>

        {formaPagamentoSelecionada === "4" && troco && (
          <h3>Troco: R$ {troco}</h3>
        )}

        <button onClick={handleFinalizarPedido} className="finalizar-button">
          Finalizar Pedido
        </button>
      </div>
    </div>
  );
};

export default Checkout;
