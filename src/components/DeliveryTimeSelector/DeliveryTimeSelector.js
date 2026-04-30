import React, { useState, useEffect } from "react";
import { MdSchedule, MdWatchLater } from "react-icons/md";
import "./DeliveryTimeSelector.css";

const DeliveryTimeSelector = ({ 
  selectedTime, 
  onTimeSelect, 
  tenantData,
  tipoEntrega 
}) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedOption, setSelectedOption] = useState("now"); // "now" ou "scheduled"

  useEffect(() => {
    generateTimeSlots();
  }, [tipoEntrega, tenantData.deliveryTime, tenantData.openingTime, tenantData.closingTime, tenantData.openingTime2, tenantData.closingTime2, tenantData.openingDays]);

  // ===========================================
  // HELPERS - Mesma lógica do RestaurantInfo.js
  // ===========================================
  
  const isZeroTime = (t) => {
    if (!t && t !== 0) return false;
    const s = String(t).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return false;
    const hh = m[1].padStart(2, "0");
    const mm = m[2];
    return hh === "00" && mm === "00";
  };

  const isDisabledShift = (open, close) => isZeroTime(open) && isZeroTime(close);

  const normalizeOpeningDays = (openingDays) => {
    if (Array.isArray(openingDays)) return openingDays;
    if (typeof openingDays === "string") {
      return openingDays.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  // Converte "HH:MM" para minutos desde meia-noite
  const timeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return null;
    const [h = 0, m = 0] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  // Verifica se um horário (em minutos) está dentro de um turno
  const isTimeInShift = (timeInMinutes, openTime, closeTime) => {
    if (!openTime || !closeTime) return false;
    if (isDisabledShift(openTime, closeTime)) return false;
    
    const openMin = timeToMinutes(openTime);
    const closeMin = timeToMinutes(closeTime);
    
    if (openMin === null || closeMin === null) return false;

    // Turno que vira o dia (ex: 22:00 - 02:00)
    if (closeMin < openMin) {
      return timeInMinutes >= openMin || timeInMinutes < closeMin;
    } else {
      return timeInMinutes >= openMin && timeInMinutes < closeMin;
    }
  };

  // Verifica se o restaurante está aberto em uma data/hora específica
  const isRestaurantOpenAt = (date) => {
    const dayOfWeek = date.getDay() === 0 ? 1 : date.getDay() + 1; // 1..7
    const timeInMinutes = date.getHours() * 60 + date.getMinutes();

    // Verifica dias de funcionamento
    const openingDays = normalizeOpeningDays(tenantData.openingDays);
    if (!openingDays.includes(dayOfWeek.toString())) {
      return false;
    }

    // Verifica se está no turno 1 ou turno 2
    const inShift1 = isTimeInShift(timeInMinutes, tenantData.openingTime, tenantData.closingTime);
    const inShift2 = isTimeInShift(timeInMinutes, tenantData.openingTime2, tenantData.closingTime2);

    return inShift1 || inShift2;
  };

  // Verifica se o serviço de entrega está disponível (com backward compatibility)
  const isDeliveryAvailable = () => {
    // New field takes precedence, fallback to old logic
    if (tenantData?.deliveryEnabled !== undefined) {
      return tenantData.deliveryEnabled === true;
    }
    // Backward compatibility: if onlyWithdraw is true, delivery is NOT available
    if (tenantData?.onlyWithdraw !== undefined) {
      return !tenantData.onlyWithdraw;
    }
    // Default: assume delivery is available
    return true;
  };

  // Obtém os horários de abertura e fechamento do dia atual
  const getShiftsForToday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 1 : now.getDay() + 1;
    const openingDays = normalizeOpeningDays(tenantData.openingDays);
    
    if (!openingDays.includes(dayOfWeek.toString())) {
      return []; // Não funciona hoje
    }

    const shifts = [];

    // Turno 1
    if (!isDisabledShift(tenantData.openingTime, tenantData.closingTime)) {
      const open1 = timeToMinutes(tenantData.openingTime);
      const close1 = timeToMinutes(tenantData.closingTime);
      if (open1 !== null && close1 !== null) {
        shifts.push({ open: open1, close: close1 });
      }
    }

    // Turno 2
    if (tenantData.openingTime2 && tenantData.closingTime2 && 
        !isDisabledShift(tenantData.openingTime2, tenantData.closingTime2)) {
      const open2 = timeToMinutes(tenantData.openingTime2);
      const close2 = timeToMinutes(tenantData.closingTime2);
      if (open2 !== null && close2 !== null) {
        shifts.push({ open: open2, close: close2 });
      }
    }

    return shifts;
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    
    // Tempo mínimo de preparo (em minutos)
    const preparationTime = tenantData.deliveryTime || 30;
    
    // Horário mínimo para agendamento
    const minTime = new Date(now.getTime() + preparationTime * 60000);
    
    // Arredonda para próxima meia hora
    minTime.setMinutes(Math.ceil(minTime.getMinutes() / 30) * 30);
    minTime.setSeconds(0);
    minTime.setMilliseconds(0);

    // 🔥 MUDANÇA: Só gera slots para HOJE
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Pega os turnos de hoje
    const shifts = getShiftsForToday();
    
    if (shifts.length === 0) {
      // Restaurante fechado hoje
      setAvailableSlots([]);
      return;
    }

    // Para cada turno, gera slots de 30 em 30 minutos
    shifts.forEach(({ open, close }) => {
      // Converte minutos para horas
      const startHour = Math.floor(open / 60);
      const startMinute = open % 60;
      const endHour = Math.floor(close / 60);
      const endMinute = close % 60;

      // 🔥 MUDANÇA: Não gera slots que viram o dia
      // Se o turno vira o dia (ex: 22:00 - 02:00), só considera até 23:59 de hoje
      if (close < open) {
        // Turno vira o dia - só gera até o fim do dia de hoje
        generateSlotsInRange(today, startHour, startMinute, 23, 59, minTime, slots);
      } else {
        // Turno normal no mesmo dia
        generateSlotsInRange(today, startHour, startMinute, endHour, endMinute, minTime, slots);
      }
    });

    setAvailableSlots(slots);
  };

  // Função auxiliar para gerar slots em um intervalo específico
  const generateSlotsInRange = (baseDate, startHour, startMinute, endHour, endMinute, minTime, slotsArray) => {
    for (let hour = startHour; hour <= endHour; hour++) {
      const minuteStart = (hour === startHour) ? Math.ceil(startMinute / 30) * 30 : 0;
      const minuteEnd = (hour === endHour) ? endMinute : 59;

      for (let minute = minuteStart; minute <= minuteEnd; minute += 30) {
        if (minute >= 60) continue;

        const slot = new Date(baseDate);
        slot.setHours(hour, minute, 0, 0);

        // Só adiciona se:
        // 1. Estiver no futuro (depois do minTime)
        // 2. Restaurante estiver aberto neste horário
        // 3. 🔥 NOVO: Ainda for hoje (não passou para amanhã)
        const now = new Date();
        const isStillToday = slot.getDate() === now.getDate() &&
                              slot.getMonth() === now.getMonth() &&
                              slot.getFullYear() === now.getFullYear();

        if (slot > minTime && isRestaurantOpenAt(slot) && isStillToday) {
          slotsArray.push(slot);
        }
      }
    }
  };

  const formatTimeSlot = (date) => {
    // 🔥 MUDANÇA: Formato simplificado (só mostra hora, já que é sempre hoje)
    return date.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const handleOptionChange = (option) => {
    setSelectedOption(option);
    
    if (option === "now") {
      onTimeSelect(null); // null = entrega o mais rápido possível
    }
  };

  const handleTimeSlotClick = (slot) => {
    setSelectedOption("scheduled");
    onTimeSelect(slot);
  };

  const estimatedTime = tenantData.deliveryTime > 0 ? `${tenantData.deliveryTime} min` : null;

  return (
    <div className="delivery-time-selector">
      <h2>Quando deseja receber?</h2>

      {/* Opção: Agora (o mais rápido possível) - só aparece se deliveryEnabled */}
      {isDeliveryAvailable() && (
        <div 
          className={`time-option-card ${selectedOption === "now" ? "selected" : ""}`}
          onClick={() => handleOptionChange("now")}
        >
          <div className="card-header-row">
            <MdWatchLater size={24} className="card-icon" />
            <div className="card-content">
              <strong>O mais rápido possível</strong>
              {estimatedTime && <p>Estimativa: {estimatedTime}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Opção: Agendar horário - só aparece se deliveryEnabled */}
      {isDeliveryAvailable() && (
        <div 
          className={`time-option-card ${selectedOption === "scheduled" ? "selected" : ""}`}
          onClick={() => handleOptionChange("scheduled")}
        >
          <div className="card-header-row">
            <MdSchedule size={24} className="card-icon" />
            <div className="card-content">
              <strong>Agendar para hoje</strong>
              <p>Escolha o horário de entrega</p>
            </div>
          </div>

          {/* Lista de horários (aparece quando "scheduled" está selecionado) */}
          {selectedOption === "scheduled" && (
            <div className="time-slots-grid">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`time-slot-pill ${
                      selectedTime?.getTime() === slot.getTime() ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTimeSlotClick(slot);
                    }}
                  >
                    {formatTimeSlot(slot)}
                  </button>
                ))
              ) : (
                <p className="no-slots-message">
                  Não há horários disponíveis para agendamento hoje.
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {selectedOption === "scheduled" && !selectedTime && availableSlots.length > 0 && (
        <p className="helper-text">⚠️ Selecione um horário acima</p>
      )}
    </div>
  );
};

export default DeliveryTimeSelector;
