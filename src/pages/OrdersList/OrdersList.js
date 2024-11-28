import "./OrdersList.css";
import React, { useEffect, useState } from "react";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import Cookies from "js-cookie";
import { FiRefreshCw } from "react-icons/fi";

const OrdersList = ({ tenantData }) => {
  const [orders, setOrders] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60); // Tempo restante em segundos
  const { fetchWithLoading } = useFetchWithLoading();

  const statusSteps = ["created", "accepted", "preparing", "enroute", "delivered"];
  const statusTranslations = {
    created: "Criado",
    accepted: "Aceito",
    preparing: "Em preparo",
    enroute: "Em rota para entrega",
    delivered: "Entregue"
  };

  // Função para buscar customerId do cookie
  const getCustomerId = () => {
    const token = Cookies.get("token"); // Obtendo o token do cookie
    if (token) {
      const parsedToken = JSON.parse(token); // Parse do token
      return parsedToken.id; // Retorna o customerId do token
    }
    return null; // Retorna null se o token não existir
  };
  
  // Função para buscar os pedidos
  const fetchOrders = async () => {
    const customerId = getCustomerId();
    if (!customerId) {
      console.error("Erro: customerId não encontrado no local storage.");
      return;
    }

    try {
      const ordersResponse = await fetchWithLoading(
        `${config.baseURL}/orders/${customerId}/${tenantData.id}`
      );
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
  };

  // Carregar pedidos quando os dados do tenant estiverem prontos
  useEffect(() => {
    if (tenantData) {
      fetchOrders();
    }

    const intervalId = setInterval(() => {
      fetchOrders();
    }, 60000); // Atualiza a cada 60.000 ms (1 minuto)

    const countdownInterval = setInterval(() => {
      setTimeLeft(prevTime => (prevTime > 0 ? prevTime - 1 : 60)); // Decrementa o tempo e reinicia em 60 segundos
    }, 1000); // Atualiza a cada segundo

    return () => {
      clearInterval(intervalId); // Limpa o intervalo de pedidos
      clearInterval(countdownInterval); // Limpa o intervalo do cronômetro
    };
  }, [tenantData]);

  const getStatusIndex = (status) => {
    const filteredStatusSteps = statusSteps.filter((s) => s !== "created");
    return filteredStatusSteps.indexOf(status);
  };

  return (
    <div className="orders-list">
      <h2 className="orders-title">Seus Pedidos</h2>
      <p className="update-timer"> <FiRefreshCw /> Buscando atualizações dos pedidos em: {timeLeft}s</p>
      {orders.length > 0 ? (
        orders.map((order) => {
          return (
            <div key={order.id} className="order-card">
              <h3>Pedido #{order.id}</h3>
              <p>Data: {new Date(order.createdAt).toLocaleString()}</p>
              <p>Total: R$ {order.total}</p>
              <p>Método de Pagamento: {order.paymentMethod}</p>
              <div className="order-items">
                <h4>Itens:</h4>
                {order.items.map((item) => (
                  <div key={item.id} className="order-item">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span>R$ {item.totalPrice}</span>
                  </div>
                ))}
              </div>
              <div className="order-status">
                {statusSteps
                  .filter((status) => status !== "created") // Exclui "created"
                  .map((status, index) => (
                    <span
                      key={status}
                      className={`status-step ${index <= getStatusIndex(order.status) ? "active" : ""
                        }`}
                    >
                      {statusTranslations[status]} {/* Exibe a tradução */}
                    </span>
                  ))}
              </div>
            </div>
          );
        })
      ) : (
        <p>Nenhum pedido encontrado.</p>
      )}
    </div>
  );
};

export default OrdersList;
