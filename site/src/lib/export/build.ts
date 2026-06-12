// Assemble the export file map from the catalog + the user's selection/customizations.
//
// Two layouts (spec §7):
//   - combined: a single STANDARD.md
//   - mirrored: the source folder structure, trimmed to selected units, + README + LICENSE

import type { Catalog, Standard, Unit, Param } from '../types';
import type { OrgMeta } from '../store.svelte';
import { unitKey } from '../catalog';
import {
  renderExportBody,
  ruleHeading,
  orgPreamble,
  orgFooter,
  withTrailingNewline,
} from './render';

export interface BuildInput {
  catalog: Catalog;
  selected: Set<string>;
  overrides: Record<string, string>;
  params: Record<string, Record<string, string>>;
  org: OrgMeta;
}

export type FileMap = Record<string, string>;

function isSelected(input: BuildInput, standardId: string, kind: string, slug: string): boolean {
  return input.selected.has(unitKey(standardId, kind, slug));
}

function bodyFor(
  input: BuildInput,
  unit: Pick<Unit, 'key' | 'bodyMarkdown' | 'sid' | 'id'> & { params: Param[] },
): string {
  return renderExportBody(unit as Unit, input.overrides[unit.key], input.params[unit.key]);
}

/** Units selected within a standard, preserving source order, with resolved bodies. */
interface SelectedFile {
  path: string;
  title: string;
  sections: { title: string; rules: { unit: Unit; body: string }[] }[];
}
interface SelectedStandard {
  standard: Standard;
  files: SelectedFile[];
  docs: { unit: Unit; body: string }[];
  hasAny: boolean;
}

function collect(input: BuildInput): SelectedStandard[] {
  const out: SelectedStandard[] = [];
  for (const std of input.catalog.standards) {
    const files: SelectedFile[] = [];
    for (const file of std.files) {
      const sections = [];
      for (const section of file.sections) {
        const rules = [];
        for (const rule of section.rules) {
          if (!isSelected(input, std.id, 'rule', rule.id)) continue;
          const unit: Unit = {
            key: unitKey(std.id, 'rule', rule.id),
            kind: 'rule',
            standardId: std.id,
            standardTitle: std.title,
            filePath: file.path,
            fileTitle: file.title,
            section: section.title,
            id: rule.id,
            sid: rule.sid,
            status: rule.status,
            title: rule.title,
            bodyMarkdown: rule.bodyMarkdown,
            params: rule.params,
          };
          rules.push({ unit, body: bodyFor(input, unit) });
        }
        if (rules.length) sections.push({ title: section.title, rules });
      }
      if (sections.length) files.push({ path: file.path, title: file.title, sections });
    }
    const docs = [];
    for (const doc of std.documents) {
      if (!isSelected(input, std.id, doc.kind, doc.id)) continue;
      const unit: Unit = {
        key: unitKey(std.id, doc.kind, doc.id),
        kind: doc.kind,
        standardId: std.id,
        standardTitle: std.title,
        filePath: doc.path,
        fileTitle: doc.title,
        section: '',
        id: doc.id,
        sid: doc.sid,
        status: doc.status,
        title: doc.title,
        bodyMarkdown: doc.bodyMarkdown,
        params: doc.params,
      };
      docs.push({ unit, body: bodyFor(input, unit) });
    }
    out.push({ standard: std, files, docs, hasAny: files.length > 0 || docs.length > 0 });
  }
  return out;
}

/** Count selected units across all standards. */
export function selectionCount(input: BuildInput): number {
  return collect(input).reduce(
    (n, s) =>
      n +
      s.docs.length +
      s.files.reduce((m, f) => m + f.sections.reduce((k, sec) => k + sec.rules.length, 0), 0),
    0,
  );
}

/** Build the single combined STANDARD.md. */
export function buildCombined(input: BuildInput): string {
  const blocks: string[] = [];
  const preamble = orgPreamble(input.org);
  blocks.push(preamble || '# Selected Standards');

  for (const s of collect(input)) {
    if (!s.hasAny) continue;
    blocks.push(`## ${s.standard.title}`);
    for (const file of s.files) {
      blocks.push(`### ${file.title}`);
      for (const section of file.sections) {
        if (section.title) blocks.push(`#### ${section.title}`);
        for (const { unit, body } of section.rules) {
          const label = unit.sid ? `\`${unit.sid}\` · \`${unit.id}\`` : `\`${unit.id}\``;
          blocks.push(`**${label}**\n\n${body}`);
        }
      }
    }
    if (s.docs.length) {
      blocks.push(`### Patterns & tooling`);
      for (const { unit, body } of s.docs) {
        const label = unit.sid ? `\`${unit.sid}\` · ${unit.title}` : unit.title;
        blocks.push(`#### ${label}\n\n${body}`);
      }
    }
  }

  const footer = orgFooter(input.org);
  if (footer) blocks.push(`---\n\n${footer}`);
  return withTrailingNewline(blocks.join('\n\n'));
}

/** Reconstruct a single guideline file with only its selected rules. */
function renderGuidelineFile(file: SelectedFile): string {
  const parts: string[] = [`# ${file.title}`];
  for (const section of file.sections) {
    if (section.title) parts.push(`## ${section.title}`);
    for (const { unit, body } of section.rules) {
      parts.push(`${ruleHeading(unit)}\n\n${body}`);
    }
  }
  return withTrailingNewline(parts.join('\n\n'));
}

/** Reconstruct a whole-document item. */
function renderDoc(doc: { unit: Unit; body: string }): string {
  const sidLine = doc.unit.sid
    ? `\n<a id="${doc.unit.sid}"></a>**\`${doc.unit.sid}\`**\n`
    : '\n';
  return withTrailingNewline(`# ${doc.unit.title}${sidLine}\n${doc.body}`);
}

/** Build the mirrored folder structure as a file map. */
export function buildMirrored(input: BuildInput): FileMap {
  const map: FileMap = {};
  const indexLines: string[] = [];

  for (const s of collect(input)) {
    if (!s.hasAny) continue;
    const dir = s.standard.dir;
    indexLines.push(`## ${s.standard.title}`);

    for (const file of s.files) {
      map[`${dir}/${file.path}`] = renderGuidelineFile(file);
      for (const section of file.sections) {
        for (const { unit } of section.rules) {
          indexLines.push(`- ${unit.sid ? `\`${unit.sid}\` ` : ''}\`${unit.id}\` — ${file.title}`);
        }
      }
    }
    for (const doc of s.docs) {
      map[`${dir}/${doc.unit.filePath}`] = renderDoc(doc);
      indexLines.push(`- ${doc.unit.sid ? `\`${doc.unit.sid}\` ` : ''}${doc.unit.title} (${doc.unit.kind})`);
    }
    if (s.standard.license) {
      map[`${dir}/LICENSE`] = withTrailingNewline(s.standard.license);
    }
  }

  // Top-level README: org preamble (or default) + index of included units.
  const head = orgPreamble(input.org) || '# Selected Standards';
  const readmeParts = [head, '## Included', indexLines.join('\n')];
  const footer = orgFooter(input.org);
  if (footer) readmeParts.push(`---\n\n${footer}`);
  map['README.md'] = withTrailingNewline(readmeParts.join('\n\n'));

  return map;
}

/** Build the file map for the chosen layout. */
export function buildFileMap(input: BuildInput, layout: 'combined' | 'mirrored'): FileMap {
  if (layout === 'combined') {
    return { 'STANDARD.md': buildCombined(input) };
  }
  return buildMirrored(input);
}
