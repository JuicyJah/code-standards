# Standards Builder — Implementation Plan

**Spec:** `2026-06-11-standards-builder-design.md`
**Date:** 2026-06-11

Phases are ordered so the pipeline is provable on a small slice before the large content
pass. Each phase ends in a committable, verifiable state.

## Phase 0 — Scaffolding
- `site/` Svelte + Vite + TypeScript app (`npm create vite` template, manual to keep it
  lean), with `JSZip`, a markdown renderer (`marked`), and a test runner (`vitest`).
- `scripts/` directory for the Node build script; root `package.json` workspaces or a
  simple `scripts/package.json` with `unified`/`remark` deps.
- Placeholder `catalog.json` so the app builds before the real parser exists.
- **Verify:** `npm --prefix site run build` succeeds; dev server renders a stub page.

## Phase 1 — SID numbering standard + registry tooling
- Author `NUMBERING.md` (root) documenting the SID standard (§3.4 of the spec).
- Define `registry.json` schema and seed it empty.
- Write a `scripts/lib/sid.mjs` module: parse/format/validate SID strings, allocate next
  number per (series, kind).
- **Verify:** unit tests for SID format/allocation pass.

## Phase 2 — Build script (parse → catalog + validation)
- `scripts/build-catalog.mjs`: walk both standards, parse markdown via `unified`/`remark`,
  extract rules (heading → SID line → body → params), whole-doc items, and attribution.
- Placeholder parser for `{{id|default|label}}`.
- Validation: SID format/uniqueness/registry-agreement/no-reuse-vs-prior-registry,
  `obsoletedBy` resolution; non-zero exit on violation.
- Emits `site/src/catalog.json`.
- **Verify:** vitest unit tests over a fixture markdown tree; run against real content
  (initially tolerant of missing SIDs via a `--seed` mode used during Phase 4).

## Phase 3 — App: browse / select
- State store (selection ids, doc paths) with `localStorage` persistence.
- Browse view: grouped list (standard → file → section), filters (standard/file/section/
  status/full-text incl. SID & slug), rule cards showing SID + rendered markdown + toggle.
- **Verify:** select rules, reload page, selection persists; filters work.

## Phase 4 — Content pass (placeholders + SIDs) — the large phase
- Per file, in reviewed batches: assign SIDs (embed anchor-safe line under each rule
  heading; doc SIDs under H1), register in `registry.json`, and parameterize tunable
  literals with readable labels.
- Order: `code-standards/guidelines/*` → `code-standards/patterns,tooling` →
  `api-standards/guidelines/*` → `api-standards/patterns,tooling`.
- Run `build-catalog.mjs` after each batch; fix validation failures before moving on.
- **Verify:** full catalog builds clean with all SIDs; spot-check anchors still resolve.

## Phase 5 — App: customize
- Customize view for selected items: inline text-override editor (defaults to source
  body), parameter form fields (labeled by placeholder `label`, prefilled with `default`).
- Org panel: name, preamble markdown, optional footer/branding.
- Extend store + `localStorage` to hold overrides, param values, org metadata.
- **Verify:** edit text/params, reload, values persist; clearing a field restores default.

## Phase 6 — Export
- `site/src/export/` modules: placeholder substitution, combined-file builder, mirrored-
  structure builder, README/preamble generation, trailing-newline enforcement, LICENSE
  passthrough; zip via JSZip; filename includes org name.
- Export view: layout toggle (combined | mirrored), inclusion summary, download button.
- **Verify:** unit tests for both layouts (substitution, empty-file omission, newline);
  manual export of a sample selection yields a valid, openable zip.

## Phase 7 — Sharing & presets
- URL encoding of selection + params (compact, omits bulky text overrides).
- Importable/exportable preset `.json` (lossless, includes overrides).
- **Verify:** round-trip tests (encode→decode, preset import→export); shared URL
  reconstructs a selection in a fresh session.

## Phase 8 — Deploy
- `.github/workflows/pages.yml`: build catalog → build app → `actions/deploy-pages`.
- Set Vite `base` to the project Pages path; Pages source = GitHub Actions.
- **Verify:** workflow runs green on a branch; deployed site loads catalog and exports a
  zip end-to-end.

## Cross-cutting
- Every generated/edited file ends with a trailing newline.
- Tests live beside their units; `vitest` for app + build script.
- Keep `api-standards/`/`code-standards/` layout intact; new code in `site/`, `scripts/`,
  plus root `NUMBERING.md` and `registry.json`.

## Sequencing note
Phases 0–3 stand up the pipeline and UI against existing content (tolerating absent SIDs).
Phase 4 is the bulk content effort and is isolated so it can proceed in reviewed batches
without blocking app development. Phases 5–8 complete customization, export, sharing, and
deploy.
