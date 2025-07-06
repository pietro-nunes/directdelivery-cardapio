export function formatarNumero(valor) {
    // Converte para número caso seja string
    const numero = parseFloat(valor);

    // Verifica se é um número válido antes de formatar
    if (isNaN(numero)) {
        return 'Valor inválido';
    }

    return numero.toFixed(2).replace('.', ',');
}

export function toTitleCase(str) {
  return str
    .toLowerCase()                // converte tudo para minúsculas
    .split(' ')                   // quebra em palavras
    .map(word => {
      // se a “palavra” estiver vazia (ex.: espaços extras), mantém como está
      if (!word) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(' ');
}

