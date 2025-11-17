import React, { useEffect } from "react";
import "./RestaurantInfo.css";
import config from "../../config";
import { FiMoon, FiSun } from "react-icons/fi";
import { toTitleCase } from "../../utils/functions";

const HEARTBEAT_MAX_AGE_MIN = 1.5; // tolerância do lastPooling (em minutos)

// helpers
const isZeroTime = (t) => {
  if (!t && t !== 0) return false;
  const s = String(t).trim();
  // normaliza: pega só HH:MM
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return false;
  const hh = m[1].padStart(2, "0");
  const mm = m[2];
  return hh === "00" && mm === "00";
};

const isDisabledShift = (open, close) => isZeroTime(open) && isZeroTime(close);

// ✅ Verifica se o heartbeat (lastPooling) é recente
const isLastPoolingOk = (lastPooling, maxAgeMin = HEARTBEAT_MAX_AGE_MIN) => {
  if (!lastPooling) return false;
  if (typeof lastPooling === "string" && lastPooling.startsWith("0000-00-00"))
    return false;

  const parseAsLocal = (s) => {
    const txt = s.trim().endsWith("Z") ? s.trim().slice(0, -1) : s.trim();
    const m = txt.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/
    );
    if (!m) return new Date(s); // fallback nativo
    const [, Y, M, D, h, mi, se = "0", ms = "0"] = m;
    return new Date(+Y, +M - 1, +D, +h, +mi, +se, +ms); // ← local, sem conversão de fuso
  };

  const lp =
    typeof lastPooling === "string"
      ? parseAsLocal(lastPooling)
      : new Date(lastPooling);

  if (isNaN(lp.getTime())) return false;

  const ageMs = Date.now() - lp.getTime();
  return ageMs <= maxAgeMin * 60 * 1000;
};

// ✅ Normaliza openingDays (pode vir como array ou CSV)
const normalizeOpeningDays = (openingDays) => {
  if (Array.isArray(openingDays)) return openingDays;
  if (typeof openingDays === "string") {
    return openingDays
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const RestaurantInfo = ({
  restaurantInfo,
  setIsRestaurantOpen,
  isTableMode,
}) => {
  const isRestaurantOpen = (
    openingTime1,
    closingTime1,
    openingTime2,
    closingTime2,
    openingDays,
    lastPooling
  ) => {
    // 1) Se o servidor perdeu conexão, fecha a loja
    if (!isLastPoolingOk(lastPooling, HEARTBEAT_MAX_AGE_MIN)) {
      return false;
    }

    // 2) 🔥 SE FOR TABLE MODE: considera aberto se o pooling está OK
    if (isTableMode) {
      return true;
    }

    const now = new Date();
    const currentDay = now.getDay() === 0 ? 1 : now.getDay() + 1; // 1..7
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const daysArr = normalizeOpeningDays(openingDays);
    if (!daysArr.includes(currentDay.toString())) {
      return false;
    }

    // Helper que protege contra valores undefined ou vazios
    const isInInterval = (open, close) => {
      if (!open || !close) return false;
      const [oh = 0, om = 0] = open.split(":").map(Number).slice(0, 2);
      const [ch = 0, cm = 0] = close.split(":").map(Number).slice(0, 2);
      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;

      // intervalo virando o dia (ex.: 22:00 -> 02:00)
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
    if (!timeString || typeof timeString !== "string") return "--:--";
    return timeString.slice(0, 5);
  };

  useEffect(() => {
    const isOpen = isRestaurantOpen(
      restaurantInfo.openingTime,
      restaurantInfo.closingTime,
      restaurantInfo.openingTime2,
      restaurantInfo.closingTime2,
      restaurantInfo.openingDays,
      restaurantInfo.lastPooling // 👈 considera o heartbeat
    );
    setIsRestaurantOpen(isOpen); // Atualiza o estado global
  }, [restaurantInfo, setIsRestaurantOpen]);

  const isOpen = isRestaurantOpen(
    restaurantInfo.openingTime,
    restaurantInfo.closingTime,
    restaurantInfo.openingTime2,
    restaurantInfo.closingTime2,
    restaurantInfo.openingDays,
    restaurantInfo.lastPooling // 👈 considera o heartbeat
  );

  const logoSrc =
    (restaurantInfo?.logo ? `${config.baseURL}${restaurantInfo.logo}` : null) ||
    "https://via.placeholder.com/150?text=Logo+Restaurante";

  return (
    <div className="restaurant-info">
      <div className="restaurant-logo-container">
        <img
          src={logoSrc}
          alt={`${restaurantInfo.name} Logo`}
          className="restaurant-logo"
        />
      </div>

      <h2 className="restaurant-name">{toTitleCase(restaurantInfo.name)}</h2>

      <p className={`status ${isOpen ? "open" : "closed"}`}>
        {isOpen ? "Estamos abertos 😁" : "Estamos fechados 😔"}
      </p>

      {/* Turnos — só mostra se NÃO estiver em modo mesa */}
      {!isTableMode && (
        <>
          {/* Turno do Dia */}
          {!isDisabledShift(
            restaurantInfo.openingTime,
            restaurantInfo.closingTime
          ) && (
            <p className="info">
              <FiSun size={14} /> <strong>Turno 1:</strong>{" "}
              {formatTime(restaurantInfo.openingTime)} –{" "}
              {formatTime(restaurantInfo.closingTime)}
            </p>
          )}

          {/* Turno da Noite */}
          {restaurantInfo.openingTime2 &&
            restaurantInfo.closingTime2 &&
            !isDisabledShift(
              restaurantInfo.openingTime2,
              restaurantInfo.closingTime2
            ) && (
              <p className="info">
                <FiMoon size={14} /> <strong>Turno 2:</strong>{" "}
                {formatTime(restaurantInfo.openingTime2)} –{" "}
                {formatTime(restaurantInfo.closingTime2)}
              </p>
            )}
        </>
      )}
    </div>
  );
};

export default RestaurantInfo;
