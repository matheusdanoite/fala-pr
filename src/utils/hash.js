/**
 * Gera hash SHA-256 de uma string usando Web Crypto API.
 * Usado para armazenar CPF de forma irreversível no Firestore.
 * 
 * @param {string} text - Texto a ser hasheado (CPF com 11 dígitos)
 * @returns {Promise<string>} Hash hexadecimal de 64 caracteres
 */
export async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Gera o hash SHA-256 de um CPF.
 * Normaliza removendo pontuação antes de hashear.
 * 
 * @param {string} cpf - CPF (com ou sem formatação)
 * @returns {Promise<string>} Hash SHA-256 do CPF limpo
 */
export async function hashCPF(cpf) {
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  return sha256(cleanCpf);
}
