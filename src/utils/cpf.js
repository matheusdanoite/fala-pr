export function isValidCPF(cpf) {
  if (typeof cpf !== "string") return false;
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  
  const values = cpf.split('').map(el => parseInt(el));
  const rest = (count) => (values.slice(0, count - 12).reduce((soma, el, index) => (soma + el * (count - index)), 0) * 10) % 11 % 10;
  
  return rest(10) === values[9] && rest(11) === values[10];
}

export function formatCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, "");
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Mascara um CPF para exibição segura.
 * Ex: "12345678901" → "***.***. 890-01"
 * Revela apenas os últimos 5 dígitos para identificação parcial.
 * 
 * @param {string} cpf - CPF com 11 dígitos (sem formatação)
 * @returns {string} CPF mascarado
 */
export function maskCPF(cpf) {
  const clean = cpf.replace(/[^\d]/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.***.${clean.slice(6, 9)}-${clean.slice(9)}`;
}
