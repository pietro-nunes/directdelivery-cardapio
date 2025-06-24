import "./OrdersList.css";
import React, { useEffect, useState } from "react";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import Cookies from "js-cookie";
import { FiRefreshCw } from "react-icons/fi";
import { formatarNumero } from "../../utils/functions";
import { MdOutlineCheck } from "react-icons/md";

const OrdersList = ({ tenantData }) => {
  const [orders, setOrders] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const { fetchWithLoading } = useFetchWithLoading();

  const statusSteps = ["created", "accepted", "preparing", "enroute", "delivered"];
  const statusTranslations = {
    created: "Criado",
    accepted: "Aceito",
    preparing: "Em preparo",
    enroute: "Em rota",
    delivered: "Entregue"
  };

  const getCustomerId = () => {
    const token = Cookies.get("token");
    if (token) {
      const parsedToken = JSON.parse(token);
      return parsedToken.id;
    }
    return null;
  };

  const fetchOrders = async () => {
    const customerId = getCustomerId();
    if (!customerId) {
      console.error("Erro: customerId não encontrado.");
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

  useEffect(() => {
    if (tenantData) {
      fetchOrders();
    }

    const intervalId = setInterval(fetchOrders, 60000);
    const countdownInterval = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime > 0 ? prevTime - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownInterval);
    };
  }, [tenantData]);

  const getStatusIndex = (status) => {
    const filteredStatusSteps = statusSteps.filter((s) => s !== "created");
    return filteredStatusSteps.indexOf(status);
  };

  return (
    <div className="orders-list">
      <h2 className="orders-title">Seus Pedidos</h2>
      <p className="update-timer">
        <FiRefreshCw /> Atualizando em: {timeLeft}s
      </p>
      {orders.length > 0 ? (
        orders.map((order) => (
          <div key={order.id} className="order-card">
            <h3>Pedido #{order.id}</h3>
            <p>Data: {new Date(order.createdAt).toLocaleString()}</p>
            <p>Total: R$ {formatarNumero(order.total)}</p>
            <div className="order-items">
              <h4>Itens:</h4>
              {order.items.map((item) => (
                <div key={item.id} className="order-item">
                  <span>
                    {item.quantity}x {item.productName}
                  </span>
                  <span>R$ {formatarNumero(item.totalPrice)}</span>
                </div>
              ))}
            </div>
            <div className="order-status">
              {statusSteps
                .filter((status) => status !== "created")
                .map((status, index) => {
                  const isActive = index <= getStatusIndex(order.status);
                  return (
                    <div
                      key={status}
                      className={`status-step ${isActive ? "active" : ""}`}
                    >
                      <div className="status-icon">
                        {isActive ? <MdOutlineCheck size={20}/> : ""}
                      </div>
                      <span>{statusTranslations[status]}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        ))
      ) : (
        <p>Nenhum pedido encontrado.</p>
      )}
    </div>
  );
};

export default OrdersList;
