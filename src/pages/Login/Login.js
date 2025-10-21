import React, { useState } from "react";
import MaskedInput from "react-text-mask";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import { formatCPF, isValidCPF, onlyDigits } from "../../utils/functions";

const Login = ({ onLogin, basePath, tenantData, isTableMode }) => {
  const [username, setUsername] = useState("");
  const [number, setNumber] = useState("");
  const [cpf, setCPF] = useState("");
  const [error, setError] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [clientExists, setClientExists] = useState(false);
  const navigate = useNavigate();
  const { fetchWithLoading } = useFetchWithLoading();

  // Se for mesa (table mode), não exigimos CPF
  const needsCpf = !isTableMode;

  const phoneMask = [
    "(",
    /[1-9]/,
    /\d/,
    ")",
    " ",
    /[9]/,
    " ",
    /\d/,
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
    /\d/,
    /\d/,
  ];

  const cpfMask = [
    /\d/,
    /\d/,
    /\d/,
    ".",
    /\d/,
    /\d/,
    /\d/,
    ".",
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/,
    /\d/,
  ];

  const cleanPhoneNumber = (phone) => phone.replace(/\D/g, "");

  const validateCpfField = (value) => {
    if (!needsCpf) {
      setCpfError("");
      return;
    }
    const digits = onlyDigits(value);
    if (digits.length === 11 && !isValidCPF(value)) {
      setCpfError("CPF inválido. Verifique os números e tente novamente.");
    } else {
      setCpfError("");
    }
  };

  const checkClientExists = async () => {
    const cleanedNumber = cleanPhoneNumber(number);
    if (!cleanedNumber || cleanedNumber.length < 11) return;

    try {
      const response = await fetchWithLoading(
        `${config.baseURL}/customers/${tenantData.id}/phone/${cleanedNumber}`
      );
      const data = await response.json();
      setClientExists(true);
      setUsername(data.name || "");
      // Só preenche/valida CPF se for necessário neste modo
      if (needsCpf && data.cpf) {
        setCPF(formatCPF(data.cpf));
        setCpfError("");
      } else {
        setCPF("");
        setCpfError("");
      }
    } catch {
      setClientExists(false);
      setUsername("");
      setCPF("");
      setCpfError("");
    }
  };

  const buildCustomerPayload = ({ name, phone, cpfValue, tenantId }) => {
    const payload = { name, phone, tenantId };
    if (needsCpf) {
      payload.cpf = onlyDigits(cpfValue);
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanedNumber = cleanPhoneNumber(number);

    // validações de preenchimento mínimas
    if (!username || username.trim().length < 3 || !cleanedNumber) {
      setError("Por favor, preencha todos os campos corretamente.");
      return;
    }

    // validação específica do CPF (somente quando necessário)
    if (needsCpf && !isValidCPF(cpf)) {
      setCpfError("CPF inválido. Verifique os números e tente novamente.");
      return;
    }

    try {
      const response = await fetchWithLoading(
        `${config.baseURL}/customers/${tenantData.id}/phone/${cleanedNumber}`
      );

      // Se não existe, cria
      if (response.headers.get("Content-Length") === "0") {
        const postResponse = await fetchWithLoading(
          `${config.baseURL}/customers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              buildCustomerPayload({
                name: username,
                phone: cleanedNumber,
                cpfValue: cpf,
                tenantId: tenantData.id,
              })
            ),
          }
        );

        if (postResponse.ok) {
          const data = await postResponse.json();
          const tokenData = JSON.stringify(data);
          onLogin(tokenData);
          navigate(`${basePath}/checkout`);
        } else {
          throw new Error("Erro ao cadastrar o cliente.");
        }
        return;
      }

      // Se já existe, atualiza se necessário
      const data = await response.json();

      const needsUpdate =
        data.name !== username ||
        (needsCpf ? data.cpf !== onlyDigits(cpf) : false);

      if (needsUpdate) {
        const putResponse = await fetchWithLoading(
          `${config.baseURL}/customers/${data.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              buildCustomerPayload({
                name: username,
                phone: cleanedNumber,
                cpfValue: cpf,
                tenantId: tenantData.id,
              })
            ),
          }
        );

        if (!putResponse.ok) {
          throw new Error("Erro ao atualizar o cliente.");
        }

        const updated = await putResponse.json();
        const tokenData = JSON.stringify(updated);
        onLogin(tokenData);
        navigate(`${basePath}/checkout`);
        return;
      }

      const tokenData = JSON.stringify(data);
      onLogin(tokenData);
      navigate(`${basePath}/checkout`);
    } catch (err) {
      console.error("Erro na consulta à API:", err);
      setError("Erro ao se conectar com o servidor. Tente novamente.");
    }
  };

  // Botão desabilita por CPF somente quando needsCpf = true
  const isButtonDisabled =
    username.trim().length < 3 || (needsCpf && !isValidCPF(cpf));

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Identificação</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Qual seu número de telefone?</label>
            <MaskedInput
              mask={phoneMask}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onBlur={checkClientExists}
              placeholder="(XX) 9 XXXX-XXXX"
              className="masked-input"
            />
          </div>

          <div className="input-group">
            <label>Nome e sobrenome:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          {/* CPF/CNPJ só aparece quando não estiver em modo mesa */}
          {needsCpf && (
            <div className="input-group">
              <label>CPF:</label>
              <MaskedInput
                mask={cpfMask}
                value={cpf}
                onChange={(e) => {
                  setCPF(e.target.value);
                  validateCpfField(e.target.value);
                }}
                onBlur={(e) => validateCpfField(e.target.value)}
                placeholder="XX.XXX.XXX-XX"
                className={`masked-input ${cpfError ? "input-error" : ""}`}
              />
              {cpfError && <p className="error">{cpfError}</p>}
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            className={`login-button ${isButtonDisabled ? "disabled" : ""}`}
            disabled={isButtonDisabled}
          >
            Avançar
          </button>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(`${basePath}`)}
            aria-label="Voltar ao cardápio"
          >
            Voltar ao cardápio
          </button>
        </form>

        {isButtonDisabled && !cpfError && (
          <p className="info-message">
            Para concluir o pedido, pedimos que se identifique
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
