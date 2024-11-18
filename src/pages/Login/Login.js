import React, { useState } from "react";
import MaskedInput from "react-text-mask"; // Biblioteca para máscara
import "./Login.css"; // Estilos personalizados
import { useNavigate } from "react-router-dom"; // Importando useNavigate

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false); // Estado para verificar cliente
  const [clientExists, setClientExists] = useState(false); // Estado para cliente existente
  const navigate = useNavigate(); // Usando useNavigate

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

    setIsChecking(true); // Define o estado de verificação como ativo
    try {
      const response = await fetch(
        `http://localhost:3333/customers/phone/${cleanedNumber}`
      );
      if (response.ok) {
        const data = await response.json();
        setClientExists(true); // Define cliente como existente
        setUsername(data.name); // Preenche o nome do cliente automaticamente
      } else {
        setClientExists(false);
        setUsername(""); // Limpa o nome caso o cliente não exista
        console.error("Erro ao verificar cliente:", response.status);
      }
    } catch (error) {
      console.error("Erro na consulta à API:", error);
    } finally {
      setIsChecking(false); // Finaliza a verificação
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

    setIsChecking(true); // Exibe estado de carregamento
    try {
      // Consulta a API para buscar os dados do cliente novamente
      const response = await fetch(
        `http://localhost:3333/customers/phone/${cleanedNumber}`
      );

      if (response.ok) {
        const data = await response.json();
        // Salva os dados no localStorage
        const tokenData = JSON.stringify({
          id: data.id,
          nome: data.name,
          telefone: cleanedNumber,
        });
        localStorage.setItem("token", tokenData); // Salva o token completo
        localStorage.setItem("username", data.name); // Salva o nome
        onLogin(); // Chama a função de callback passada como props
        navigate("/checkout"); // Navega para a página de checkout
      } else {
        console.error("Erro ao buscar cliente:", response.status);
        setError("Não foi possível concluir o login. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro na consulta à API:", error);
      setError("Erro ao se conectar com o servidor. Tente novamente.");
    } finally {
      setIsChecking(false); // Finaliza o carregamento
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
            {isChecking && (
              <p className="info-message">Verificando login...</p>
            )}
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
