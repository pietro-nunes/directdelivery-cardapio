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
  const [isNewEndereco, setIsNewEndereco] = useState(false);
  const cepMask = [/\d/, /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/];

  useEffect(() => {
    if (isVisible) {
      if (enderecoAtual) {
        setForm({
          endereco: enderecoAtual.endereco || "",
          numero: enderecoAtual.numero || "",
          bairro: enderecoAtual.bairro || "",
          complemento: enderecoAtual.complemento || "",
          cidade: enderecoAtual.cidade || "",
          cep: enderecoAtual.cep || "",
          ptReferencia: enderecoAtual.pontoReferencia || "",
          apelidoEndereco: enderecoAtual.apelido || "",
          tipoEndereco: enderecoAtual.tipo || "casa",
        });
        setDeliveryFee(enderecoAtual.deliveryFee || 0);
        setBairroId(enderecoAtual.bairroId || null);
        setCidadeId(enderecoAtual.cidadeId || null);
        setIsNewEndereco(false);
      } else {
        resetForm();
        setIsNewEndereco(true);
      }
    }
  }, [isVisible]);

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
    onClose();
  };

  const handleEnderecoCardClick = (end) => {
    setForm({
      endereco: end.address || "",
      numero: end.number || "",
      bairro: end.neighborhood.name || "",
      complemento: end.complement || "",
      cidade: end.city.name || "",
      cep: end.zipcode || "",
      ptReferencia: end.referencePoint || "",
      apelidoEndereco: end.nickname,
      tipoEndereco: "casa",
    });

    const n = tenantData?.neighborhoods?.find(
      (n) => n.name === end.neighborhood.name
    );
    const c = tenantData?.cities?.find((c) => c.name === end.city.name);
    setDeliveryFee(n?.deliveryFee || 0);
    setBairroId(n?.id || null);
    setCidadeId(c?.id || null);
    setIsNewEndereco(false);
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
          <h4>Endereço de Entrega</h4>
          <p className="address-instruction">
            Selecione um endereço salvo abaixo ou clique em "Novo Endereço"
          </p>

          {!isNewEndereco && enderecos.length > 0 && (
            <div className="address-list">
              {enderecos.map((end) => (
                <div
                  key={end.id}
                  className={`address-card ${
                    form.apelidoEndereco === end.nickname ? "selected" : ""
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
            </div>
          )}

          <div
            className={`form-fields ${
              isNewEndereco || form.apelidoEndereco ? "visible" : "hidden"
            }`}
          >
            <label className="input-label">Apelido:</label>
            <input
              type="text"
              name="apelidoEndereco"
              value={form.apelidoEndereco}
              onChange={handleChange}
              required
            />

            <label className="input-label">Endereço:</label>
            <input
              type="text"
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
              required
            />

            <label className="input-label">Número:</label>
            <input
              type="text"
              name="numero"
              value={form.numero}
              onChange={handleChange}
              required
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
              {tenantData?.neighborhoods?.map((n) => (
                <option key={n.id} value={n.name}>
                  {n.name} - R$ {formatarNumero(n.deliveryFee)}
                </option>
              ))}
            </select>

            <label className="input-label">Complemento:</label>
            <input
              type="text"
              name="complemento"
              value={form.complemento}
              onChange={handleChange}
            />

            <label className="input-label">Taxa de Entrega:</label>
            <div className="delivery-fee-display">
              R$ {formatarNumero(deliveryFee)}
            </div>

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
              mask={cepMask}
              value={form.cep}
              onChange={(e) => setForm({ ...form, cep: e.target.value })}
              placeholder="CEP (XXXXX-XXX)"
              className="masked-input"
            />

            <label className="input-label">Ponto de Referência:</label>
            <input
              type="text"
              name="ptReferencia"
              value={form.ptReferencia}
              onChange={handleChange}
            />
          </div>

          <div className="modal-buttons-row">
            <button
              type="button"
              className="add-new-button green"
              onClick={() => {
                resetForm();
                setIsNewEndereco(true);
              }}
            >
              Novo Endereço
            </button>
            <button type="submit" className="confirm-button">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEndereco;
