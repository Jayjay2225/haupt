/** ULID: zeitlich sortierbar, offline kollisionsfrei (Konzept Kapitel 10). */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford Base32

export function ulid(zeit: number = Date.now()): string {
  let t = zeit;
  const zeitTeil = new Array<string>(10);
  for (let i = 9; i >= 0; i--) {
    zeitTeil[i] = ALPHABET[t % 32];
    t = Math.floor(t / 32);
  }
  const zufall = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(zufall);
  } else {
    for (let i = 0; i < 16; i++) zufall[i] = Math.floor(Math.random() * 256);
  }
  let rest = '';
  for (let i = 0; i < 16; i++) rest += ALPHABET[zufall[i] % 32];
  return zeitTeil.join('') + rest;
}

export function geraeteId(bestehende?: string): string {
  if (bestehende) return bestehende;
  return 'g-' + ulid();
}
