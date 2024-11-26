import React, { useState } from "react";
import MaskedInput from "react-text-mask"; // Biblioteca para máscara
import "./Login.css"; // Estilos personalizados
import { useNavigate } from "react-router-dom"; // Importando useNavigate
import { useFetchWithLoading } from "../../contexts/fetchWithLoading";

const Login = ({ onLogin, tenantData }) => {
  const [username, setUsername] = useState("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [clientExists, setClientExists] = useState(false); // Estado para cliente existente
  const navigate = useNavigate(); // Usando useNavigate
  const { fetchWithLoading } = useFetchWithLoading();

  // Máscara para o número de telefone no Brasil
  const phoneMask = [
    "(",
    /[1-9]/, // DDD inicial (não pode começar com 0)
    /\d/, // Segundo dígito do DDD
    ")",
    " ",
    /[9]/, // Primeiro dígito obrigatório (celulares no Brasil começam com 9)
    " ",
    /\d/, // Primeiro dígito após o 9
    /\d/,
    /\d/,
    /\d/,
    "-",
    /\d/, // Primeiro dígito do sufixo
    /\d/,
    /\d/,
    /\d/,
  ];

  // Função para limpar o número de telefone (remover máscara)
  const cleanPhoneNumber = (phone) => {
    return phone.replace(/\D/g, ""); // Remove tudo que não for número
  };

  // Função para verificar se o cliente já existe (usada no onBlur)
  const checkClientExists = async () => {
    const cleanedNumber = cleanPhoneNumber(number); // Limpa o número

    if (!cleanedNumber || cleanedNumber.length < 11) return; // Valida se o número é válido

    try {
      const response = await fetchWithLoading(
        `http://localhost:3333/customers/phone/${cleanedNumber}`
      );
      const data = await response.json();
      setClientExists(true); // Define cliente como existente
      setUsername(data.name); // Preenche o nome do cliente automaticamente
    } catch (error) {
      setClientExists(false);
      setUsername(""); // Limpa o nome caso o cliente não exista
    }
  };

  // Função para verificar novamente e salvar no localStorage no clique do botão
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanedNumber = cleanPhoneNumber(number); // Limpa o número

    if (!username || !cleanedNumber) {
      setError("Por favor, preencha todos os campos."); // Mensagem de erro
      return;
    }

    try {
      // Consulta a API para buscar os dados do cliente novamente
      const response = await fetchWithLoading(
        `http://localhost:3333/customers/phone/${cleanedNumber}`
      );

      if (response.headers.get("Content-Length") === "0") {
        const postResponse = await fetchWithLoading(
          `http://localhost:3333/customers`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: username,
              phone: cleanedNumber,
            }),
          }
        );

        if (postResponse.ok) {
          const data = await postResponse.json();
          // Salva os dados no localStorage
          const tokenData = JSON.stringify(data);

          onLogin(tokenData); // Chama a função de callback passada como props
          navigate(`/${tenantData.slug}/checkout`); // Navega para a página de checkout
        } else {
          throw new Error("Erro ao cadastrar o cliente.");
        }
      } else {
        const data = await response.json();
        // Salva os dados no localStorage
        const tokenData = JSON.stringify(data);

        onLogin(tokenData); // Chama a função de callback passada como props
        navigate(`/${tenantData.slug}/checkout`); // Navega para a página de checkout
      }
    } catch (error) {
      console.error("Erro na consulta à API:", error);
      setError("Erro ao se conectar com o servidor. Tente novamente.");
    } 
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Identificação</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Qual seu número de telefone?</label>
            <MaskedInput
              mask={phoneMask} // Aplica a máscara
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onBlur={checkClientExists} // Consulta a API ao sair do campo
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
          {error && <p className="error">{error}</p>}
          <button type="submit" className="login-button">
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
