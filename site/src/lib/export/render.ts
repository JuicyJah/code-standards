// Pure rendering helpers for export: parameter substitution and per-unit markdown.

import type { Unit } from '../types';
import type { OrgMeta } from '../store.svelte';

// Re-export the OrgMeta shape from the store for callers.
export type { OrgMeta } from '../store.svelte';

const PARAM_RE = /\{\{\s*([^|{}]+?)\s*\|([^|{}]*)\|([^{}]*?)\}\}/g;

/**
 * Replace every `{{id|default|label}}` placeholder with the user's value for that id, or
 * the default when no value was provided. An explicitly empty value is honored.
 */
export function substituteParams(markdown: string, values: Record<string, string>): string {
  return markdown.replace(PARAM_RE, (_full, rawId: string, def: string) => {
    const id = rawId.trim();
    return Object.prototype.hasOwnProperty.call(values, id) ? values[id] : def.trim();
  });
}

/** The final body for a unit: override text if present, else source body; then substitute. */
export function renderBody(
  unit: Unit,
  override: string | undefined,
  paramValues: Record<string, string> | undefined,
): string {
  const base = override ?? unit.bodyMarkdown;
  return substituteParams(base, paramValues ?? {});
}

/** Ensure a string ends with exactly one trailing newline. */
export function withTrailingNewline(s: string): string {
  return s.replace(/\s*$/, '') + '\n';
}

/** A heading line plus optional SID line, matching the source embedding convention. */
export function ruleHeading(unit: Unit): string {
  const head = `### \`${unit.id}\``;
  if (!unit.sid) return head;
  return `${head}\n<a id="${unit.sid}"></a>**\`${unit.sid}\`**`;
}

/** Build the org preamble block (title + preamble markdown) if any org data is set. */
export function orgPreamble(org: OrgMeta): string {
  const parts: string[] = [];
  if (org.name.trim()) parts.push(`# ${org.name.trim()} Standards`);
  if (org.preamble.trim()) parts.push(org.preamble.trim());
  return parts.join('\n\n');
}

/** Build the org footer block if set. */
export function orgFooter(org: OrgMeta): string {
  return org.footer.trim();
}
