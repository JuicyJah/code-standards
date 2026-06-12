# Standards Identifier (SID) Numbering Standard

This repository assigns a permanent numeric identifier — a **Standards Identifier
(SID)** — to every selectable unit of its standards: each individual guideline **rule**
and each whole **pattern** or **tooling** document. The scheme is modeled on IETF RFC
numbering: identifiers are **opaque, sequentially assigned from a registry, permanent,
and never reused.**

The human-readable slug (e.g. `test-coverage-floor`) is retained as a mnemonic alias.
The canonical citation pairs the two: **`SDLC-CODE-0042` (`test-coverage-floor`)**.

## Format

```
SID    = REPO "-" SERIES [ "-" KIND ] "-" NUMBER
REPO   = "SDLC"        ; the overall standards repository (fixed prefix)
SERIES = "API"         ; API Standards
       | "CODE"        ; Code Standards
KIND   = "P"           ; pattern document   (absent for guideline rules)
       | "T"           ; tooling document
NUMBER = 4*DIGIT       ; zero-padded, at least four digits
```

Examples:

| SID                | Refers to                              |
|--------------------|----------------------------------------|
| `SDLC-CODE-0042`   | a Code Standards guideline rule        |
| `SDLC-API-0001`    | an API Standards guideline rule        |
| `SDLC-CODE-P-0001` | a Code Standards pattern document      |
| `SDLC-API-T-0001`  | an API Standards tooling document      |

## Properties

- **Opaque.** The number encodes no location. A rule may be moved between files or
  sections, or regrouped, without ever changing its SID.
- **Permanent and unique.** Once assigned, a SID is never changed and never reused —
  even after the rule it named is removed.
- **Monotonic per counter.** Each `(SERIES, KIND)` pair has its own counter. Numbers are
  assigned in increasing order; **gaps are permitted** — a retired number is skipped, not
  recycled.
- **Status, not renumbering.** A unit's lifecycle is tracked by status, not by changing
  its number:
  - `Active` — current and in force.
  - `Deprecated` — discouraged; retained for compatibility.
  - `Obsoleted` — superseded; the entry keeps its number and gains an `obsoletedBy`
    pointer to the SID that replaces it (RFC-style).

## Registry

`registry.json` at the repository root is the allocation ledger and source of truth. Each
entry records:

| Field         | Meaning                                                        |
|---------------|----------------------------------------------------------------|
| `sid`         | the identifier, e.g. `SDLC-CODE-0042`                          |
| `repo`        | always `SDLC`                                                  |
| `series`      | `API` or `CODE`                                               |
| `kind`        | `rule`, `pattern`, or `tooling`                               |
| `slug`        | the mnemonic alias (rule id or doc slug)                      |
| `standard`    | `api` or `code`                                              |
| `file`        | source path, e.g. `guidelines/05-testing.md`                 |
| `section`     | the `##` section title (rules only)                          |
| `title`       | human title                                                  |
| `status`      | `Active` \| `Deprecated` \| `Obsoleted`                      |
| `since`       | ISO date the SID was assigned                                |
| `obsoletedBy` | (optional) the SID that supersedes this one                  |

## Embedding in source markdown

Existing cross-references rely on slug anchors (e.g. `#test-coverage-gate`) and must keep
working. Therefore the rule heading text is **left unchanged** — `` ### `rule-id` `` — so
the GitHub auto-generated anchor is preserved, and the SID is placed on the line
immediately beneath the heading, with an explicit HTML anchor for numeric linking:

```markdown
### `test-coverage-floor`
<a id="SDLC-CODE-0042"></a>**`SDLC-CODE-0042`**

A merge is blocked below a coverage floor of …
```

A whole pattern/tooling document carries its SID directly under the document's `#` title:

```markdown
# Webhooks
<a id="SDLC-CODE-P-0001"></a>**`SDLC-CODE-P-0001`**
```

## Allocating a new SID

1. Choose the counter from the unit's `(SERIES, KIND)` — e.g. a new Code rule uses the
   `CODE` rule counter.
2. Take the next free number for that counter (highest assigned + 1; never a gap-fill).
3. Add an entry to `registry.json` with `status: "Active"` and today's date in `since`.
4. Embed the SID in the source markdown as shown above.

The helper `scripts/assign-sids.mjs` automates steps 2–4: it allocates the next free
number for every rule/doc that lacks one, embeds the SID line in source, and records the
entry in `registry.json`. It is idempotent — re-running leaves already-assigned units
untouched.

The build script (`scripts/build-catalog.mjs --strict`) enforces all of this and fails CI
on any violation: malformed or duplicate SIDs, a SID present in source but missing from
the registry (or vice versa), a `slug ↔ sid` mapping that changed versus the committed
registry, or an `obsoletedBy` that does not resolve.
