import { describe, it, expect } from 'vitest';
import { substituteParams, withTrailingNewline, renderExportBody } from './render';
import type { Unit } from '../types';
import { buildCombined, buildMirrored, buildFileMap, selectionCount } from './build';
import { zipFilename } from './zip';
import type { Catalog } from '../types';
import { unitKey } from '../catalog';

const CATALOG: Catalog = {
  standards: [
    {
      id: 'code',
      title: 'Code Standards',
      dir: 'code-standards',
      license: 'MIT License\nCopyright',
      files: [
        {
          path: 'guidelines/05-testing.md',
          title: '05 — Testing',
          sections: [
            {
              title: 'Coverage',
              rules: [
                {
                  id: 'test-coverage-floor',
                  sid: 'SDLC-CODE-0042',
                  status: 'Active',
                  title: 'test-coverage-floor',
                  bodyMarkdown:
                    'A merge is blocked below {{coverage_floor|80|Minimum coverage}}%.',
                  params: [
                    { id: 'coverage_floor', default: '80', label: 'Minimum coverage' },
                  ],
                },
                {
                  id: 'test-fast',
                  sid: 'SDLC-CODE-0044',
                  status: 'Active',
                  title: 'test-fast',
                  bodyMarkdown: 'Tests should be fast.',
                  params: [],
                },
              ],
            },
          ],
        },
      ],
      documents: [
        {
          kind: 'pattern',
          id: 'webhooks',
          sid: 'SDLC-CODE-P-0001',
          status: 'Active',
          path: 'patterns/webhooks.md',
          title: 'Webhooks',
          bodyMarkdown: 'Deliver events.',
          params: [],
        },
      ],
    },
  ],
};

function input(over: Partial<Parameters<typeof buildCombined>[0]> = {}) {
  return {
    catalog: CATALOG,
    selected: new Set<string>(),
    overrides: {},
    params: {},
    org: { name: '', preamble: '', footer: '' },
    ...over,
  };
}

describe('substituteParams', () => {
  it('uses provided value over default', () => {
    expect(substituteParams('floor {{coverage_floor|80|x}}%', { coverage_floor: '90' })).toBe(
      'floor 90%',
    );
  });
  it('falls back to default when unset', () => {
    expect(substituteParams('floor {{coverage_floor|80|x}}%', {})).toBe('floor 80%');
  });
  it('honors an explicitly empty value', () => {
    expect(substituteParams('a{{x|d|l}}b', { x: '' })).toBe('ab');
  });
});

describe('renderExportBody (annotation params)', () => {
  const unit = {
    bodyMarkdown: 'Keys are kept for a documented retention window.',
    params: [
      {
        id: 'retention_hours',
        default: '24',
        label: 'Retention (hours)',
        template: 'This organization retains keys for {value} hours.',
      },
    ],
  } as unknown as Unit;

  it('keeps prose abstract but appends the concretized sentence with the default', () => {
    const out = renderExportBody(unit, undefined, undefined);
    expect(out).toContain('a documented retention window'); // prose stays abstract
    expect(out).toContain('retains keys for 24 hours'); // materialized default
  });

  it('uses the user-set value when provided', () => {
    const out = renderExportBody(unit, undefined, { retention_hours: '72' });
    expect(out).toContain('retains keys for 72 hours');
  });
});

describe('withTrailingNewline', () => {
  it('adds exactly one', () => {
    expect(withTrailingNewline('a')).toBe('a\n');
    expect(withTrailingNewline('a\n\n')).toBe('a\n');
  });
});

describe('selectionCount', () => {
  it('counts selected rules and docs', () => {
    const sel = new Set([
      unitKey('code', 'rule', 'test-fast'),
      unitKey('code', 'pattern', 'webhooks'),
    ]);
    expect(selectionCount(input({ selected: sel }))).toBe(2);
  });
});

describe('buildCombined', () => {
  const sel = new Set([unitKey('code', 'rule', 'test-coverage-floor')]);

  it('substitutes params and includes the SID', () => {
    const out = buildCombined(input({ selected: sel, params: { [unitKey('code', 'rule', 'test-coverage-floor')]: { coverage_floor: '95' } } }));
    expect(out).toContain('A merge is blocked below 95%.');
    expect(out).toContain('SDLC-CODE-0042');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('uses default when no param value provided', () => {
    expect(buildCombined(input({ selected: sel }))).toContain('below 80%.');
  });

  it('applies the org preamble title', () => {
    const out = buildCombined(input({ selected: sel, org: { name: 'Acme', preamble: 'Our rules.', footer: '' } }));
    expect(out).toContain('# Acme Standards');
    expect(out).toContain('Our rules.');
  });

  it('respects a text override', () => {
    const k = unitKey('code', 'rule', 'test-coverage-floor');
    const out = buildCombined(input({ selected: sel, overrides: { [k]: 'Custom rule text.' } }));
    expect(out).toContain('Custom rule text.');
    expect(out).not.toContain('A merge is blocked');
  });
});

describe('buildMirrored', () => {
  const sel = new Set([
    unitKey('code', 'rule', 'test-fast'),
    unitKey('code', 'pattern', 'webhooks'),
  ]);
  const map = buildMirrored(input({ selected: sel }));

  it('mirrors source paths under the standard dir', () => {
    expect(Object.keys(map)).toContain('code-standards/guidelines/05-testing.md');
    expect(Object.keys(map)).toContain('code-standards/patterns/webhooks.md');
  });

  it('omits files with no selected rules in unselected sections only', () => {
    // the testing file contains only test-fast (coverage-floor not selected)
    const file = map['code-standards/guidelines/05-testing.md'];
    expect(file).toContain('test-fast');
    expect(file).not.toContain('test-coverage-floor');
  });

  it('includes a README index and the LICENSE', () => {
    expect(map['README.md']).toContain('## Included');
    expect(map['README.md']).toContain('SDLC-CODE-0044');
    expect(map['code-standards/LICENSE']).toContain('MIT License');
  });

  it('every file ends with a single trailing newline', () => {
    for (const content of Object.values(map)) {
      expect(content.endsWith('\n')).toBe(true);
      expect(content.endsWith('\n\n')).toBe(false);
    }
  });
});

describe('buildFileMap', () => {
  it('combined yields a single STANDARD.md', () => {
    const sel = new Set([unitKey('code', 'rule', 'test-fast')]);
    const map = buildFileMap(input({ selected: sel }), 'combined');
    expect(Object.keys(map)).toEqual(['STANDARD.md']);
  });
});

describe('zipFilename', () => {
  it('slugs the org name', () => {
    expect(zipFilename('Acme Corp!')).toBe('acme-corp-standards.zip');
    expect(zipFilename('')).toBe('standards.zip');
  });
});
