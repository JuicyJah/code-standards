// Standards Identifier (SID) parsing, formatting, validation, and allocation.
// See NUMBERING.md for the standard this implements.

export const REPO = 'SDLC';
export const SERIES = ['API', 'CODE'];
export const KINDS = ['P', 'T']; // kind codes used in the SID string (rules have none)
export const MIN_DIGITS = 4;

// SDLC-<SERIES>[-<KIND>]-<NNNN>
const SID_RE = /^SDLC-(API|CODE)(?:-(P|T))?-(\d{4,})$/;

const KIND_BY_CODE = { P: 'pattern', T: 'tooling' };
const CODE_BY_KIND = { pattern: 'P', tooling: 'T', rule: null };

/** Map a `series` (API|CODE) to the `standard` token (api|code). */
export function standardForSeries(series) {
  return series === 'API' ? 'api' : 'code';
}

/** Map a `standard` token (api|code) to the `series` (API|CODE). */
export function seriesForStandard(standard) {
  return standard === 'api' ? 'API' : 'CODE';
}

/** Parse a SID string into its parts, or return null if malformed. */
export function parseSid(sid) {
  if (typeof sid !== 'string') return null;
  const m = SID_RE.exec(sid);
  if (!m) return null;
  const [, series, kindCode, number] = m;
  return {
    sid,
    repo: REPO,
    series,
    kind: kindCode ? KIND_BY_CODE[kindCode] : 'rule',
    number: Number(number),
    digits: number.length,
  };
}

/** True if `sid` is a well-formed SID string. */
export function isValidSid(sid) {
  return parseSid(sid) !== null;
}

/**
 * Format a SID from parts.
 * @param {{series: string, kind?: string, number: number, digits?: number}} p
 */
export function formatSid({ series, kind = 'rule', number, digits = MIN_DIGITS }) {
  if (!SERIES.includes(series)) {
    throw new Error(`Unknown series: ${series}`);
  }
  if (!(kind in CODE_BY_KIND)) {
    throw new Error(`Unknown kind: ${kind}`);
  }
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`Invalid number: ${number}`);
  }
  const width = Math.max(MIN_DIGITS, digits);
  const num = String(number).padStart(width, '0');
  const code = CODE_BY_KIND[kind];
  return code ? `${REPO}-${series}-${code}-${num}` : `${REPO}-${series}-${num}`;
}

/** Counter key for a (series, kind) pair. */
export function counterKey(series, kind) {
  return `${series}:${kind}`;
}

/**
 * Given existing registry entries, return the next free number for a (series, kind)
 * counter. Allocates highest-assigned + 1 (never gap-fills), starting at 1.
 */
export function nextNumber(entries, series, kind) {
  let max = 0;
  for (const e of entries) {
    if (e.series === series && e.kind === kind) {
      const parsed = parseSid(e.sid);
      if (parsed && parsed.number > max) max = parsed.number;
    }
  }
  return max + 1;
}

/** Allocate the next SID string for a (series, kind) given existing entries. */
export function allocateSid(entries, series, kind) {
  return formatSid({ series, kind, number: nextNumber(entries, series, kind) });
}

/**
 * Validate a set of registry entries for internal consistency.
 * Returns an array of human-readable error strings (empty = valid).
 */
export function validateEntries(entries) {
  const errors = [];
  const seen = new Map(); // sid -> index
  const validStatus = new Set(['Active', 'Deprecated', 'Obsoleted']);

  for (const [i, e] of entries.entries()) {
    const where = `entry[${i}]${e.sid ? ` (${e.sid})` : ''}`;
    const parsed = parseSid(e.sid);
    if (!parsed) {
      errors.push(`${where}: malformed or missing sid`);
      continue;
    }
    if (seen.has(e.sid)) {
      errors.push(`${where}: duplicate sid (also entry[${seen.get(e.sid)}])`);
    } else {
      seen.set(e.sid, i);
    }
    if (parsed.series !== e.series) {
      errors.push(`${where}: series "${e.series}" disagrees with sid`);
    }
    if (parsed.kind !== e.kind) {
      errors.push(`${where}: kind "${e.kind}" disagrees with sid`);
    }
    if (!validStatus.has(e.status)) {
      errors.push(`${where}: invalid status "${e.status}"`);
    }
  }

  // obsoletedBy must resolve to a known sid
  for (const [i, e] of entries.entries()) {
    if (e.obsoletedBy && !seen.has(e.obsoletedBy)) {
      errors.push(`entry[${i}] (${e.sid}): obsoletedBy "${e.obsoletedBy}" does not resolve`);
    }
  }

  return errors;
}

/**
 * Ensure the slug<->sid mapping has not changed versus a prior registry (guards against
 * accidental renumbering or reuse). Returns an array of error strings.
 */
export function validateAgainstPrior(priorEntries, nextEntries) {
  const errors = [];
  const priorBySid = new Map(priorEntries.map((e) => [e.sid, e]));
  const priorBySlug = new Map(priorEntries.map((e) => [e.slug, e]));
  const nextBySlug = new Map();

  for (const e of nextEntries) {
    nextBySlug.set(e.slug, e);
    const prior = priorBySid.get(e.sid);
    if (prior && prior.slug !== e.slug) {
      errors.push(`${e.sid}: reassigned from slug "${prior.slug}" to "${e.slug}" (reuse)`);
    }
  }
  for (const prior of priorEntries) {
    const now = nextBySlug.get(prior.slug);
    if (now && now.sid !== prior.sid) {
      errors.push(`slug "${prior.slug}": renumbered from ${prior.sid} to ${now.sid}`);
    }
  }
  return errors;
}
