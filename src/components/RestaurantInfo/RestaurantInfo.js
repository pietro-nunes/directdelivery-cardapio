import React, { useEffect } from "react";
import "./RestaurantInfo.css";
import config from "../../config";

const RestaurantInfo = ({ restaurantInfo, setIsRestaurantOpen }) => {
  const isRestaurantOpen = (openingTime, closingTime, openingDays) => {
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 1 : now.getDay() + 1;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (!openingDays.includes(currentDay.toString())) {
      return false;
    }

    const [openingHour, openingMinute] = openingTime.split(":").map(Number);
    const openingTimeInMinutes = openingHour * 60 + openingMinute;

    const [closingHour, closingMinute] = closingTime.split(":").map(Number);
    const closingTimeInMinutes = closingHour * 60 + closingMinute;

    if (closingTimeInMinutes < openingTimeInMinutes) {
      return (
        currentTime >= openingTimeInMinutes || currentTime < closingTimeInMinutes
      );
    } else {
      return (
        currentTime >= openingTimeInMinutes && currentTime < closingTimeInMinutes
      );
    }
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5);
  };

  useEffect(() => {
    const isOpen = isRestaurantOpen(
      restaurantInfo.openingTime,
      restaurantInfo.closingTime,
      restaurantInfo.openingDays
    );
    setIsRestaurantOpen(isOpen); // Atualiza o estado global
  }, [restaurantInfo, setIsRestaurantOpen]);

  const isOpen = isRestaurantOpen(
    restaurantInfo.openingTime,
    restaurantInfo.closingTime,
    restaurantInfo.openingDays
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
        <p>
          Horário de funcionamento:{" "}
          {formatTime(restaurantInfo.openingTime)} -{" "}
          {formatTime(restaurantInfo.closingTime)}
        </p>
      </div>
    </div>
  );
};

export default RestaurantInfo;
