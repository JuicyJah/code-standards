# SDLC Standards

**Public SDLC standards for enterprise software development at scale.**

A vendor-neutral, language-agnostic body of software-development standards that an
organization can adopt as-is, fork, or use as a baseline to extend. The standards are
written to hold across the whole software development lifecycle — how code is written,
reviewed, tested, secured, and shipped, and how the APIs it exposes are designed and
evolved — without prescribing any single language, framework, or product.

Where a rule needs a concrete tool to enforce it, it names a *category* of tool (a
formatter, a linter, a coverage gate, a secret scanner) rather than a specific vendor, so
the same standard applies to a Python service, a Go CLI, a TypeScript front end, a Rust
library, or a Java monolith alike.

## Why standards at scale

When every team picks its own formatting, testing bar, commit hygiene, error conventions,
and API shape, the cost compounds across the organization: reviews argue over style
instead of substance, bugs hide in untested paths, integrations break on inconsistent
contracts, and onboarding slows to a crawl. A shared, explicit standard turns "learn how
this team does it" into "learn how we do it" — once. At enterprise scale, that
consistency is the difference between many codebases and one coherent engineering
practice.

## What's in here

Two standards, each a set of numbered guideline rules plus supporting patterns and
tooling guidance:

| Standard | Scope | Path |
|---|---|---|
| **Code Standards** | Writing source: style, version control, review, testing, documentation, error handling, observability, security, dependencies, governance | [`code-standards/`](code-standards/README.md) |
| **API Standards** | Designing HTTP/REST APIs: naming, resources, methods, errors, collections, versioning, security, rate limiting, governance | [`api-standards/`](api-standards/README.md) |

Each standard contains:

- **`guidelines/`** — the normative rules, grouped into numbered files. Every rule has a
  stable slug (e.g. `test-coverage-floor`) and a permanent identifier (see below).
- **`patterns/`** — reusable, opt-in patterns (idempotency keys, webhooks, feature flags,
  trunk-based development, …) with explicit "when to use" guidance.
- **`tooling/`** — how to enforce the rules in CI, mapped to categories of tool per
  ecosystem.

Requirement levels follow [RFC 2119 / RFC 8174](https://www.rfc-editor.org/rfc/rfc2119) —
the keywords **MUST**, **SHOULD**, **MAY**, etc. carry their normative meaning only when
uppercase.

## Standards Identifiers (SIDs)

Every selectable unit — each rule and each pattern/tooling document — carries a permanent,
opaque identifier modeled on IETF RFC numbering: assigned once from a registry, never
reused, never renumbered. The format is `SDLC-<SERIES>[-<KIND>]-<NNNN>`, for example:

- `SDLC-CODE-0042` — a Code Standards rule
- `SDLC-API-0001` — an API Standards rule
- `SDLC-CODE-P-0001` — a Code Standards pattern document

The numbering scheme is itself documented as a standard in [`NUMBERING.md`](NUMBERING.md),
and the allocation ledger lives in [`registry.json`](registry.json). This lets a team cite
exactly which rules they adopt — `SDLC-CODE-0042` (`test-coverage-floor`) — even as the
documents evolve.

## Standards Builder

This repo ships an interactive **Standards Builder** (a static site, deployable to GitHub
Pages) that lets a team assemble its own standard:

- **Browse & select** any subset of rules and patterns across both standards.
- **Customize** — edit rule text, set tunable parameters (coverage floor, retention
  windows, rate limits, …), and add an organization preamble and branding.
- **Export** the result as a zip of markdown — either one combined `STANDARD.md` or a
  mirrored folder structure — ready to drop into a repo.
- **Share** a selection by link or by an importable preset file.

The standards are written to stay abstract ("a documented retention window"); the Builder
lets an adopting organization fill in concrete values, and those values materialize only in
the exported pack — the canonical standards remain tool- and value-neutral.

### Running the Builder locally

```bash
cd site
npm install
npm run dev        # serves the builder at http://localhost:5173
```

The build script parses the markdown into a catalog the app consumes:

```bash
cd scripts && npm install && npm test    # build tooling + SID validation
```

### Deployment

The Builder deploys to GitHub Pages via [`.github/workflows/pages.yml`](.github/workflows/pages.yml)
on push to `master`. Enable it under **Settings → Pages → Source: GitHub Actions**; the
site then publishes at `https://<owner>.github.io/code-standards/`.

## Adopting the standards

You can adopt these standards in any of three ways:

1. **As-is** — reference this repository (or a pinned commit) as your standard and cite
   rules by SID.
2. **Curated** — use the Standards Builder to select the rules you want, set your
   parameters, and export a tailored markdown pack into your own repo.
3. **Forked** — fork the repository and extend it; keep the SID scheme so your additions
   remain citable and your CI can validate them.

## Repository layout

```
code-standards/      # the Code Standards (guidelines, patterns, tooling)
api-standards/       # the API Standards (guidelines, patterns, tooling)
NUMBERING.md         # the SID numbering standard
registry.json        # SID allocation ledger (source of truth)
scripts/             # build tooling: markdown -> catalog.json, SID validation
site/                # the Standards Builder web app (Svelte + Vite)
.github/workflows/   # CI + GitHub Pages deployment
docs/                # design specs and implementation plans
```

## Contributing

See each standard's `CONTRIBUTING.md`
([code](code-standards/CONTRIBUTING.md), [api](api-standards/CONTRIBUTING.md)) for how
rules are proposed and changed, and [`NUMBERING.md`](NUMBERING.md) for how to allocate a
SID when adding a rule. New rules are allocated a SID with `scripts/assign-sids.mjs`, and
CI fails on any SID or registry inconsistency.

## License

Each standard is licensed under its own `LICENSE` file
([code](code-standards/LICENSE), [api](api-standards/LICENSE)).
