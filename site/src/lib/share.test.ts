import { describe, it, expect } from 'vitest';
import { toShareUrl, fromUrlHash, toPreset, fromPreset } from './share';
import type { PersistShape } from './store.svelte';

const sample: PersistShape = {
  selected: ['code:rule:test-fast', 'code:pattern:webhooks'],
  overrides: { 'code:rule:test-fast': 'Custom text.' },
  params: { 'code:rule:test-coverage-floor': { coverage_floor: '95' } },
  org: { name: 'Acme', preamble: 'Intro', footer: 'Bye' },
};

describe('URL round-trip', () => {
  it('encodes selection + params + org, omits overrides', () => {
    const url = toShareUrl(sample, 'https://example.com/code-standards/');
    const parsed = fromUrlHash(new URL(url).hash);
    expect(parsed?.selected).toEqual(sample.selected);
    expect(parsed?.params).toEqual(sample.params);
    expect(parsed?.org).toEqual(sample.org);
    expect(parsed?.overrides).toBeUndefined(); // overrides intentionally excluded
  });

  it('returns null for a hash with no config', () => {
    expect(fromUrlHash('#nothing=1')).toBeNull();
    expect(fromUrlHash('')).toBeNull();
  });

  it('returns null for a corrupt payload', () => {
    expect(fromUrlHash('#c=not-valid-base64!!')).toBeNull();
  });
});

describe('preset round-trip', () => {
  it('is lossless including overrides', () => {
    const text = toPreset(sample);
    const parsed = fromPreset(text);
    expect(parsed).toEqual(sample);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('rejects non-preset json', () => {
    expect(fromPreset('{"kind":"other"}')).toBeNull();
    expect(fromPreset('not json')).toBeNull();
  });
});
