import React, { useState, useEffect } from "react";
import "./ModalEndereco.css"; // Certifique-se de ter um CSS para estilizar o modal

const ModalEndereco = ({
  isVisible,
  onClose,
  onAddressSubmit,
  enderecoAtual,
}) => {
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [ptReferencia, setPtReferencia] = useState("");
  const [apelidoEndereco, setApelidoEndereco] = useState("");
  const [tipoEndereco, setTipoEndereco] = useState("casa"); // Tipo de endereço padrão

  // Efeito para preencher os campos quando o modal é aberto
  useEffect(() => {
    if (isVisible && enderecoAtual) {
      setEndereco(enderecoAtual.endereco || ""); // Preenche o campo ou define como string vazia
      setNumero(enderecoAtual.numero || "");
      setBairro(enderecoAtual.bairro || "");
      setComplemento(enderecoAtual.complemento || "");
      setCidade(enderecoAtual.cidade || "");
      setCep(enderecoAtual.cep || "");
      setPtReferencia(enderecoAtual.pontoReferencia || "");
      setApelidoEndereco(enderecoAtual.apelido || "");
      setTipoEndereco(enderecoAtual.tipo || "casa"); // Tipo padrão
    } else {
      // Reseta os campos se o modal não estiver visível
      setEndereco("");
      setNumero("");
      setBairro("");
      setComplemento("");
      setCidade("");
      setCep("");
      setPtReferencia("");
      setApelidoEndereco("");
      setTipoEndereco("casa");
    }
  }, [isVisible, enderecoAtual]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const enderecoCompleto = {
      tipo: tipoEndereco,
      apelido: apelidoEndereco,
      endereco,
      numero,
      bairro,
      complemento,
      cidade,
      cep,
      pontoReferencia: ptReferencia,
    };
    onAddressSubmit(enderecoCompleto); // Passa o endereço completo para o componente pai
    onClose(); // Fecha o modal após o envio
  };

  if (!isVisible) return null;

  return (
    <div className="end__modal-overlay">
      <div className="end__modal-content">
        <div className="back-button-mobile" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="black"
            className="back-icon-mobile"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12H3m0 0l6-6m-6 6l6 6"
            />
          </svg>
        </div>
        <form onSubmit={handleSubmit}>
          <h4>Digite o endereço de entrega</h4>

          <select
            value={tipoEndereco}
            onChange={(e) => setTipoEndereco(e.target.value)}
            required
          >
            <option value="casa">Casa</option>
            <option value="trabalho">Trabalho</option>
            <option value="outra">Outra</option>
          </select>
          <input
            type="text"
            value={apelidoEndereco}
            onChange={(e) => setApelidoEndereco(e.target.value)}
            placeholder="Apelido do endereço (obrigatório)"
            required
          />
          <input
            type="text"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço"
            required
          />
          <input
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número"
            required
          />
          <select
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            required
          >
            <option value="">Selecione o bairro</option>
            <option value="capao">Centro</option>
            <option value="xgla">Xangri-lá</option>
          </select>
          <input
            type="text"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
            placeholder="Complemento"
          />
          <input
            type="text"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            required
          />
          <input
            type="text"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="CEP"
            required
          />
          <input
            type="text"
            value={ptReferencia}
            onChange={(e) => setPtReferencia(e.target.value)}
            placeholder="Ponto de referência"
          />
          <div className="modal-buttons">
            <button type="submit">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEndereco;
