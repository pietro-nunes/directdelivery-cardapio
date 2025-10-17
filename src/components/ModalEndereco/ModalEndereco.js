import React, { useState, useEffect } from "react";
import { Bounce, toast } from "react-toastify";
import "./ModalEndereco.css";
import MaskedInput from "react-text-mask";
import { formatarNumero } from "../../utils/functions";


const ModalEndereco = ({
  isVisible,
  onClose,
  onAddressSubmit,
  enderecoAtual,
  tenantData,
  enderecos = [],
}) => {
  const CEP_REGEX = /^\d{5}-\d{3}$/;
  const [form, setForm] = useState({
    endereco: "",
    numero: "",
    bairro: "",
    complemento: "",
    cidade: "",
    cep: "",
    ptReferencia: "",
    apelidoEndereco: "",
    tipoEndereco: "casa",
  });
  const [bairroId, setBairroId] = useState(null);
  const [cidadeId, setCidadeId] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [showAddressList, setShowAddressList] = useState(true);
  const [selectedEndereco, setSelectedEndereco] = useState(
    enderecoAtual || null
  );
  const cepMask = [/\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/];

  // obter cidade selecionada
  const selectedCity = tenantData?.cities?.find((c) => c.name === form.cidade);

  // filtrar bairros da cidade
  const neighborhoodsByCity = selectedCity
    ? (tenantData?.neighborhoods || []).filter(
        (n) =>
          String(n.cityId) === String(selectedCity.id) && n.isActive !== false
      )
    : [];

  useEffect(() => {
    if (isVisible) {
      if (enderecos.length > 0) {
        setShowAddressList(true);
        setSelectedEndereco(enderecoAtual || null);
        if (enderecoAtual) {
          preencherFormComEndereco(enderecoAtual);
          setShowAddressList(false);
        }
      } else {
        setShowAddressList(false);
        resetForm();
      }
    }
  }, [isVisible, enderecos, enderecoAtual]);

  const resetForm = () => {
    setForm({
      endereco: "",
      numero: "",
      bairro: "",
      complemento: "",
      cidade: "",
      cep: "",
      ptReferencia: "",
      apelidoEndereco: "",
      tipoEndereco: "casa",
    });
    setDeliveryFee(0);
    setBairroId(null);
    setCidadeId(null);
    setSelectedEndereco(null);
  };

  const preencherFormComEndereco = (end) => {
    setForm({
      endereco: end.address || "",
      numero: end.number || "",
      bairro: end.neighborhood?.name || "",
      complemento: end.complement || "",
      cidade: end.city?.name || "",
      cep: end.zipcode || "",
      ptReferencia: end.referencePoint || "",
      apelidoEndereco: end.nickname || "",
      id: end.id,
    });

    const n = tenantData?.neighborhoods?.find(
      (n) => n.name === end.neighborhood?.name
    );
    const c = tenantData?.cities?.find((c) => c.name === end.city?.name);
    setDeliveryFee(n?.deliveryFee || 0);
    setBairroId(n?.id || null);
    setCidadeId(c?.id || null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { endereco, numero, bairro, cidade, apelidoEndereco } = form;
    if (!endereco || !numero || !bairro || !cidade || !apelidoEndereco) {
      toast.warn("Por favor, preencha todos os campos obrigatórios.", {
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    onAddressSubmit({
      ...form,
      bairroId,
      cidadeId,
      deliveryFee,
      pontoReferencia: form.ptReferencia,
    });
  };

  const handleEnderecoCardClick = (end) => {
    preencherFormComEndereco(end);
    setShowAddressList(false);
    setSelectedEndereco(end);
  };

  const handleBairroChange = (e) => {
    const name = e.target.value;
    setForm({ ...form, bairro: name });
    const n = tenantData?.neighborhoods?.find((n) => n.name === name);
    setDeliveryFee(n?.deliveryFee || 0);
    setBairroId(n?.id || null);
  };

  const handleCidadeChange = (e) => {
    const name = e.target.value;
    setForm({ ...form, cidade: name });
    const c = tenantData?.cities?.find((c) => c.name === name);
    setCidadeId(c?.id || null);
  };

  if (!isVisible) return null;

  return (
    <div className="end__modal-overlay">
      <div className="end__modal-content">
        <h4 className="modal-title">
          {showAddressList ? "Selecione um Endereço" : "Detalhes do Endereço"}
        </h4>

        {showAddressList && enderecos.length > 0 && (
          <div className="address-list">
            <p className="address-instruction">
              Escolha um de seus endereços salvos para a entrega:
            </p>
            {enderecos.map((end) => (
              <div
                key={end.id}
                className={`address-card ${
                  selectedEndereco?.id === end.id ? "selected" : ""
                }`}
                onClick={() => handleEnderecoCardClick(end)}
              >
                <strong>{end.nickname}</strong>
                <p>
                  {end.address}, {end.number}
                </p>
                <small>
                  {end.neighborhood.name} - {end.city.name}
                </small>
              </div>
            ))}
            <button
              type="button"
              className="add-new-address-button"
              onClick={() => {
                resetForm();
                setShowAddressList(false);
              }}
            >
              + Adicionar Novo Endereço
            </button>
            <button
              type="button"
              className="back-to-list-button"
              onClick={onClose}
            >
              Voltar
            </button>
          </div>
        )}

        {!showAddressList && (
          <form className="formModal" onSubmit={handleSubmit}>
            <div className="form-fields">
              <label className="input-label">Apelido do Endereço:</label>
              <input
                type="text"
                maxLength={40}
                name="apelidoEndereco"
                value={form.apelidoEndereco}
                onChange={handleChange}
                required
              />
              <label className="input-label">Endereço:</label>
              <input
                maxLength={45}
                type="text"
                name="endereco"
                value={form.endereco}
                onChange={handleChange}
                required
              />
              <label className="input-label">Número:</label>
              <input
                type="number"
                name="numero"
                max="99999"
                value={form.numero}
                onChange={handleChange}
                required
              />
              <label className="input-label">Complemento:</label>
              <input
                maxLength={40}
                type="text"
                name="complemento"
                value={form.complemento}
                onChange={handleChange}
              />
              <label className="input-label">Cidade:</label>
              <select
                value={form.cidade}
                onChange={handleCidadeChange}
                className="custom-combo"
                required
              >
                <option value="" disabled hidden>
                  Selecione uma cidade
                </option>
                {tenantData?.cities?.map(
                  (c) =>
                    c.isActive && (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    )
                )}
              </select>
              <label className="input-label">CEP:</label>
              <MaskedInput
                mask={cepMask} // [/\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/]
                value={form.cep}
                onChange={(e) => setForm({ ...form, cep: e.target.value })}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (!CEP_REGEX.test(v)) {
                    e.target.setCustomValidity(
                      "Preencha o CEP completo (#####-###)."
                    );
                  } else {
                    e.target.setCustomValidity("");
                  }
                }}
                onInput={(e) => e.target.setCustomValidity("")} // limpa erro enquanto digita
                placeholder="CEP (XXXXX-XXX)"
                className="masked-input"
                required
                inputMode="numeric"
                pattern="\d{5}-\d{3}" // força o formato no HTML5
              />
              <label className="input-label">Bairro:</label>
              <select
                value={form.bairro}
                onChange={handleBairroChange}
                className="custom-combo"
                required
              >
                <option value="" disabled hidden>
                  Selecione um bairro
                </option>
                {neighborhoodsByCity.map((n) => (
                  <option key={n.id} value={n.name}>
                    {n.name} - R$ {formatarNumero(n.deliveryFee)}
                  </option>
                ))}
              </select>
              <label className="input-label">Taxa de Entrega:</label>
              <div className="delivery-fee-display">
                R$ {formatarNumero(deliveryFee)}
              </div>
              <label className="input-label">Ponto de Referência:</label>
              <input
                maxLength={40}
                type="text"
                name="ptReferencia"
                value={form.ptReferencia}
                onChange={handleChange}
              />
            </div>

            <div className="modal-buttons-row">
              <button
                type="button"
                className="back-to-list-button"
                onClick={() => {
                  if (enderecos.length > 0) {
                    setShowAddressList(true);
                  } else {
                    onClose();
                  }

                  resetForm();
                }}
              >
                Voltar
              </button>
              <button type="submit" className="confirm-button">
                Confirmar Endereço
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalEndereco;
