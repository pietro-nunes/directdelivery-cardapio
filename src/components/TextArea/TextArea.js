import React from "react";

export default function Textarea({
  value,
  onChange,
  max = 80,
  placeholder = "Ex.: Sem cebola, sem ovo, etc.",
  id,
  className = "",
  textareaClassName = "observations-textarea",
  counterClassName = "obs-counter",
  warnAt = 10, // quando faltar <= warnAt, aplica classe "near-limit"
  rows = 3,
  disabled = false,
  name,
  ariaLabel,
}) {
  // Garante string para o controle do textarea
  const safeValue = typeof value === "string" ? value : "";
  const used = safeValue.length;
  const nearLimit = max - used <= warnAt;
  const counterId = id ? `${id}-counter` : undefined;

  const handleChange = (e) => {
    // Defesa: se por algum motivo e/target/value não existir, cai para string vazia
    const raw =
      (e && e.target && typeof e.target.value === "string") ? e.target.value : "";
    const next = raw.slice(0, max); // corta mesmo se colarem > max
    if (typeof onChange === "function") onChange(next);
  };

  return (
    <div className={`limited-textarea ${className}`}>
      <textarea
        id={id}
        name={name}
        className={textareaClassName}
        placeholder={placeholder}
        maxLength={max}
        rows={rows}
        value={safeValue}        
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        {...(counterId ? { "aria-describedby": counterId } : {})}
      />
      <div
        {...(counterId ? { id: counterId } : {})}
        className={`${counterClassName} ${nearLimit ? "near-limit" : ""}`}
        role="status"
        aria-live="polite"
      >
        {used}/{max} preenchidos
      </div>
    </div>
  );
}
