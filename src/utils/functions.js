export const extractCustomerData = (data) => ({
  id: data.id,
  name: data.name,
  phone: data.phone,
  cpf: data.cpf,
  addresses: (data.addresses || []).map(addr => ({
    id: addr.id,
    address: addr.address,
    number: addr.number,
    complement: addr.complement,
    neighborhood: { name: addr.neighborhood?.name },
    city: { name: addr.city?.name },
    zipcode: addr.zipcode,
    referencePoint: addr.referencePoint,
    nickname: addr.nickname,
  })),
});

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
  if (!str) return "";
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

/* -------------------------------------------------------
 *  Parsing de datas da API DirectDelivery
 *
 *  A API devolve createdAt / scheduledDeliveryTime etc.
 *  com sufixo Z mas os componentes NÃO são UTC. Além
 *  disso a API aplica um offset fixo de +6h sobre o
 *  horário real do pedido.
 *
 *  Regra (src/lib/date.ts):
 *    1) remover Z / ±HH:MM
 *    2) interpretar componentes como wall clock SP (UTC-3)
 *    3) subtrair 6h (offset mentiroso da API)
 *  ------------------------------------------------------- */

function parseOrderDate(dateStr) {
  if (!dateStr) return null;

  // 1) normaliza espaço → T
  const normalized = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;

  // 2) descarta Z / ±HH:MM — a API mente sobre o fuso
  const naive = normalized.replace(/Z$/, '').replace(/[+-]\d{2}:?\d{2}$/, '');

  // 3) extrai componentes
  const parts = naive.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!parts) return new Date(naive);

  const [, y, m, d, h, min, sec = '0'] = parts;

  // 4) interpreta como SP (UTC-3) e subtrai 6h = net -3h
  return new Date(Date.UTC(+y, +m - 1, +d, +h - 3, +min, +sec));
}

export function formatOrderDate(dateStr) {
  if (!dateStr) return '';
  const d = parseOrderDate(dateStr);
  if (!d) return '';
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}
