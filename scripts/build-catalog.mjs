#!/usr/bin/env node
// Build the standards catalog: parse both standards' markdown into a single catalog.json
// the web app consumes, and validate the SID registry (NUMBERING.md).
//
// Usage:
//   node build-catalog.mjs            # lenient: warns on missing/mismatched SIDs
//   node build-catalog.mjs --strict   # CI: any SID/registry problem is a failure
//
// Exit code is non-zero when validation fails in --strict mode (or on a hard error).

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseGuidelineFile, parseDocFile } from './lib/parse.mjs';
import { validateEntries, validateAgainstPrior, seriesForStandard } from './lib/sid.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'site', 'src', 'catalog.json');

const STRICT = process.argv.includes('--strict');

const STANDARDS = [
  { id: 'code', dir: 'code-standards', title: 'Code Standards' },
  { id: 'api', dir: 'api-standards', title: 'API Standards' },
];

const problems = [];
function problem(msg) {
  problems.push(msg);
}

function listMarkdown(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

/** Doc slug: filename without .md; a README falls back to its parent directory name. */
function docSlug(file) {
  const base = basename(file, '.md');
  return base.toLowerCase() === 'readme' ? basename(dirname(file)) : base;
}

function loadRegistry() {
  const path = join(ROOT, 'registry.json');
  const reg = JSON.parse(readFileSync(path, 'utf8'));
  return reg.entries ?? [];
}

function loadPriorRegistry() {
  try {
    const json = execFileSync('git', ['show', 'HEAD:registry.json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(json).entries ?? [];
  } catch {
    return null; // not in git / file is new — nothing to compare against
  }
}

function main() {
  const registry = loadRegistry();
  const regBySlug = new Map(registry.map((e) => [`${e.standard}:${e.slug}`, e]));

  // Validate the registry itself.
  for (const e of validateEntries(registry)) problem(`registry: ${e}`);
  const prior = loadPriorRegistry();
  if (prior) {
    for (const e of validateAgainstPrior(prior, registry)) problem(`registry: ${e}`);
  }

  const usedRegistryKeys = new Set();

  /** Attach sid/status from the registry to a parsed unit; cross-check embedded sid. */
  function withRegistry(standardId, slug, parsedSid, kind) {
    const key = `${standardId}:${slug}`;
    const entry = regBySlug.get(key);
    if (entry) {
      usedRegistryKeys.add(key);
      if (parsedSid && parsedSid !== entry.sid) {
        problem(`${key}: embedded SID ${parsedSid} != registry ${entry.sid}`);
      }
      if (entry.kind !== kind) {
        problem(`${key}: registry kind ${entry.kind} != parsed kind ${kind}`);
      }
      return { sid: entry.sid, status: entry.status };
    }
    // No registry entry.
    problem(`${key}: ${kind} has no registry entry (expected SID ${seriesForStandard(standardId)})`);
    return { sid: parsedSid ?? null, status: parsedSid ? 'Active' : 'Unregistered' };
  }

  const catalog = { generatedFrom: 'registry.json + standards markdown', standards: [] };

  for (const std of STANDARDS) {
    const stdDir = join(ROOT, std.dir);
    const licensePath = join(stdDir, 'LICENSE');
    const license = existsSync(licensePath) ? readFileSync(licensePath, 'utf8') : null;
    const stdOut = { id: std.id, title: std.title, dir: std.dir, license, files: [], documents: [] };

    // Guideline files.
    for (const f of listMarkdown(join(stdDir, 'guidelines'))) {
      const rel = `guidelines/${f}`;
      const source = readFileSync(join(stdDir, rel), 'utf8');
      const parsed = parseGuidelineFile(rel, source);
      const fileOut = { path: rel, title: parsed.title, sections: [] };
      for (const section of parsed.sections) {
        if (section.rules.length === 0) continue;
        const rulesOut = section.rules.map((r) => {
          const { sid, status } = withRegistry(std.id, r.slug, r.sid, 'rule');
          return {
            id: r.slug,
            sid,
            status,
            title: r.title,
            bodyMarkdown: r.bodyMarkdown,
            params: r.params,
          };
        });
        fileOut.sections.push({ title: section.title, rules: rulesOut });
      }
      if (fileOut.sections.length) stdOut.files.push(fileOut);
    }

    // Pattern + tooling docs (whole-document units). Skip the patterns index README.
    for (const [sub, kind] of [
      ['patterns', 'pattern'],
      ['tooling', 'tooling'],
    ]) {
      for (const f of listMarkdown(join(stdDir, sub))) {
        const rel = `${sub}/${f}`;
        if (sub === 'patterns' && basename(f, '.md').toLowerCase() === 'readme') continue;
        const source = readFileSync(join(stdDir, rel), 'utf8');
        const slug = docSlug(rel);
        const parsed = parseDocFile(rel, source, { kind, slug });
        const { sid, status } = withRegistry(std.id, slug, parsed.sid, kind);
        stdOut.documents.push({
          kind,
          id: slug,
          sid,
          status,
          path: rel,
          title: parsed.title,
          bodyMarkdown: parsed.bodyMarkdown,
          params: parsed.params ?? [],
        });
      }
    }

    catalog.standards.push(stdOut);
  }

  // Registry entries with no matching source unit (allowed only when Obsoleted).
  for (const e of registry) {
    const key = `${e.standard}:${e.slug}`;
    if (!usedRegistryKeys.has(key) && e.status !== 'Obsoleted') {
      problem(`registry: ${e.sid} (${key}) has no matching source unit`);
    }
  }

  // Report.
  const ruleCount = catalog.standards.reduce(
    (n, s) => n + s.files.reduce((m, f) => m + f.sections.reduce((k, sec) => k + sec.rules.length, 0), 0),
    0,
  );
  const docCount = catalog.standards.reduce((n, s) => n + s.documents.length, 0);

  if (problems.length) {
    const head = `${problems.length} catalog/registry issue(s):`;
    const body = problems.map((p) => `  - ${p}`).join('\n');
    if (STRICT) {
      console.error(`${head}\n${body}`);
      process.exitCode = 1;
      return;
    }
    console.warn(`${head}\n${body}\n(lenient mode — not failing; run with --strict in CI)`);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Wrote ${OUT}: ${ruleCount} rules, ${docCount} documents.`);
}

main();
