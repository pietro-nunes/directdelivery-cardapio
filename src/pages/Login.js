import React, { useState } from 'react';
import InputMask from 'react-input-mask'; // Importa a biblioteca para máscara
import './Login.css'; // Estilos personalizados
import { useNavigate } from 'react-router-dom'; // Importando useNavigate

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [number, setNumber] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Usando useNavigate

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Simulação de consulta à API
        setTimeout(() => {
            if (username && number) { // Verifica se o nome e número estão preenchidos
                const fakeToken = '{"id": 1, "nome": "Pietro Nunes", "telefone": "51984639694"}'; // Token simulado
                localStorage.setItem('token', fakeToken); // Salva o token no localStorage
                localStorage.setItem('username', username); // Salva o nome de usuário no localStorage
                onLogin(); // Chama a função de callback passada como props
                navigate('/checkout'); // Navega para a página de checkout
            } else {
                setError('Por favor, preencha todos os campos.'); // Mensagem de erro
            }
        }, 1000); // 1 segundo de espera para simular a consulta
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Identificação</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Qual seu número de telefone?</label>
                        <InputMask 
                            mask="(99) 9 9999-9999" 
                            value={number} 
                            onChange={(e) => setNumber(e.target.value)} 
                            required 
                        >
                            {(inputProps) => <input {...inputProps} type="text" />}
                        </InputMask>
                    </div>
                    <div className="input-group">
                        <label>Nome e sobrenome:</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="login-button">Avançar</button>
                </form>
                <p className="info-message">Para concluir o pedido, pedimos que se identifique</p>
            </div>
        </div>
    );
};

export default Login;
