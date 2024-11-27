import "./OrdersList.css";
import React, { useEffect, useState } from "react";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";

const OrdersList = ({ tenantData }) => {
  const [orders, setOrders] = useState([]);
  const { fetchWithLoading } = useFetchWithLoading();

  // Função para buscar customerId do local storage
  const getCustomerId = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const parsedToken = JSON.parse(token);
      return parsedToken.id; // Retorna o customerId do token
    }
    return null;
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
  }, [tenantData]);

  const getStatusIndex = (status) => {
    const statusSteps = ["Aceito", "Em preparo", "Em rota para entrega", "Entregue"];
    return statusSteps.indexOf(status);
  };

  return (
    <div className="orders-list">
      <h2 className="orders-title">Seus Pedidos</h2>
      {orders.length > 0 ? (
        orders.map((order) => {
          const currentStatus = order.status || "Aceito"; // Status inicial se não houver um ainda
          const statusIndex = getStatusIndex(currentStatus);

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
                {["Aceito", "Em preparo", "Em rota para entrega", "Entregue"].map(
                  (status, index) => (
                    <span
                      key={status}
                      className={`status-step ${
                        index <= statusIndex ? "active" : ""
                      }`}
                    >
                      {status}
                    </span>
                  )
                )}
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
