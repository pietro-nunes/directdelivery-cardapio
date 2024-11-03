import React, { useState, useEffect } from 'react';
import './Checkout.css'; // Certifique-se de que esse arquivo existe e está estilizado corretamente.
import { useNavigate } from 'react-router-dom'; // Importar useNavigate para navegação

const Checkout = ({ carrinho, onLogout }) => {
    const navigate = useNavigate(); // Inicializa o useNavigate
    const [enderecos, setEnderecos] = useState([]);
    const [novoEndereco, setNovoEndereco] = useState('');
    const [error, setError] = useState('');
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState('');
    const [troco, setTroco] = useState('');
    const [modalTrocoVisible, setModalTrocoVisible] = useState(false);
    const [cliente, setCliente] = useState(null);
    const [tipoEntrega, setTipoEntrega] = useState('entrega'); // Estado para controlar o tipo de entrega

    useEffect(() => {
        // Carregar as formas de pagamento
        const formasPagamentoFake = [
            { id: '1', nome: 'Cartão de Crédito' },
            { id: '2', nome: 'Boleto Bancário' },
            { id: '3', nome: 'Pix' },
            { id: '4', nome: 'Dinheiro na Entrega' }
        ];
        setFormasPagamento(formasPagamentoFake);

        // Carregar o cliente do local storage
        const clienteLocalStorage = JSON.parse(localStorage.getItem('token'));
        setCliente(clienteLocalStorage);
    }, []);

    const formatarTelefone = (telefone) => {
        const apenasNumeros = telefone.replace(/\D/g, '');
        const match = apenasNumeros.match(/(\d{2})(\d{5})(\d{4})/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return telefone;
    };

    const calcularTotal = () => {
        if (!Array.isArray(carrinho) || carrinho.length === 0) return 0;
        return carrinho.reduce((acc, item) => {
            const preco = item.price || 0;
            const quantidade = item.count || 0;
            return acc + (preco * quantidade);
        }, 0);
    };

    const total = calcularTotal();

    const handleAddEndereco = () => {
        if (novoEndereco.trim() === '') {
            setError('Por favor, insira um endereço válido.');
            return;
        }

        setEnderecos([...enderecos, novoEndereco.trim()]);
        setNovoEndereco('');
        setError('');
    };

    const handleFinalizarPedido = () => {
        if (total === 0) {
            alert('Adicione produtos ao carrinho antes de finalizar.');
            return;
        }
        if (!formaPagamentoSelecionada) {
            alert('Por favor, selecione uma forma de pagamento.');
            return;
        }

        const pedido = {
            clienteId: cliente?.id,
            itens: carrinho,
            total,
            endereco: enderecos,
            formaPagamento: formaPagamentoSelecionada,
            troco: formaPagamentoSelecionada === '4' ? troco : null // Adiciona o troco se for dinheiro
        };
        
        console.log(`Pedido finalizado! Total: R$ ${total.toFixed(2)}\nDados do pedido: ${JSON.stringify(pedido)}`);
    };

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    const handleFormaPagamentoChange = (e) => {
        const formaSelecionada = e.target.value;
        setFormaPagamentoSelecionada(formaSelecionada);
        
        // Verifica se a forma de pagamento é "Dinheiro na Entrega"
        if (formaSelecionada === '4') {
            setModalTrocoVisible(true); // Abre o modal para troco
        } else {
            setModalTrocoVisible(false); // Fecha o modal se não for dinheiro
            setTroco(''); // Limpa o valor do troco
        }
    };

    const handleTrocoChange = (e) => {
        setTroco(e.target.value);
    };

    const handleTrocoSubmit = (e) => {
        e.preventDefault();
        setModalTrocoVisible(false);
    };

    const handleNoTroco = () => {
        setTroco('0'); // Define o troco como 0 se não precisar
        setModalTrocoVisible(false);
    };

    return (
        <div className="checkout-container">
            <h2>Este pedido será entregue a:</h2>
            <div className="customer-info">
                {cliente ? (
                    <>
                        <p>{cliente.nome}</p>
                        <p>{formatarTelefone(cliente.telefone)}</p>
                    </>
                ) : (
                    <p>Carregando informações do cliente...</p>
                )}
                <button onClick={handleLogout} className="change-button">Trocar</button>
            </div>

            <h3>Entrega</h3>
            <div className="delivery-info">
                <div className="delivery-option">
                    <label>
                        <input 
                            type="radio" 
                            value="entrega" 
                            checked={tipoEntrega === 'entrega'} 
                            onChange={() => setTipoEntrega('entrega')} 
                        />
                        <span>Entrega</span>
                    </label>
                </div>
                <div className="delivery-option">
                    <label>
                        <input 
                            type="radio" 
                            value="retirada" 
                            checked={tipoEntrega === 'retirada'} 
                            onChange={() => setTipoEntrega('retirada')} 
                        />
                        <span>Retirada no local</span>
                    </label>
                </div>
            </div>

            {tipoEntrega === 'retirada' ? (
                <p>Você escolheu retirar o pedido no local.</p>
            ) : (
                <p>Você escolheu entrega.</p>
            )}

            <h3>Escolha a forma de pagamento</h3>
            <div className="payment-info">
                <select
                    className="payment-select"
                    onChange={handleFormaPagamentoChange}
                    value={formaPagamentoSelecionada}
                >
                    <option value="">Selecione uma forma de pagamento</option>
                    {formasPagamento.map((forma) => (
                        <option key={forma.id} value={forma.id}>
                            {forma.nome}
                        </option>
                    ))}
                </select>
            </div>

            {/* Overlay e Modal para o troco */}
            {modalTrocoVisible && (
                <>
                    <div className="overlay" onClick={() => setModalTrocoVisible(false)}></div>
                    <div className="modal-bottom slide-in">
                        <div className="modal-content">
                            <h4>Precisa de troco?</h4>
                            <form onSubmit={handleTrocoSubmit}>
                                <input 
                                    type="number" 
                                    value={troco} 
                                    onChange={handleTrocoChange} 
                                    placeholder="Valor do troco" 
                                    required 
                                />
                                <div className="button-container">
                                    <button type="submit">Confirmar</button>
                                    <button className="no-troco-button" onClick={handleNoTroco}>Não precisa de troco</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            <h3>Observação do pedido</h3>
            <textarea
                className="observations-mobile"
                placeholder="Ex.: Apertar campainha, não buzinar, etc."
            />

            <h3>Subtotal: R$ {total.toFixed(2)}</h3>
            <h3>Taxa de entrega: R$ 5,00</h3>
            <h2>Total: R$ {total + 5.00}</h2>

            {formaPagamentoSelecionada === '4' && troco && (
                <h3>Troco: R$ {troco}</h3>
            )}

            <button onClick={handleFinalizarPedido} className="finalizar-button">Finalizar Pedido</button>
        </div>
    );
};

export default Checkout;
