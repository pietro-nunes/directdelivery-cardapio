export function formatarNumero(valor) {
    // Converte para número caso seja string
    const numero = parseFloat(valor);

    // Verifica se é um número válido antes de formatar
    if (isNaN(numero)) {
        return 'Valor inválido';
    }

    return numero.toFixed(2).replace('.', ',');
}
