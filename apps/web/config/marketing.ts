/**
 * Marketing-Schalter (Prompt 10): Hero-Variante für A/B-Tests.
 * a | b | c – Texte liegen im Copy-Deck (docs/PROMPTS.md, Prompt 10) und in
 * app/page.tsx. Umschalten per Umgebungsvariable, Standard „a“.
 */
export type HeroVariante = 'a' | 'b' | 'c';

const roh = process.env['NEXT_PUBLIC_HERO_VARIANTE'];
export const HERO_VARIANTE: HeroVariante = roh === 'b' || roh === 'c' ? roh : 'a';
