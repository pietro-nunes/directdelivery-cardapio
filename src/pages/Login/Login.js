import React, { useState } from "react";
import MaskedInput from "react-text-mask";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import { formatCPF, isValidCPF, onlyDigits } from "../../utils/functions";

const Login = ({ onLogin, basePath, tenantData }) => {
  const [username, setUsername] = useState("");
  const [number, setNumber] = useState("");
  const [cpf, setCPF] = useState("");
  const [error, setError] = useState("");
  const [cpfError, setCpfError] = useState(""); // << novo estado
  const [clientExists, setClientExists] = useState(false);
  const navigate = useNavigate();
  const { fetchWithLoading } = useFetchWithLoading();

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
    // remove a máscara para validar corretamente
    const digits = onlyDigits(value);
    if (digits.length === 11 && !isValidCPF(value)) {
      setCpfError("CPF inválido. Verifique os números e tente novamente.");
    } else {
      // enquanto digita (ou se apagar), some com o erro
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
      setUsername(data.name);
      setCPF(formatCPF(data.cpf));
      setCpfError(""); // limpamos o erro caso venha CPF válido da API
    } catch {
      setClientExists(false);
      setUsername("");
      setCPF("");
      setCpfError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanedNumber = cleanPhoneNumber(number);

    // validações de preenchimento
    if (!username || username.trim().length < 3 || !cleanedNumber) {
      setError("Por favor, preencha todos os campos corretamente.");
      return;
    }

    // validação específica do CPF
    if (!isValidCPF(cpf)) {
      setCpfError("CPF inválido. Verifique os números e tente novamente.");
      return;
    }

    try {
      const response = await fetchWithLoading(
        `${config.baseURL}/customers/${tenantData.id}/phone/${cleanedNumber}`
      );

      if (response.headers.get("Content-Length") === "0") {
        const postResponse = await fetchWithLoading(
          `${config.baseURL}/customers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: username,
              phone: cleanedNumber,
              cpf: onlyDigits(cpf),
              tenantId: tenantData.id,
            }),
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
      } else {
        const data = await response.json();

        if (data.name !== username || data.cpf !== onlyDigits(cpf)) {
          const putResponse = await fetchWithLoading(
            `${config.baseURL}/customers/${data.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: username,
                phone: cleanedNumber,
                cpf: onlyDigits(cpf),
                tenantId: tenantData.id,
              }),
            }
          );

          if (putResponse.ok) {
            const updated = await putResponse.json();
            const tokenData = JSON.stringify(updated);
            onLogin(tokenData);
            navigate(`${basePath}/checkout`);
            return;
          } else {
            throw new Error("Erro ao atualizar o cliente.");
          }
        }

        const tokenData = JSON.stringify(data);
        onLogin(tokenData);
        navigate(`${basePath}/checkout`);
      }
    } catch (err) {
      console.error("Erro na consulta à API:", err);
      setError("Erro ao se conectar com o servidor. Tente novamente.");
    }
  };

  const isButtonDisabled = username.trim().length < 3 || !isValidCPF(cpf);

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

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            className={`login-button ${isButtonDisabled ? "disabled" : ""}`}
            disabled={isButtonDisabled}
          >
            Avançar
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
