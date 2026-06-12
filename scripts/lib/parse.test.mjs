import { describe, it, expect } from 'vitest';
import {
  extractParams,
  stripSidLine,
  parseGuidelineFile,
  parseDocFile,
} from './parse.mjs';

describe('extractParams', () => {
  it('extracts id/default/label', () => {
    const md = 'floor of {{coverage_floor|80|Minimum test coverage percentage}}% here';
    expect(extractParams(md)).toEqual([
      { id: 'coverage_floor', default: '80', label: 'Minimum test coverage percentage' },
    ]);
  });

  it('trims whitespace and dedupes repeated ids', () => {
    const md = '{{ a | 1 | First }} ... {{a|1|First}} and {{ b|2|Second }}';
    expect(extractParams(md)).toEqual([
      { id: 'a', default: '1', label: 'First' },
      { id: 'b', default: '2', label: 'Second' },
    ]);
  });

  it('allows an empty default', () => {
    expect(extractParams('{{x||A label}}')).toEqual([
      { id: 'x', default: '', label: 'A label' },
    ]);
  });

  it('ignores malformed placeholders', () => {
    expect(extractParams('{{notvalid}} and {single} and {{a|b}}')).toEqual([]);
  });
});

describe('stripSidLine', () => {
  it('strips the anchored SID line and returns the sid', () => {
    const body = '<a id="SDLC-CODE-0042"></a>**`SDLC-CODE-0042`**\n\nThe rule body.';
    expect(stripSidLine(body)).toEqual({ sid: 'SDLC-CODE-0042', body: 'The rule body.' });
  });

  it('strips a bare bold SID line', () => {
    const body = '**`SDLC-API-0001`**\n\nBody.';
    expect(stripSidLine(body)).toEqual({ sid: 'SDLC-API-0001', body: 'Body.' });
  });

  it('returns null sid when no SID line is present', () => {
    const body = 'Just a normal rule body.';
    expect(stripSidLine(body)).toEqual({ sid: null, body });
  });
});

const GUIDELINE = `# 05 — Testing

Intro prose.

## Coverage

### \`test-coverage-floor\`
<a id="SDLC-CODE-0042"></a>**\`SDLC-CODE-0042\`**

A merge is blocked below a coverage floor of {{coverage_floor|80|Minimum test coverage percentage}}%.

### \`test-coverage-gate\`
<a id="SDLC-CODE-0043"></a>**\`SDLC-CODE-0043\`**

Coverage must be enforced in CI.

## Qualities

### \`test-fast\`
<a id="SDLC-CODE-0044"></a>**\`SDLC-CODE-0044\`**

Tests should run in under {{max_seconds|60|Maximum suite runtime in seconds}} seconds.

## Common mistakes

Some closing prose that is not a rule.
`;

describe('parseGuidelineFile', () => {
  const parsed = parseGuidelineFile('guidelines/05-testing.md', GUIDELINE);

  it('reads the file title', () => {
    expect(parsed.title).toBe('05 — Testing');
  });

  it('groups rules under sections', () => {
    expect(parsed.sections.map((s) => s.title)).toEqual([
      'Coverage',
      'Qualities',
      'Common mistakes',
    ]);
    expect(parsed.sections[0].rules.map((r) => r.slug)).toEqual([
      'test-coverage-floor',
      'test-coverage-gate',
    ]);
    expect(parsed.sections[1].rules.map((r) => r.slug)).toEqual(['test-fast']);
    expect(parsed.sections[2].rules).toEqual([]); // prose-only section
  });

  it('captures sid and strips the sid line from the body', () => {
    const rule = parsed.sections[0].rules[0];
    expect(rule.sid).toBe('SDLC-CODE-0042');
    expect(rule.bodyMarkdown).toMatch(/^A merge is blocked/);
    expect(rule.bodyMarkdown).not.toMatch(/SDLC-CODE-0042/);
  });

  it('extracts params per rule', () => {
    expect(parsed.sections[0].rules[0].params).toEqual([
      { id: 'coverage_floor', default: '80', label: 'Minimum test coverage percentage' },
    ]);
    expect(parsed.sections[1].rules[0].params).toEqual([
      { id: 'max_seconds', default: '60', label: 'Maximum suite runtime in seconds' },
    ]);
    expect(parsed.sections[0].rules[1].params).toEqual([]);
  });
});

describe('parseGuidelineFile without SIDs (pre-content-pass)', () => {
  const md = `# 02 — Naming

## Casing

### \`name-kebab\`

Use kebab-case for files.
`;
  it('parses with sid null', () => {
    const parsed = parseGuidelineFile('guidelines/02-naming.md', md);
    const rule = parsed.sections[0].rules[0];
    expect(rule.slug).toBe('name-kebab');
    expect(rule.sid).toBeNull();
    expect(rule.bodyMarkdown).toBe('Use kebab-case for files.');
  });
});

describe('parseDocFile', () => {
  const md = `# Webhooks
<a id="SDLC-CODE-P-0001"></a>**\`SDLC-CODE-P-0001\`**

Deliver events to subscriber URLs.
`;
  it('reads title and sid', () => {
    const doc = parseDocFile('patterns/webhooks.md', md, { kind: 'pattern', slug: 'webhooks' });
    expect(doc.title).toBe('Webhooks');
    expect(doc.sid).toBe('SDLC-CODE-P-0001');
    expect(doc.kind).toBe('pattern');
    expect(doc.slug).toBe('webhooks');
  });
});
