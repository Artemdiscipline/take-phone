/**
 * Номер заявки, который называют покупателю по телефону.
 *
 * Формат `TP-YYMMDD-XXXX`: дату видно сразу, хвост различает заявки одного дня.
 * Внутренний `id` при этом остаётся техническим и не показывается.
 */
export function buildPublicNumber(createdAt: Date, seed: string): string {
  const year = String(createdAt.getUTCFullYear()).slice(2);
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(createdAt.getUTCDate()).padStart(2, '0');

  return `TP-${year}${month}${day}-${shortCode(seed)}`;
}

const ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Короткий код без похожих друг на друга символов (I, O). */
function shortCode(seed: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  let code = '';
  for (let index = 0; index < 4; index += 1) {
    code += ALPHABET[hash % ALPHABET.length];
    hash = Math.floor(hash / ALPHABET.length) || hash >>> 5;
  }

  return code;
}

/** Технический идентификатор заявки. */
export function buildOrderId(): string {
  return crypto.randomUUID();
}
