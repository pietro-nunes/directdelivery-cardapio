import React, { useState, useEffect } from 'react';
import './Checkout.css'; // Certifique-se de que esse arquivo existe e está estilizado corretamente.

const Checkout = ({ carrinho }) => {
    const [enderecos, setEnderecos] = useState([]);
    const [novoEndereco, setNovoEndereco] = useState('');
    const [error, setError] = useState('');
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState('');

    useEffect(() => {
        const formasPagamentoFake = [
            { id: '1', nome: 'Cartão de Crédito' },
            { id: '2', nome: 'Boleto Bancário' },
            { id: '3', nome: 'Pix' },
            { id: '4', nome: 'Dinheiro na Entrega' }
        ];

        setFormasPagamento(formasPagamentoFake);
    }, []);

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
            itens: carrinho,
            total,
            endereco: enderecos,
            formaPagamento: formaPagamentoSelecionada,
        };
        
        console.log(`Pedido finalizado! Total: R$ ${total.toFixed(2)}\nDados do pedido: ${JSON.stringify(pedido)}`);
    };

    return (
        <div className="checkout-container">
            <h2>Este pedido será entregue a:</h2>
            <div className="customer-info">
                <p>Pietro Nunes</p>
                <p>(51) 9 8463-9694</p>
                <button className="change-button">Trocar</button>
            </div>

            <h3>Entrega</h3>
            <div className="delivery-info">
                <p>Endereço de entrega: teste, teste, Centro, Capão da Canoa</p>
                <button className="change-button">Trocar</button>
            </div>

            <h3>Escolha a forma de pagamento</h3>
            <div className="payment-info">
                <p>Pagar na entrega</p>
                <p>Realize o pagamento para o entregador</p>
                <select onChange={(e) => setFormaPagamentoSelecionada(e.target.value)} value={formaPagamentoSelecionada}>
                    <option value="">Selecione uma forma de pagamento</option>
                    {formasPagamento.map((forma) => (
                        <option key={forma.id} value={forma.id}>
                            {forma.nome}
                        </option>
                    ))}
                </select>
            </div>

            <h3>Observação do pedido</h3>
            <textarea
                className="observations-mobile"
                placeholder="Ex.: Apertar campainha, não buzinar, etc."
            />

            <h3>Subtotal: R$ {total.toFixed(2)}</h3>
            <h3>Taxa de entrega: R$ 5,00</h3>
            <h2>Total: R$ {total + 5.00}</h2>

            <button onClick={handleFinalizarPedido} className="finalizar-button">Selecione a forma de pagamento</button>
        </div>
    );
};

export default Checkout;
