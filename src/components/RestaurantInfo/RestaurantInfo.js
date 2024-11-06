import React from "react";
import "./RestaurantInfo.css";

const RestaurantInfo = ({ restaurantInfo }) => {

  return (
    <div className="restaurant-info">
      <div className="restaurant-logo-container">
        <img
          src={
            restaurantInfo.logo ||
            "https://via.placeholder.com/150?text=Logo+Restaurante"
          }
          alt={`${restaurantInfo.name} Logo`}
          className="restaurant-logo"
        />
      </div>
      <div className="restaurant-details">
        <h2>{restaurantInfo.name}</h2>
        <p>Horário de Funcionamento: {restaurantInfo.hours}</p>
        <p className={`status ${restaurantInfo.isOpen ? "open" : "closed"}`}>
          {restaurantInfo.isOpen ? "Aberto" : "Fechado"}
        </p>
      </div>
    </div>
  );
};

export default RestaurantInfo;
