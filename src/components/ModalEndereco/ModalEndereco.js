import React, { useState, useEffect } from "react";
import { Bounce, toast } from "react-toastify";
import "./ModalEndereco.css";

const ModalEndereco = ({
  isVisible,
  onClose,
  onAddressSubmit,
  enderecoAtual,
  tenantData,
  enderecos = [], // Define um valor padrão vazio
}) => {
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [ptReferencia, setPtReferencia] = useState("");
  const [apelidoEndereco, setApelidoEndereco] = useState("");
  const [tipoEndereco, setTipoEndereco] = useState("casa");
  const [bairroId, setBairroId] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0); // Para armazenar a taxa de entrega
  const [isNewEndereco, setIsNewEndereco] = useState(false); // Para controlar se é um novo endereço

  useEffect(() => {
    if (isVisible && enderecoAtual) {
      setEndereco(enderecoAtual.endereco || "");
      setNumero(enderecoAtual.numero || "");
      setBairro(enderecoAtual.bairro || "");
      setBairroId(enderecoAtual.bairroId || null);
      setComplemento(enderecoAtual.complemento || "");
      setCidade(enderecoAtual.cidade || "");
      setCep(enderecoAtual.cep || "");
      setPtReferencia(enderecoAtual.pontoReferencia || "");
      setApelidoEndereco(enderecoAtual.apelido || "");
      setTipoEndereco(enderecoAtual.tipo || "casa");
      setDeliveryFee(enderecoAtual.deliveryFee || 0); // Carrega a taxa de entrega, se existir
      setIsNewEndereco(false); // Se estamos editando um endereço existente, é falso
    } else {
      // Se o modal é aberto para adicionar um novo endereço
      setEndereco("");
      setNumero("");
      setBairro("");
      setComplemento("");
      setCidade("");
      setCep("");
      setPtReferencia("");
      setApelidoEndereco("");
      setTipoEndereco("casa");
      setDeliveryFee(0);
      setBairroId(null);
      setIsNewEndereco(true); // Marca como novo endereço
    }
  }, [isVisible, enderecoAtual]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!endereco || !numero || !bairro || !cidade) {
      toast.warn("Por favor, preencha todos os campos obrigatórios.", {
        theme: "colored",
        transition: Bounce,
      });
      return; // Não submete se os campos obrigatórios estiverem vazios
    }

    const enderecoCompleto = {
      tipo: tipoEndereco,
      apelido: apelidoEndereco,
      endereco,
      numero,
      bairro,
      bairroId,
      complemento,
      cidade,
      cep,
      pontoReferencia: ptReferencia,
      deliveryFee, // Adiciona a taxa de entrega selecionada
    };

    onAddressSubmit(enderecoCompleto); // Salva o endereço e a taxa de entrega
    onClose(); // Fecha o modal
  };

  const handleApelidoChange = (e) => {
    const apelidoSelecionado = e.target.value;
    setApelidoEndereco(apelidoSelecionado);

    // Encontra o endereço salvo baseado no apelido selecionado
    const enderecoSelecionado = enderecos.find(
      (end) => end.nickname === apelidoSelecionado
    );
    if (enderecoSelecionado) {
      setEndereco(enderecoSelecionado.address || "");
      setNumero(enderecoSelecionado.number || "");
      setBairro(enderecoSelecionado.neighborhood.name || "");
      setComplemento(enderecoSelecionado.complement || "");
      setCidade(enderecoSelecionado.city.name || "");
      setCep(enderecoSelecionado.zipcode || "");
      setPtReferencia(enderecoSelecionado.referencePoint || "");

      // Atualiza a taxa de entrega baseada no bairro do endereço selecionado
      const neighborhood = tenantData?.neighborhoods?.find(
        (n) => n.name === enderecoSelecionado.neighborhood.name
      );
      setDeliveryFee(neighborhood?.deliveryFee || 0);
    }
  };

  const handleBairroChange = (e) => {
    const selectedBairro = e.target.value;
    setBairro(selectedBairro);

    // Atualiza a taxa de entrega com base no bairro selecionado
    const neighborhood = tenantData?.neighborhoods?.find(
      (n) => n.name === selectedBairro
    );
    setDeliveryFee(neighborhood?.deliveryFee || 0);
    setBairroId(neighborhood?.id || null)
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

          {/* Botão para adicionar um novo endereço */}
          <button
            type="button"
            className="add-new-button" 
            onClick={() => {
              setEndereco(""); // Limpa os campos
              setNumero("");
              setBairro("");
              setComplemento("");
              setCidade("");
              setCep("");
              setPtReferencia("");
              setApelidoEndereco("");
              setTipoEndereco("casa"); // Define o tipo padrão
              setDeliveryFee(0); // Zera a taxa de entrega
              setIsNewEndereco(true); // Marca como novo endereço
            }}
          >
            Adicionar Novo Endereço
          </button>


          {/* Condicional para exibir o select de endereço salvo ou não */}
          {!isNewEndereco && enderecos?.length > 0 && (
            <select
              value={apelidoEndereco}
              onChange={handleApelidoChange}
              required
            >
              <option value="">Selecione um endereço salvo</option>
              {enderecos.map((end) => (
                <option key={end.id} value={end.nickname}>
                  {end.nickname}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={apelidoEndereco || ""}
            onChange={(e) => setApelidoEndereco(e.target.value)}
            placeholder="Apelido do endereço (obrigatório)"
            required
          />
          <input
            type="text"
            value={endereco || ""}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço"
            required
          />
          <input
            type="text"
            value={numero || ""}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número"
            required
          />

          {/* Select de bairros com taxa de entrega */}
          {tenantData?.neighborhoods?.length > 0 && (
            <select
              value={bairro}
              onChange={handleBairroChange}
              required
            >
              <option value="">Selecione um bairro</option>
              {tenantData.neighborhoods.map((neighborhood) => (
                <option key={neighborhood.id} value={neighborhood.name}>
                  {neighborhood.name} - Taxa: R$ {Number(neighborhood.deliveryFee).toFixed(2)}
                </option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={complemento || ""}
            onChange={(e) => setComplemento(e.target.value)}
            placeholder="Complemento"
          />
          <input
            type="text"
            value={cidade || ""}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            required
          />
          <input
            type="text"
            value={cep || ""}
            onChange={(e) => setCep(e.target.value)}
            placeholder="CEP"
            required
          />
          <input
            type="text"
            value={ptReferencia || ""}
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
