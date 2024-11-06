import React, { useState, useEffect } from "react";
import "./Checkout.css"; // Certifique-se de que esse arquivo existe e está estilizado corretamente.
import ModalEndereco from "../../components/ModalEndereco/ModalEndereco"; // Importa o componente ModalEndereco
import { useNavigate } from "react-router-dom"; // Importar useNavigate para navegação
import ModalTroco from "../../components/ModalTroco/ModalTroco";

const Checkout = ({ carrinho, onLogout }) => {
  const navigate = useNavigate();
  const [enderecos, setEnderecos] = useState([]);
  const [error, setError] = useState("");
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] =
    useState("");
  const [troco, setTroco] = useState("");
  const [modalTrocoVisible, setModalTrocoVisible] = useState(false);
  const [modalEnderecoVisible, setModalEnderecoVisible] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [tipoEntrega, setTipoEntrega] = useState("");

  useEffect(() => {
    const formasPagamentoFake = [
      { id: "1", nome: "Cartão de Crédito" },
      { id: "2", nome: "Boleto Bancário" },
      { id: "3", nome: "Pix" },
      { id: "4", nome: "Dinheiro na Entrega" },
    ];
    setFormasPagamento(formasPagamentoFake);

    const clienteLocalStorage = JSON.parse(localStorage.getItem("token"));
    setCliente(clienteLocalStorage);
  }, []);

  const formatarTelefone = (telefone) => {
    const apenasNumeros = telefone.replace(/\D/g, "");
    const match = apenasNumeros.match(/(\d{2})(\d{5})(\d{4})/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return telefone;
  };

  const calcularTotal = () => {
    if (!Array.isArray(carrinho) || carrinho.length === 0) return 0;
    return carrinho.reduce((acc, item) => {
      const preco = item.price || 0;
      const quantidade = item.count || 0;
      return acc + preco * quantidade;
    }, 0);
  };

  const total = calcularTotal();

  const handleFinalizarPedido = () => {
    if (total === 0) {
      alert("Adicione produtos ao carrinho antes de finalizar.");
      return;
    }
    if (!formaPagamentoSelecionada) {
      alert("Por favor, selecione uma forma de pagamento.");
      return;
    }

    const pedido = {
      clienteId: cliente?.id,
      itens: carrinho,
      total,
      endereco: enderecos[0] || "", // Usa o primeiro endereço
      formaPagamento: formaPagamentoSelecionada,
      troco: formaPagamentoSelecionada === "4" ? troco : null,
    };

    console.log(
      `Pedido finalizado! Total: R$ ${total.toFixed(
        2
      )}\nDados do pedido: ${JSON.stringify(pedido)}`
    );
  };

  const handleLogout = () => {
    onLogout();
    navigate("/login");
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

  const handleTrocoChange = (e) => {
    setTroco(e.target.value);
  };

  const handleTrocoSubmit = (e) => {
    setModalTrocoVisible(false);
  };

  const handleNoTroco = () => {
    setTroco("0");
    setModalTrocoVisible(false);
  };

  const handleAddressSubmit = (endereco) => {
    // Define um único endereço no estado
    setEnderecos([endereco]); // Substitui o array de endereços pelo novo
    setModalEnderecoVisible(false); // Fecha o modal após submeter
  };

  return (
    <div className="checkout-container">
      <h2>Este pedido será entregue a:</h2>
      <div className="customer-info">
        {cliente ? (
          <>
            <p>{cliente.nome}</p>
            <p>{formatarTelefone(cliente.telefone)}</p>
          </>
        ) : (
          <p>Carregando informações do cliente...</p>
        )}
        <button onClick={handleLogout} className="change-button">
          Trocar
        </button>
      </div>

      <h3>Entrega</h3>
      <div className="delivery-info">
        <div className="delivery-option">
          <label>
            <input
              type="radio"
              value="entrega"
              checked={tipoEntrega === "entrega"}
              onChange={() => {
                setTipoEntrega("entrega");
                setModalEnderecoVisible(true); // Abre o modal para endereço
              }}
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
              onChange={() => setTipoEntrega("retirada")}
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
            {enderecos.length > 0 && ( // Exibe o endereço, se existir
              <span>
                *{enderecos[0].endereco}, {enderecos[0].numero},{" "}
                {enderecos[0].bairro}, {enderecos[0].complemento},{" "}
                {enderecos[0].cidade}
              </span>
            )}
          </>
        )}
      </div>

      <h3>Escolha a forma de pagamento</h3>
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

      {/* Substitua o trecho do modal de troco existente pelo seguinte */}
      <ModalTroco
        isVisible={modalTrocoVisible}
        onClose={() => setModalTrocoVisible(false)}
        onTrocoSubmit={handleTrocoSubmit}
        troco={troco}
        setTroco={setTroco}
        handleNoTroco={handleNoTroco}
      />

      {/* Modal para Endereço */}
      <ModalEndereco
        isVisible={modalEnderecoVisible}
        onClose={() => setModalEnderecoVisible(false)}
        onAddressSubmit={handleAddressSubmit}
        enderecoAtual={enderecos[0] || {}} // Passa o endereço atual, ou um objeto vazio se não houver
      />

      <h3>Observação do pedido</h3>
      <textarea
        className="observations-mobile"
        placeholder="Ex.: Apertar campainha, não buzinar, etc."
      />

      <div className="finish-order-info">
        <h3>Subtotal: R$ {total.toFixed(2)}</h3>
        <h3>Taxa de entrega: R$ 5,00</h3>
        <h2>Total: R$ {total + 5.0}</h2>

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
