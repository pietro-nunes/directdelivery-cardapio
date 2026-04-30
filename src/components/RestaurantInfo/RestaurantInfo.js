import React, { useEffect } from "react";
import "./RestaurantInfo.css";
import config from "../../config";
import { FiClock, FiMapPin } from "react-icons/fi";
import { toTitleCase } from "../../utils/functions";

const HEARTBEAT_MAX_AGE_MIN = 1.5;

const isLastPoolingOk = (lastPooling, maxAgeMin = HEARTBEAT_MAX_AGE_MIN) => {
  if (!lastPooling) return false;
  if (typeof lastPooling === "string" && lastPooling.startsWith("0000-00-00"))
    return false;

  const parseAsLocal = (s) => {
    const txt = s.trim().endsWith("Z") ? s.trim().slice(0, -1) : s.trim();
    const m = txt.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(:\d{2})?(\.\d{1,3})?$/
    );
    if (!m) return new Date(s);
    const [, Y, M, D, h, mi, sec, msRaw] = m;
    const se = (sec || ":00").slice(1);
    const ms = msRaw ? Math.floor(+msRaw.slice(1) * 1000) : 0;
    return new Date(+Y, +M - 1, +D, +h, +mi, +se, ms);
  };

  const lp =
    typeof lastPooling === "string"
      ? parseAsLocal(lastPooling)
      : new Date(lastPooling);

  if (isNaN(lp.getTime())) return false;

  const ageMs = Date.now() - lp.getTime();
  return ageMs <= maxAgeMin * 60 * 1000;
};

// Converte "HH:MM:SS" em minutos totais
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [h = 0, m = 0] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Verifica se o horário atual está dentro de um intervalo (suporta virada de meia-noite)
const isInTimeRange = (startTime, endTime, currentMinutes) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return false;

  if (end < start) {
    return currentMinutes >= start || currentMinutes < end;
  }
  return currentMinutes >= start && currentMinutes < end;
};

// Verifica se algum turno ativo cobre o dia e hora atual
export const getActiveTurn = (turns, currentDay, currentMinutes) => {
  if (!Array.isArray(turns)) {
    return null;
  }

  for (const turn of turns) {
    if (!turn.isActive) continue;
    if (!Array.isArray(turn.days)) continue;

    for (const day of turn.days) {
      if (day.dayOfWeek !== currentDay) continue;
      if (isInTimeRange(day.startTime, day.endTime, currentMinutes)) {
        return turn;
      }
    }
  }
  return null;
};

const formatTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return "--:--";
  return timeStr.slice(0, 5);
};

