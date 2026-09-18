import { describe, expect, it } from 'vitest';
import { ELIGIBILITY_VERSION } from '../src/index';

describe('@rueckab/eligibility – Grundgerüst', () => {
  it('exportiert eine semantische Version', () => {
    expect(ELIGIBILITY_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
