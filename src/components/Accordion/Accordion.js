import React, { useState } from "react";
import "./Accordion.css"; // Crie um arquivo CSS para o componente se necessário

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false); // Acordeão sempre aberto por padrão

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="accordion-section">
      <button className="accordion-button" onClick={toggleAccordion}>
        {isOpen ? `Ocultar ${title}` : title}
      </button>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};

export default Accordion;
