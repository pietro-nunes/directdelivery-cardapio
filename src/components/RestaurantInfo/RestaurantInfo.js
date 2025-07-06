import React, { useEffect } from "react";
import "./RestaurantInfo.css";
import config from "../../config";
import { FiClock } from "react-icons/fi";
import { MdLocationPin } from "react-icons/md";
import { toTitleCase } from "../../utils/functions";

const RestaurantInfo = ({ restaurantInfo, setIsRestaurantOpen }) => {
  const isRestaurantOpen = (
    openingTime1,
    closingTime1,
    openingTime2,
    closingTime2,
    openingDays
  ) => {
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 1 : now.getDay() + 1;
    const currentTime = now.getHours() * 60 + now.getMinutes();

    if (!openingDays.includes(currentDay.toString())) {
      return false;
    }

    // console.log(openingTime2);c

    // Helper que já protege contra valores undefined ou vazios
    const isInInterval = (open, close) => {
      if (!open || !close) return false; // <-- aqui
      const [oh, om] = open.split(":").map(Number).slice(0, 2);
      const [ch, cm] = close.split(":").map(Number).slice(0, 2);
      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;

      if (closeMin < openMin) {
        return currentTime >= openMin || currentTime < closeMin;
      } else {
        return currentTime >= openMin && currentTime < closeMin;
      }
    };

    const openNow1 = isInInterval(openingTime1, closingTime1);
    const openNow2 = isInInterval(openingTime2, closingTime2);

    return openNow1 || openNow2;
  };

  const formatTime = (timeString) => {
    return timeString.slice(0, 5);
  };

  useEffect(() => {
    const isOpen = isRestaurantOpen(
      restaurantInfo.openingTime,
      restaurantInfo.closingTime,
      restaurantInfo.openingTime2,
      restaurantInfo.closingTime2,
      restaurantInfo.openingDays
    );
    setIsRestaurantOpen(isOpen); // Atualiza o estado global
  }, [restaurantInfo, setIsRestaurantOpen]);

  const isOpen = isRestaurantOpen(
    restaurantInfo.openingTime,
    restaurantInfo.closingTime,
    restaurantInfo.openingTime2,
    restaurantInfo.closingTime2,
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
      <h2 className="restaurant-name">{toTitleCase(restaurantInfo.name)}</h2>
      <p className={`status ${isOpen ? "open" : "closed"}`}>
        {isOpen ? "Estamos abertos 😁" : "Estamos fechados 😔"}
      </p>

      {/* Turno do Dia */}
      <p className="info">
        <FiClock size={14} /> <strong>Dia:</strong>{" "}
        {formatTime(restaurantInfo.openingTime)} –{" "}
        {formatTime(restaurantInfo.closingTime)}
      </p>

      {/* Turno da Noite (só se houver) */}
      {restaurantInfo.openingTime2 && restaurantInfo.closingTime2 && (
        <p className="info">
          <FiClock size={14} /> <strong>Noite:</strong>{" "}
          {formatTime(restaurantInfo.openingTime2)} –{" "}
          {formatTime(restaurantInfo.closingTime2)}
        </p>
      )}
    </div>
  );
};

export default RestaurantInfo;
