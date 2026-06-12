import { describe, it, expect } from 'vitest';
import {
  parseSid,
  isValidSid,
  formatSid,
  nextNumber,
  allocateSid,
  validateEntries,
  validateAgainstPrior,
  standardForSeries,
  seriesForStandard,
} from './sid.mjs';

describe('parseSid', () => {
  it('parses a rule SID', () => {
    expect(parseSid('SDLC-CODE-0042')).toMatchObject({
      series: 'CODE',
      kind: 'rule',
      number: 42,
    });
  });

  it('parses a pattern SID', () => {
    expect(parseSid('SDLC-API-P-0001')).toMatchObject({
      series: 'API',
      kind: 'pattern',
      number: 1,
    });
  });

  it('parses a tooling SID', () => {
    expect(parseSid('SDLC-CODE-T-0007')).toMatchObject({
      series: 'CODE',
      kind: 'tooling',
      number: 7,
    });
  });

  it('rejects malformed SIDs', () => {
    for (const bad of [
      'CODE-0042',
      'SDLC-CODE-42',
      'SDLC-XYZ-0001',
      'SDLC-CODE-Q-0001',
      'sdlc-code-0042',
      '',
      null,
      undefined,
      42,
    ]) {
      expect(parseSid(bad)).toBeNull();
      expect(isValidSid(bad)).toBe(false);
    }
  });
});

describe('formatSid', () => {
  it('formats rules, patterns, tooling', () => {
    expect(formatSid({ series: 'CODE', number: 42 })).toBe('SDLC-CODE-0042');
    expect(formatSid({ series: 'API', kind: 'pattern', number: 1 })).toBe('SDLC-API-P-0001');
    expect(formatSid({ series: 'CODE', kind: 'tooling', number: 7 })).toBe('SDLC-CODE-T-0007');
  });

  it('pads to at least four digits but grows for large numbers', () => {
    expect(formatSid({ series: 'API', number: 12345 })).toBe('SDLC-API-12345');
  });

  it('throws on bad input', () => {
    expect(() => formatSid({ series: 'XYZ', number: 1 })).toThrow();
    expect(() => formatSid({ series: 'CODE', number: 0 })).toThrow();
    expect(() => formatSid({ series: 'CODE', kind: 'nope', number: 1 })).toThrow();
  });

  it('round-trips with parseSid', () => {
    const sid = formatSid({ series: 'API', kind: 'pattern', number: 3 });
    expect(parseSid(sid)).toMatchObject({ series: 'API', kind: 'pattern', number: 3 });
  });
});

describe('allocation', () => {
  const entries = [
    { sid: 'SDLC-CODE-0001', series: 'CODE', kind: 'rule' },
    { sid: 'SDLC-CODE-0002', series: 'CODE', kind: 'rule' },
    { sid: 'SDLC-CODE-P-0001', series: 'CODE', kind: 'pattern' },
    { sid: 'SDLC-API-0005', series: 'API', kind: 'rule' },
  ];

  it('returns highest+1 per (series, kind) counter', () => {
    expect(nextNumber(entries, 'CODE', 'rule')).toBe(3);
    expect(nextNumber(entries, 'CODE', 'pattern')).toBe(2);
    expect(nextNumber(entries, 'API', 'rule')).toBe(6);
    expect(nextNumber(entries, 'API', 'tooling')).toBe(1);
  });

  it('never gap-fills (counts from the max, not the count)', () => {
    const gappy = [
      { sid: 'SDLC-CODE-0001', series: 'CODE', kind: 'rule' },
      { sid: 'SDLC-CODE-0009', series: 'CODE', kind: 'rule' },
    ];
    expect(nextNumber(gappy, 'CODE', 'rule')).toBe(10);
  });

  it('allocateSid formats the next free SID', () => {
    expect(allocateSid(entries, 'CODE', 'rule')).toBe('SDLC-CODE-0003');
    expect(allocateSid(entries, 'API', 'tooling')).toBe('SDLC-API-T-0001');
  });
});

describe('series <-> standard mapping', () => {
  it('maps both directions', () => {
    expect(standardForSeries('API')).toBe('api');
    expect(standardForSeries('CODE')).toBe('code');
    expect(seriesForStandard('api')).toBe('API');
    expect(seriesForStandard('code')).toBe('CODE');
  });
});

describe('validateEntries', () => {
  it('accepts a valid set', () => {
    const ok = [
      { sid: 'SDLC-CODE-0001', series: 'CODE', kind: 'rule', slug: 'a', status: 'Active' },
      {
        sid: 'SDLC-CODE-0002',
        series: 'CODE',
        kind: 'rule',
        slug: 'b',
        status: 'Obsoleted',
        obsoletedBy: 'SDLC-CODE-0001',
      },
    ];
    expect(validateEntries(ok)).toEqual([]);
  });

  it('flags duplicates, malformed sids, series/kind disagreement, bad status', () => {
    const bad = [
      { sid: 'SDLC-CODE-0001', series: 'CODE', kind: 'rule', slug: 'a', status: 'Active' },
      { sid: 'SDLC-CODE-0001', series: 'CODE', kind: 'rule', slug: 'b', status: 'Active' },
      { sid: 'nope', series: 'CODE', kind: 'rule', slug: 'c', status: 'Active' },
      { sid: 'SDLC-API-0001', series: 'CODE', kind: 'rule', slug: 'd', status: 'Active' },
      { sid: 'SDLC-CODE-P-0001', series: 'CODE', kind: 'rule', slug: 'e', status: 'Active' },
      { sid: 'SDLC-CODE-0003', series: 'CODE', kind: 'rule', slug: 'f', status: 'Bogus' },
    ];
    const errs = validateEntries(bad);
    expect(errs.join('\n')).toMatch(/duplicate/);
    expect(errs.join('\n')).toMatch(/malformed/);
    expect(errs.join('\n')).toMatch(/series/);
    expect(errs.join('\n')).toMatch(/kind/);
    expect(errs.join('\n')).toMatch(/status/);
  });

  it('flags unresolved obsoletedBy', () => {
    const bad = [
      {
        sid: 'SDLC-CODE-0001',
        series: 'CODE',
        kind: 'rule',
        slug: 'a',
        status: 'Obsoleted',
        obsoletedBy: 'SDLC-CODE-9999',
      },
    ];
    expect(validateEntries(bad).join('\n')).toMatch(/does not resolve/);
  });
});

describe('validateAgainstPrior', () => {
  const prior = [{ sid: 'SDLC-CODE-0001', series: 'CODE', kind: 'rule', slug: 'a' }];

  it('accepts unchanged mapping', () => {
    expect(validateAgainstPrior(prior, prior)).toEqual([]);
  });

  it('flags a reused number (same sid, new slug)', () => {
    const next = [{ sid: 'SDLC-CODE-0001', series: 'CODE', kind: 'rule', slug: 'b' }];
    expect(validateAgainstPrior(prior, next).join('\n')).toMatch(/reuse/);
  });

  it('flags a renumbered slug (same slug, new sid)', () => {
    const next = [{ sid: 'SDLC-CODE-0002', series: 'CODE', kind: 'rule', slug: 'a' }];
    expect(validateAgainstPrior(prior, next).join('\n')).toMatch(/renumbered/);
  });
});
