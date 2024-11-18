import React from "react";
import "./RestaurantInfo.css";
import config from "../../config";

const RestaurantInfo = ({ restaurantInfo }) => {

  const isRestaurantOpen = (openingTime, closingTime) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Horário atual em minutos

    const [openingHour, openingMinute] = openingTime.split(":").map(Number);
    const openingTimeInMinutes = openingHour * 60 + openingMinute;

    const [closingHour, closingMinute] = closingTime.split(":").map(Number);
    const closingTimeInMinutes = closingHour * 60 + closingMinute;

    if (closingTimeInMinutes < openingTimeInMinutes) {
      // Caso o restaurante feche após a meia-noite
      return (
        currentTime >= openingTimeInMinutes ||
        currentTime < closingTimeInMinutes
      );
    } else {
      // Caso normal
      return (
        currentTime >= openingTimeInMinutes &&
        currentTime < closingTimeInMinutes
      );
    }
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5); // Retorna os 5 primeiros caracteres "HH:MM"
  };
  
  
  const isOpen = isRestaurantOpen(
    restaurantInfo.openingTime,
    restaurantInfo.closingTime
  );

  return (
    <div className="restaurant-info">
      <div className="restaurant-logo-container">
        <img
          src={
            config.baseURL + restaurantInfo.logo ||
            "https://via.placeholder.com/150?text=Logo+Restaurante"
          }
          alt={`${restaurantInfo.name} Logo`}
          className="restaurant-logo"
        />
      </div>
      <div className="restaurant-details">
        <h2>{restaurantInfo.name}</h2>
        <p className={`status ${isOpen ? "open" : "closed"}`}>
          {isOpen ? "Estamos abertos 😁" : "Estamos fechados 😔"}
        </p>
        <p>Horário de funcionamento: {formatTime(restaurantInfo.openingTime)} - {formatTime(restaurantInfo.closingTime)}</p>
      </div>
    </div>
  );
};

export default RestaurantInfo;