// 1=domingo, 7=sábado
const DAY_NAMES = ["", "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Mapeia dias da semana aos horários de todos os turnos ativos
const buildDayScheduleMap = (turns) => {
  const dayMap = {};
  for (let i = 1; i <= 7; i++) dayMap[i] = [];
  
  (turns || [])
    .filter(t => t.isActive)
    .forEach(turn => {
      (turn.days || []).forEach(day => {
        dayMap[day.dayOfWeek].push({
          start: day.startTime,
          end: day.endTime
        });
      });
    });
  
  return dayMap;
};

// Agrupa dias consecutivos com horários idênticos
const groupConsecutiveDays = (dayMap) => {
  const groups = [];
  let currentGroup = null;
  
  for (let day = 1; day <= 7; day++) {
    const schedules = dayMap[day];
    const isSameAsPrev = currentGroup && 
      JSON.stringify(currentGroup.schedules) === JSON.stringify(schedules);
      
    if (isSameAsPrev) {
      currentGroup.endDay = day;
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { startDay: day, endDay: day, schedules };
    }
  }
  
  if (currentGroup) groups.push(currentGroup);
  return groups.filter(g => g.schedules.length > 0);
};

const RestaurantInfo = ({
  restaurantInfo,
  setIsRestaurantOpen,
  isTableMode,
}) => {
  const isRestaurantOpen = () => {
    // 1) Primeiro: checa o heartbeat — se offline, fecha tudo
    if (!isLastPoolingOk(restaurantInfo.lastPooling, HEARTBEAT_MAX_AGE_MIN)) {
      return false;
    }

    // 2) Table mode: se pooling ok, está aberto
    if (isTableMode) {
      return true;
    }

    // 3) Verifica se algum turno ativo cobre o momento atual
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 1 : now.getDay() + 1; // 1=domingo, 7=sábado
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const activeTurn = getActiveTurn(restaurantInfo.turns, currentDay, currentMinutes);
    return activeTurn !== null;
  };

  const isOpen = isRestaurantOpen();

  useEffect(() => {
    setIsRestaurantOpen(isOpen);
  }, [restaurantInfo, isOpen, setIsRestaurantOpen]);

  const logoSrc =
    (restaurantInfo?.logo ? `${config.baseURL}${restaurantInfo.logo}` : null) ||
    "https://via.placeholder.com/150?text=Logo+Restaurante";

  const activeTurns = Array.isArray(restaurantInfo.turns)
    ? restaurantInfo.turns.filter((t) => t.isActive)
    : [];

  // Backward compatibility: if new fields don't exist, use old logic
  const deliveryEnabled = restaurantInfo.deliveryEnabled ?? !restaurantInfo.onlyWithdraw;
  const pickupEnabled = restaurantInfo.pickupEnabled ?? restaurantInfo.onlyWithdraw ?? false;
  const eatHereEnabled = restaurantInfo.eatHereEnabled ?? false;

  // Constrói o mapeamento de dias e agrupa dias consecutivos
  const dayMap = buildDayScheduleMap(restaurantInfo.turns);
  const dayGroups = groupConsecutiveDays(dayMap);

  return (
    <div className="restaurant-info">
      <div className="restaurant-main-row">
        <div className="restaurant-logo-container">
          <img
            src={logoSrc}
            alt={`${restaurantInfo.name} Logo`}
            className="restaurant-logo"
          />
        </div>

        <div className="restaurant-details">
          <h2 className="restaurant-name">{toTitleCase(restaurantInfo.name)}</h2>
          <p className={`status ${isOpen ? "open" : "closed"}`}>
            {isOpen ? "Aberto 🟢" : "Fechado 🔴"}
          </p>
        </div>
      </div>

      <div className="restaurant-info-row">
        {/* Tipos de serviço */}
        {!isTableMode && (
          <div className="info">
            <FiMapPin size={16} />
            <span>
              <strong>Serviços:</strong>{" "}
              {deliveryEnabled && "Entrega"}
              {deliveryEnabled && pickupEnabled && " / "}
              {pickupEnabled && "Retirada"}
              {eatHereEnabled && ((deliveryEnabled || pickupEnabled) && " / ")}
              {eatHereEnabled && "Comer no local"}
            </span>
          </div>
        )}

        {/* Turnos agrupados por dias — só mostra se NÃO estiver em modo mesa */}
        {!isTableMode &&
          dayGroups.map(group => (
            <div key={`${group.startDay}-${group.endDay}`} className="info">
              <FiClock size={16} />
              <span>
                <strong>
                  {group.startDay === group.endDay 
                    ? DAY_NAMES[group.startDay]
                    : `${DAY_NAMES[group.startDay]} a ${DAY_NAMES[group.endDay]}`
                  }:
                </strong>
                {" "}
                {group.schedules.map((s, i) => (
                  <span key={i}>
                    {i > 0 && ", "}
                    {formatTime(s.start)}–{formatTime(s.end)}
                  </span>
                ))}
              </span>
            </div>
          ))}

        {restaurantInfo.deliveryTime && (
          <div className="info">
            <FiClock size={16} />
            <span>{restaurantInfo.deliveryTime} min</span>
          </div>
        )}

        {restaurantInfo.address && (
          <div className="info">
            <FiMapPin size={16} />
            <span>{restaurantInfo.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantInfo;
