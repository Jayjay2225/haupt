import { describe, expect, it } from 'vitest';
import { CALC_VERSION } from '../src/index';

describe('@rueckab/calc – Grundgerüst', () => {
  it('exportiert eine semantische Version (erscheint als calc.version in Berichten)', () => {
    expect(CALC_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
