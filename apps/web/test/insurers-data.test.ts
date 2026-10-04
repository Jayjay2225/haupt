import { describe, expect, it } from 'vitest';
import { findeVersichererId } from '../lib/insurers-data';

describe('findeVersichererId', () => {
  it('ordnet dreistellige Kürzel als Wortanfang zu', () => {
    expect(findeVersichererId('AXA')).toBe('axa-leben');
    expect(findeVersichererId('HDI')).toBe('hdi-leben');
    expect(findeVersichererId('LVM')).toBe('lvm-leben');
    expect(findeVersichererId('HUK')).toBe('huk-coburg-leben');
    expect(findeVersichererId('R+V')).toBe('r-v-leben');
    expect(findeVersichererId('DBV')).toBe('dbv-winterthur-leben');
    expect(findeVersichererId('ERGO')).toBe('ergo-leben');
  });

  it('behandelt Bindestrich und Leerzeichen gleich', () => {
    expect(findeVersichererId('HUK Coburg')).toBe('huk-coburg-leben');
    expect(findeVersichererId('HUK-Coburg')).toBe('huk-coburg-leben');
    expect(findeVersichererId('DBV Winterthur')).toBe('dbv-winterthur-leben');
    expect(findeVersichererId('Hamburg Mannheimer')).toBe('ergo-leben');
    expect(findeVersichererId('Allianz')).toBe('allianz-leben');
  });

  it('bleibt bei Gattungsbegriffen und bloßen Namensfragmenten konservativ', () => {
    for (const e of [
      '', 'AG', 'LV', 'a.g.', 'Leben', 'Lebensversicherung', 'Versicherung AG', 'Lebensversicherungs-AG', 'Lebensversicherungs AG', 'Alt', 'Han', 'Vic',
      // Rechtsform-/Gattungsphrasen und Wortfragmente dürfen keine konkrete Gesellschaft treffen.
      'Lebensversicherung a.G.', 'Versicherung a.G.', 'Lebensversicherungsverein a.G.', 'Versicherungsverein', 'Lebensversicherungs', 'Versicherungs', 'Deutsche', 'die Bayerische',
    ]) {
      expect(findeVersichererId(e), e).toBe('unbekannt');
    }
  });

  it('Teiltreffer nur an Wortgrenzen; echte Namen werden weiterhin gefunden', () => {
    expect(findeVersichererId('Versicherungskammer')).toBe('bayern-versicherung-leben');
    expect(findeVersichererId('Deutscher Herold')).toBe('zurich-deutscher-herold-leben');
    expect(findeVersichererId('Allianz Lebensversicherungs-AG')).toBe('allianz-leben');
  });
});
