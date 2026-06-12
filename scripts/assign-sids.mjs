#!/usr/bin/env node
// One-time (idempotent) SID assignment: walk both standards, allocate a SID for every
// rule and whole-doc item that lacks one, embed the anchor-safe SID line into the source
// markdown, and record the allocation in registry.json.
//
// Re-running is safe: units that already carry a SID line (and a matching registry entry)
// are left untouched, and counters continue from the highest assigned number.
//
// Usage: node assign-sids.mjs

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatSid, nextNumber, seriesForStandard } from './lib/sid.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REGISTRY = join(ROOT, 'registry.json');
const TODAY = new Date().toISOString().slice(0, 10);

const STANDARDS = [
  { id: 'code', dir: 'code-standards' },
  { id: 'api', dir: 'api-standards' },
];

const RULE_HEADING = /^###\s+`([^`]+)`\s*$/;
const DOC_H1 = /^#\s+(.+?)\s*$/;
const SID_LINE = /^\s*(?:<a\s+id="SDLC-[A-Z-]+-\d{4,}">\s*<\/a>\s*)?\*\*`?SDLC-[A-Z-]+-\d{4,}`?\*\*\s*$/;

const registry = JSON.parse(readFileSync(REGISTRY, 'utf8'));
const entries = registry.entries;
const bySlug = new Map(entries.map((e) => [`${e.standard}:${e.slug}`, e]));

function sidLine(sid) {
  return `<a id="${sid}"></a>**\`${sid}\`**`;
}

/** Allocate (or reuse) a SID for a unit, recording it in the registry. */
function ensureEntry(standardId, slug, kind, file, section, title) {
  const key = `${standardId}:${slug}`;
  const existing = bySlug.get(key);
  if (existing) return existing.sid;
  const series = seriesForStandard(standardId);
  const sid = formatSid({ series, kind, number: nextNumber(entries, series, kind) });
  const entry = {
    sid,
    repo: 'SDLC',
    series,
    kind,
    slug,
    standard: standardId,
    file,
    section,
    title,
    status: 'Active',
    since: TODAY,
  };
  entries.push(entry);
  bySlug.set(key, entry);
  return sid;
}

function listMarkdown(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

function docSlug(file) {
  const base = basename(file, '.md');
  return base.toLowerCase() === 'readme' ? basename(dirname(file)) : base;
}

let filesChanged = 0;
let sidsAdded = 0;

function nextNonBlank(lines, i) {
  let j = i + 1;
  while (j < lines.length && lines[j].trim() === '') j++;
  return j;
}

/** Insert a SID line immediately after `lines[i]` (the heading). */
function insertSidAfter(lines, i, sid) {
  lines.splice(i + 1, 0, sidLine(sid));
  sidsAdded++;
}

function processGuideline(standardId, dir, rel) {
  const path = join(ROOT, dir, rel);
  const lines = readFileSync(path, 'utf8').split('\n');
  let section = '';
  let mutated = false;
  for (let i = 0; i < lines.length; i++) {
    const h2 = /^##\s+(.+?)\s*$/.exec(lines[i]);
    if (h2 && !lines[i].startsWith('###')) section = h2[1];
    const m = RULE_HEADING.exec(lines[i]);
    if (!m) continue;
    const slug = m[1];
    const sid = ensureEntry(standardId, slug, 'rule', rel, section, slug);
    const j = nextNonBlank(lines, i);
    if (j < lines.length && SID_LINE.test(lines[j])) continue; // already present
    insertSidAfter(lines, i, sid);
    mutated = true;
  }
  if (mutated) {
    writeFileSync(path, lines.join('\n'));
    filesChanged++;
  }
}

function processDoc(standardId, dir, rel, kind) {
  const path = join(ROOT, dir, rel);
  const lines = readFileSync(path, 'utf8').split('\n');
  const slug = docSlug(rel);
  for (let i = 0; i < lines.length; i++) {
    const m = DOC_H1.exec(lines[i]);
    if (!m) continue;
    const sid = ensureEntry(standardId, slug, kind, rel, '', m[1]);
    const j = nextNonBlank(lines, i);
    if (!(j < lines.length && SID_LINE.test(lines[j]))) {
      insertSidAfter(lines, i, sid);
      writeFileSync(path, lines.join('\n'));
      filesChanged++;
    }
    return; // only the first H1
  }
}

for (const std of STANDARDS) {
  const stdDir = join(ROOT, std.dir);
  for (const f of listMarkdown(join(stdDir, 'guidelines'))) {
    processGuideline(std.id, std.dir, `guidelines/${f}`);
  }
  for (const f of listMarkdown(join(stdDir, 'patterns'))) {
    if (basename(f, '.md').toLowerCase() === 'readme') continue;
    processDoc(std.id, std.dir, `patterns/${f}`, 'pattern');
  }
  for (const f of listMarkdown(join(stdDir, 'tooling'))) {
    processDoc(std.id, std.dir, `tooling/${f}`, 'tooling');
  }
}

// Keep the registry in a stable, readable order: by series, kind, then number.
const kindOrder = { rule: 0, pattern: 1, tooling: 2 };
entries.sort((a, b) => {
  if (a.series !== b.series) return a.series < b.series ? -1 : 1;
  if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];
  return Number(a.sid.match(/(\d+)$/)[1]) - Number(b.sid.match(/(\d+)$/)[1]);
});
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + '\n');

console.log(`SIDs added: ${sidsAdded}; source files changed: ${filesChanged}; registry entries: ${entries.length}.`);
