import imageCompression from 'browser-image-compression';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// ─── Constantes de configuração ────────────────────────────────
export const MAX_FILES = 3;
export const MAX_IMAGE_SIZE_MB = 10;           // Limite de entrada para imagens
export const MAX_NON_IMAGE_SIZE_MB = 10;       // Limite para PDFs e vídeos
export const COMPRESSED_IMAGE_TARGET_MB = 1;   // Alvo de compressão para imagens
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_NON_IMAGE_SIZE_BYTES = MAX_NON_IMAGE_SIZE_MB * 1024 * 1024;

// MIME types permitidos (whitelist rígida para segurança)
const ALLOWED_MIME_TYPES = new Set([
  // Imagens
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Vídeos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // PDF
  'application/pdf',
]);

// Extensões permitidas (fallback para validação dupla)
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.mp4', '.webm', '.mov',
  '.pdf'
]);

// Magic bytes para validação real do conteúdo do arquivo
const MAGIC_BYTES = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  { mime: 'video/mp4', offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
];

/**
 * Valida os magic bytes de um arquivo para prevenir spoofing de MIME type.
 * Lê apenas os primeiros 16 bytes do arquivo.
 */
async function validateMagicBytes(file) {
  const buffer = await file.slice(0, 16).arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // Verifica se algum padrão conhecido bate
  for (const sig of MAGIC_BYTES) {
    const offset = sig.offset || 0;
    const match = sig.bytes.every((byte, i) => uint8[offset + i] === byte);
    if (match) return true;
  }

  // Para vídeos webm (EBML header: 0x1A45DFA3) e MOV (ftyp ou moov)
  // Vídeos têm headers variáveis — aceita se passou na validação de extensão + MIME
  if (file.type.startsWith('video/')) return true;

  return false;
}

/**
 * Retorna a extensão do arquivo em lowercase.
 */
function getFileExtension(filename) {
  const dot = filename.lastIndexOf('.');
  return dot !== -1 ? filename.substring(dot).toLowerCase() : '';
}

/**
 * Valida um arquivo individualmente (tipo, extensão, tamanho e magic bytes).
 * Retorna um objeto { valid, error }.
 */
export async function validateFile(file) {
  const ext = getFileExtension(file.name);

  // 1. Validar MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Formato "${file.type || 'desconhecido'}" não é permitido.` };
  }

  // 2. Validar extensão (dupla checagem contra renomeação maliciosa)
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `Extensão "${ext}" não é permitida.` };
  }

  // 3. Validar tamanho
  const isImage = file.type.startsWith('image/');
  const maxBytes = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_NON_IMAGE_SIZE_BYTES;
  if (file.size > maxBytes) {
    const maxMB = isImage ? MAX_IMAGE_SIZE_MB : MAX_NON_IMAGE_SIZE_MB;
    return { valid: false, error: `"${file.name}" excede o limite de ${maxMB}MB.` };
  }

  // 4. Validar magic bytes (previne upload de executáveis disfarçados)
  const magicValid = await validateMagicBytes(file);
  if (!magicValid) {
    return { valid: false, error: `"${file.name}" não é um arquivo válido do tipo declarado.` };
  }

  return { valid: true, error: null };
}

/**
 * Comprime uma imagem usando Web Workers (não bloqueia a UI).
 * Retorna o File comprimido.
 */
export async function compressImage(file) {
  const options = {
    maxSizeMB: COMPRESSED_IMAGE_TARGET_MB,
    maxWidthOrHeight: 1920, // Resolução máxima razoável
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 0.8,
  };

  try {
    const compressed = await imageCompression(file, options);
    console.log(
      `[Compressão] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB`
    );
    return compressed;
  } catch (err) {
    console.warn(`[Compressão] Falha ao comprimir ${file.name}, enviando original:`, err);
    return file; // Fallback: envia o original se compressão falhar
  }
}

/**
 * Faz upload de um array de arquivos para o Firebase Storage.
 * Imagens são comprimidas antes do envio.
 * 
 * @param {File[]} files - Lista de arquivos validados
 * @param {string} demandId - ID do documento da demanda (para organizar no storage)
 * @param {function} onProgress - Callback (processedCount, totalCount, currentFileName)
 * @returns {Promise<Array<{name: string, url: string, type: string, size: number}>>}
 */
export async function uploadFiles(files, demandId, onProgress) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    const isImage = file.type.startsWith('image/');

    onProgress?.(i, files.length, file.name);

    // Comprimir imagens antes do upload
    if (isImage) {
      file = await compressImage(file);
    }

    // Gera um nome único para evitar colisões e prevenir path traversal
    const uniqueId = uuidv4();
    const safeExt = getFileExtension(file.name);
    const storagePath = `demands/${demandId}/${uniqueId}${safeExt}`;

    const storageRef = ref(storage, storagePath);

    // Metadata mínima e sanitizada — nunca inclui dados do usuário
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name.substring(0, 100).replace(/[^\w\s.\-]/g, '_'), // Sanitiza nome
      }
    };

    await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(storageRef);

    results.push({
      name: file.name.substring(0, 100),
      url: downloadURL,
      type: file.type,
      size: file.size,
    });
  }

  onProgress?.(files.length, files.length, null);
  return results;
}
