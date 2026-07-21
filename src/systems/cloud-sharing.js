const SHARE_TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SHARE_TOKEN_LENGTH = 16;
const SHARE_TOKEN_PATTERN = new RegExp(`^[${SHARE_TOKEN_ALPHABET}]{${SHARE_TOKEN_LENGTH}}$`);

export function encodeShareToken(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 10) {
    throw new Error('invalid_share_token_bytes');
  }
  let value = 0;
  let bits = 0;
  let token = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      token += SHARE_TOKEN_ALPHABET[(value >>> bits) & 31];
      value &= (1 << bits) - 1;
    }
  }
  return token;
}

export function createShareToken() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('secure_random_unavailable');
  return encodeShareToken(globalThis.crypto.getRandomValues(new Uint8Array(10)));
}

export function normalizeShareToken(value) {
  const token = String(value || '').toUpperCase().replace(/[\s-]/g, '');
  return SHARE_TOKEN_PATTERN.test(token) ? token : null;
}

export function formatShareToken(value) {
  const token = normalizeShareToken(value);
  if (!token) return String(value || '');
  return token.match(/.{1,4}/g).join('-');
}

export async function hashShareToken(value) {
  const token = normalizeShareToken(value);
  if (!token) throw new Error('invalid_share_token');
  if (!globalThis.crypto?.subtle) throw new Error('secure_hash_unavailable');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
