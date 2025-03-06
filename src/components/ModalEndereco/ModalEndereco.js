import React, { useState, useEffect } from "react";
import { Bounce, toast } from "react-toastify";
import "./ModalEndereco.css";
import MaskedInput from "react-text-mask"; // Biblioteca para máscara
import { formatarNumero } from "../../utils/functions";

const ModalEndereco = ({
  isVisible,
  onClose,
  onAddressSubmit,
  enderecoAtual,
  tenantData,
  enderecos = [],
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
  const [cidadeId, setcidadeId] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isNewEndereco, setIsNewEndereco] = useState(false);
  const cepMask = [/\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/];

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
      setDeliveryFee(enderecoAtual.deliveryFee || 0);
      setIsNewEndereco(false);
    } else {
      resetForm();
      setIsNewEndereco(true);
    }
  }, [isVisible, enderecoAtual]);

  const resetForm = () => {
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!endereco || !numero || !bairro || !cidade || !apelidoEndereco) {
      toast.warn("Por favor, preencha todos os campos obrigatórios.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
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
      cidadeId,
      cep,
      pontoReferencia: ptReferencia,
      deliveryFee,
    };

    onAddressSubmit(enderecoCompleto);
    onClose();
  };

  const handleApelidoChange = (e) => {
    const apelidoSelecionado = e.target.value;
    setApelidoEndereco(apelidoSelecionado);

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

      const neighborhood = tenantData?.neighborhoods?.find(
        (n) => n.name === enderecoSelecionado.neighborhood.name
      );
      setDeliveryFee(neighborhood?.deliveryFee || 0);
      setBairroId(neighborhood?.id || null);
    }
  };

  const handleBairroChange = (e) => {
    const selectedBairro = e.target.value;
    setBairro(selectedBairro);

    const neighborhood = tenantData?.neighborhoods?.find(
      (n) => n.name === selectedBairro
    );
    setDeliveryFee(neighborhood?.deliveryFee || 0);
    setBairroId(neighborhood?.id || null);
  };

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setCidade(selectedCity);

    const city = tenantData?.cities?.find(
      (n) => n.name === selectedCity
    );

    setcidadeId(city?.id || null);
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

        <form className="formModal" onSubmit={handleSubmit}>
          <h4>Digite o endereço de entrega</h4>
          <button
            type="button"
            className="add-new-button"
            onClick={() => {
              resetForm();
              setIsNewEndereco(true);
            }}
          >
            Adicionar Novo Endereço
          </button>
          {!isNewEndereco && enderecos?.length > 0 && (
            <select value={apelidoEndereco} onChange={handleApelidoChange} className="custom-combo">
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
            placeholder={isNewEndereco ? "Crie um apelido para o endereço" : "Apelido do endereço"}
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

          <select
            value={bairro}
            onChange={(e) => handleBairroChange(e)}
            className="custom-combo"
            required
          >
            <option value="" disabled hidden>
              Selecione um bairro
            </option>
            {tenantData?.neighborhoods?.map((neighborhood) => (
              <option key={neighborhood.id} value={neighborhood.name}>
                {neighborhood.name} - Taxa: R$ {formatarNumero(neighborhood.deliveryFee)}
              </option>
            ))}
          </select>

          <div className="delivery-fee-display">
            Taxa de Entrega: R$ {formatarNumero(deliveryFee)}
          </div>
          <input
            type="text"
            value={complemento || ""}
            onChange={(e) => setComplemento(e.target.value)}
            placeholder="Complemento"
          />
          <select
            value={cidade}
            onChange={(e) => handleCityChange(e)}
            className="custom-combo"
            required
          >
            <option value="" disabled hidden>
              Selecione uma cidade
            </option>
            {tenantData?.cities?.map((city) => (
              <option key={city.id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
          <MaskedInput
            mask={cepMask} // Máscara para CEP
            value={cep} // Valor do CEP
            onChange={(e) => setCep(e.target.value)} // Atualiza o estado com o valor digitado
            placeholder="XXXXX-XXX" // Placeholder com o formato esperado
            className="masked-input" // Classe para estilização
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
