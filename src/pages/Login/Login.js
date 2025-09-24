import React, { useState } from "react";
import MaskedInput from "react-text-mask";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";
import config from "../../config";
import { formatCPF, isValidCPF, onlyDigits } from "../../utils/functions";

const Login = ({ onLogin, basePath }) => {
  const [username, setUsername] = useState("");
  const [number, setNumber] = useState("");
  const [cpf, setCPF] = useState("");
  const [error, setError] = useState("");
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

  const cleanPhoneNumber = (phone) => {
    return phone.replace(/\D/g, "");
  };

  const checkClientExists = async () => {
    const cleanedNumber = cleanPhoneNumber(number);
    if (!cleanedNumber || cleanedNumber.length < 11) return;

    try {
      const response = await fetchWithLoading(
        `${config.baseURL}/customers/phone/${cleanedNumber}`
      );
      const data = await response.json();
      setClientExists(true);
      setUsername(data.name);
      setCPF(formatCPF(data.cpf));
    } catch (error) {
      setClientExists(false);
      setUsername("");
      setCPF("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedNumber = cleanPhoneNumber(number);

    if (!username || username.trim().length < 3 || !cleanedNumber) {
      setError("Por favor, preencha todos os campos corretamente.");
      return;
    }

    try {
      const response = await fetchWithLoading(
        `${config.baseURL}/customers/phone/${cleanedNumber}`
      );

      if (response.headers.get("Content-Length") === "0") {
        const postResponse = await fetchWithLoading(
          `${config.baseURL}/customers`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: username,
              phone: cleanedNumber,
              cpf: cpf,
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
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: username,
                phone: cleanedNumber,
                cpf: onlyDigits(cpf),
              }),
            }
          );

          if (putResponse.ok) {
            const data = await putResponse.json();
            const tokenData = JSON.stringify(data);
            onLogin(tokenData);
            navigate(`${basePath}/checkout`);
          } else {
            throw new Error("Erro ao atualizar o cliente.");
          }
        }

        const tokenData = JSON.stringify(data);
        onLogin(tokenData);
        navigate(`${basePath}/checkout`);
      }
    } catch (error) {
      console.error("Erro na consulta à API:", error);
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
              onChange={(e) => setCPF(e.target.value)}
              placeholder="XX.XXX.XXX-XX"
              className="masked-input"
            />
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
        <p className="info-message">
          Para concluir o pedido, pedimos que se identifique
        </p>
      </div>
    </div>
  );
};

export default Login;
