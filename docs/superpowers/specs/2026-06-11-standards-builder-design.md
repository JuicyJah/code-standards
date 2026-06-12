# Standards Builder — Design Spec

**Date:** 2026-06-11
**Status:** Approved for planning
**Repo:** `JuicyJah/code-standards` (public)

## 1. Purpose

Provide a GitHub Pages site that lets a visitor **modularly select and customize**
rules from the repo's two standards (`api-standards`, `code-standards`) and **export
the chosen set as a zip of markdown files**. Selection is at the level of individual
rules; customization includes editing rule text, filling tunable parameters, and adding
org branding. Everything runs client-side — GitHub Pages is static hosting only.

## 2. Goals & non-goals

### Goals
- Browse every rule from both standards, searchable and filterable.
- Select individual rules à la carte.
- Customize selected rules: inline text edits, parameter (placeholder) values, and an
  org preamble/branding block.
- Export as a zip in either of two layouts, chosen at export time:
  - **Combined:** a single `STANDARD.md`.
  - **Mirrored:** the source folder structure, trimmed to selected rules.
- Persist selections/customizations in `localStorage`.
- Share a configuration via URL and via an importable preset `.json`.

### Non-goals (v1)
- Authentication or any server-side state.
- Writing edits back to the source repo.
- Versioning/diffing of exported packs.
- Curated starter presets (deferred; see §10).

## 3. Source content model & required changes

The source markdown is the system of record. Two content changes are part of this work.

### 3.1 Rule unit
- Each `### \`rule-id\`` heading (under a `## Section` heading, inside a numbered
  `guidelines/NN-*.md` file) is the **atomic selectable unit**. Its body is all markdown
  from that heading until the next `###`/`##`/`#`.
- **Patterns** and **tooling** docs are not rule-structured; each such document is a
  single **whole-document** selectable item.
- `CONTRIBUTING.md` and `LICENSE` are not selectable content (LICENSE may be included in
  exports automatically — see §7).

### 3.2 Placeholder convention (comprehensive pass)
- Syntax: `{{param_id|default|label}}`
  - `param_id` — stable, kebab/snake id, unique within its rule.
  - `default` — the value shown when no override is provided; keeps raw markdown legible.
  - `label` — a **readable, sentence-style phrase** describing the value, reused verbatim
    as the form field label.
- Example (in source markdown):
  `A merge is blocked below a coverage floor of {{coverage_floor|80|Minimum test coverage percentage}}%.`
- A placeholder is scoped to the rule it appears in.
- **v1 does a comprehensive pass:** audit all rules across both standards and parameterize
  every genuinely tunable literal (coverage %, version/support windows, rate limits,
  retention periods, etc.). This edits most guideline files and is its own plan phase with
  explicit review. Non-tunable prose is left untouched.

### 3.3 Attribution
- The parser attributes each rule via its path and headings: `standard` (api/code) →
  `file` (e.g. `guidelines/05-testing.md`) → `section` (the `##` title) → `rule-id`
  (the `###` title) → `title` (human title if distinct) → `body` → `params[]`.
- No new front-matter is required unless parsing proves ambiguous; if needed, a minimal
  YAML front-matter block per file may be added in the build phase.

## 4. Architecture

```
source markdown ──(build)──> catalog.json ──> Svelte SPA ──(JSZip)──> downloaded zip
   (repo)         Node script    (index)        (browser)              (user)
```

- **Static, client-side only.** No runtime fetching/parsing of raw `.md`; the browser
  consumes a prebuilt index.
- Source of truth (`api-standards/`, `code-standards/`) is untouched in layout; new code
  lives in `site/` (app) and `scripts/` (build).

## 5. Build pipeline

- `scripts/build-catalog.mjs`:
  - Walks both standards' directories.
  - Parses markdown via `unified`/`remark` AST (not regex) to extract the rule units and
    whole-doc items described in §3.
  - Extracts placeholders per rule (`id`, `default`, `label`).
  - Emits `site/src/catalog.json` (or a build-time import) — the single index the app reads.
- Runs in CI before the app build (§8). Determinism: stable ordering by
  standard → file number → section order → rule order.

