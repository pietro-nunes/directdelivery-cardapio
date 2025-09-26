export function formatarNumero(valor) {
  // Converte para número caso seja string
  const numero = parseFloat(valor);

  // Verifica se é um número válido antes de formatar
  if (isNaN(numero)) {
    return "Valor inválido";
  }

  return numero.toFixed(2).replace(".", ",");
}

export function toTitleCase(str) {
  return str
    .toLowerCase() // converte tudo para minúsculas
    .split(" ") // quebra em palavras
    .map((word) => {
      // se a “palavra” estiver vazia (ex.: espaços extras), mantém como está
      if (!word) return word;
      return word[0].toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export const onlyDigits = (s) => (s || "").replace(/\D/g, "");

export function isValidCPF(raw) {
  const c = onlyDigits(raw);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;

  const calc = (factor) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++)
      sum += parseInt(c[i], 10) * (factor - i);
    const dv = (sum * 10) % 11;
    return dv === 10 ? 0 : dv;
  };

  const d1 = calc(10);
  const d2 = calc(11);
  return d1 === parseInt(c[9], 10) && d2 === parseInt(c[10], 10);
}

// sua máscara:
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

// formata usando um array de máscara (strings e RegExp)
function formatWithMask(value, mask) {
  const src = (value || "").replace(/\D/g, ""); // só dígitos
  let si = 0;
  let out = "";

  for (const m of mask) {
    if (typeof m === "string") {
      out += m; // caractere fixo da máscara
      continue;
    }
    // m é RegExp: pega o próximo dígito que casar
    while (si < src.length && !m.test(src[si])) si++;
    if (si < src.length) {
      out += src[si++];
    } else {
      break; // acabou fonte antes de preencher toda a máscara
    }
  }
  return out;
}

// atalho específico p/ CPF
export function formatCPF(value) {
  return formatWithMask(value, cpfMask);
}
