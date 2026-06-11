# Contributing to the Universal REST API Standard

This standard is a living document (see
[`governance-evolve-standard`](guidelines/12-governance.md#governance-evolve-standard)).
It improves when real-world use surfaces a gap, an ambiguity, or a rule that proves
wrong in practice. This guide explains how to propose a change.

By contributing, you agree that your contribution is licensed under the
[CC BY 4.0](LICENSE) license that covers this work.

## Principles for changes

Before proposing a change, weigh it against the
[design principles](guidelines/01-design-principles.md) — especially
`principle-minimal-surface`. Every rule a reader must learn has a cost. A change
earns its place only if it makes APIs measurably more consistent, safer, or more
evolvable.

- **Prefer the standard, not the dialect.** Justify rules from published web
  standards (HTTP, URI, JSON, OAuth, and related RFCs) and broad industry practice —
  not from one organization's house style. If a rule only makes sense for one
  company, cloud, or framework, it does not belong here.
- **Don't over-specify.** Where the industry genuinely splits and both options work
  (e.g. URL vs header versioning), the standard says "pick one and be consistent"
  rather than mandating a winner. Resist the urge to force a single choice without a
  strong, neutral reason.
- **Keep tiers honest.** A rule is `MUST` only if violating it genuinely breaks
  interoperability, safety, or compatibility. Otherwise it is `SHOULD` or `MAY`.

## What a good rule looks like

Every normative rule in `guidelines/` follows the same shape:

- A stable, kebab-case **rule identifier** in backticks as its heading
  (e.g. `url-casing`). Identifiers are permanent — tooling, reviews, and exception
  records reference them. **Never reuse or repurpose an identifier**; retire it and
  mint a new one instead.
- A single normative statement led by an [RFC 2119](LICENSE) keyword
  (**MUST** / **SHOULD** / **MAY** / **MUST NOT** / **SHOULD NOT**).
- A short **rationale** — *why* the rule exists. A rule without a reason gets
  cargo-culted and then ignored.
- Where useful, a concrete HTTP/JSON **example**.

Each topic document ends with a **Common mistakes** section; add to it when a rule
addresses a frequent real-world error.

## How to propose a change

1. **Open an issue first** describing the problem the change solves, with a concrete
   example of an API that the current standard handles badly. Changes that start
   from a real pain point land better than changes that start from a preference.
2. **Discuss the tier and wording.** Is it `MUST` or `SHOULD`? Does it conflict with
   an existing rule? Does it need a new rule identifier or an edit to an existing one?
3. **Open a pull request** that:
   - Edits the relevant `guidelines/` document (or adds a `patterns/` entry using the
     [pattern template](patterns/README.md#pattern-template)).
   - Adds or updates the corresponding [lint rule](tooling/README.md) when the rule
     is machine-checkable, referencing the rule identifier.
   - Updates cross-references and the `README.md` index if you added a document.
   - Notes the change in a changelog entry.

## Changing an existing rule

- **Clarifying** wording or rationale without changing meaning: straightforward;
  call it out as non-normative in the PR.
- **Tightening** a rule (e.g. `SHOULD` → `MUST`, or narrowing what is allowed): treat
  it like a breaking change to consumers of the standard. Explain the migration cost
  for already-conformant APIs and why it is worth it.
- **Removing** a rule: state what replaces it (if anything) and retire its identifier
  rather than deleting it silently, so existing exception records and lint configs
  remain traceable.

## Adding a pattern

Patterns are optional recipes, not mandatory rules. Add one only when there is a
*recurring* design problem the guidelines leave a real gap on. Follow the
[pattern template](patterns/README.md#pattern-template), and make the **When to use**
section honest about when *not* to reach for it.

## Local checks before opening a PR

- Every Markdown file ends with a trailing newline.
- Internal links and anchors resolve.
- New normative rules have a unique, kebab-case identifier and a rationale.
- Machine-checkable rules have a corresponding lint rule (or a note explaining why
  they cannot be linted).