### Catalog shape (illustrative)
```json
{
  "standards": [
    {
      "id": "code",
      "title": "Code Standards",
      "files": [
        {
          "path": "guidelines/05-testing.md",
          "title": "05 — Testing",
          "sections": [
            {
              "title": "Coverage",
              "rules": [
                {
                  "id": "test-coverage-floor",
                  "title": "test-coverage-floor",
                  "bodyMarkdown": "...",
                  "params": [
                    { "id": "coverage_floor", "default": "80",
                      "label": "Minimum test coverage percentage" }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "documents": [
        { "kind": "pattern", "path": "patterns/webhooks.md",
          "title": "Webhooks", "bodyMarkdown": "..." }
      ]
    }
  ]
}
```

## 6. Application (Svelte + Vite + TypeScript + JSZip)

### 6.1 Stack
- **Svelte + Vite + TypeScript**, **JSZip** for zip assembly, a markdown renderer
  (`marked` or `markdown-it`) for previews. Chosen for a reactive UI over ~150 filterable
  items with inline editors and live parameter forms.

### 6.2 Views
1. **Browse / Select**
   - Searchable, filterable list grouped by standard → file → section.
   - Filters: standard (api/code), file, section, full-text.
   - Each rule is a card: rendered text, a select toggle, and a param-present indicator.
   - Whole-doc items (patterns/tooling) shown as selectable cards in their own group.
2. **Customize**
   - Lists selected items only.
   - Per rule: inline **text override** editor (defaults to source body) and **parameter
     form fields** (one per placeholder, labeled with the placeholder `label`, prefilled
     with `default`).
   - Global **org panel:** org name, preamble/intro markdown, optional footer/branding —
     stamped into generated README/preamble on export.
3. **Export**
   - Layout toggle: **Combined** vs **Mirrored**.
   - Summary of what's included; **Download zip** button.

### 6.3 State store
- Holds: selected rule ids + selected doc paths, per-rule text overrides, per-param
  values, and org metadata.
- Serialized to:
  - `localStorage` (auto-save/restore across reloads).
  - A compact **URL encoding** (shareable link) and a downloadable/importable **preset
    `.json`** (team sharing). Text overrides may be large; URL carries selection + params,
    while full preset `.json` carries everything including overrides. (URL omits bulky
    overrides to stay within practical length; preset is the lossless channel.)

## 7. Export logic

For each selected rule:
1. Start from the override text if present, else the source body.
2. Substitute placeholders: replace each `{{id|default|label}}` with the user's value (or
   `default` if untouched).
3. Emit clean markdown.

- **Combined mode:** one `STANDARD.md` — org preamble, then rules grouped by
  standard → section, each under appropriate headings.
- **Mirrored mode:** reconstruct `<standard>/guidelines/NN-*.md` etc. containing only the
  selected rules (preserving section headings), omit files/sections with no selections,
  copy selected whole-docs verbatim, and generate a top-level `README.md` listing included
  content and the org preamble. `LICENSE` files for any standard with included content are
  copied through.
- Zip built in-browser via JSZip and downloaded (filename includes org name when set).
- Ends every generated file with a trailing newline.

## 8. Deployment

- Pages source: **GitHub Actions**.
- `.github/workflows/pages.yml`: checkout → Node setup → `node scripts/build-catalog.mjs`
  → `npm --prefix site ci && npm --prefix site run build` → upload artifact →
  `actions/deploy-pages`.
- App is configured with the correct `base` path for the project Pages URL.

## 9. Repo layout (added)

```
scripts/build-catalog.mjs        # source md -> catalog.json
site/                            # Svelte + Vite app
  src/ (components, store, export, catalog.json)
  package.json, vite.config.ts
.github/workflows/pages.yml      # build + deploy
docs/superpowers/specs/…         # this spec
```
`api-standards/` and `code-standards/` remain the source of truth (gaining placeholder
syntax in their rule bodies).

## 10. Deferred / future

- Curated starter presets ("Minimal", "Strict", "API-only") loadable as starting points.
- Diff/version awareness of exported packs.
- Per-rule rationale tooltips, copy-as-markdown for single rules.

## 11. Testing strategy

- **Build script:** unit tests on a fixture markdown tree — rule extraction, section
  attribution, placeholder parsing (including malformed placeholders), whole-doc handling.
- **Export logic:** unit tests — placeholder substitution, combined vs mirrored output,
  empty-file omission, trailing newline, override application.
- **State:** round-trip tests for localStorage, URL encode/decode, and preset import/export.
- **Smoke:** a headless check that the built site loads `catalog.json` and produces a
  non-empty zip for a sample selection.
