# Contributing to the Universal Code Standard

This standard is a living document (see
[`governance-evolve`](guidelines/11-governance.md#governance-evolve)). It improves when
real-world use surfaces a gap, an ambiguity, or a rule that proves wrong in practice.
This guide explains how to propose a change.

By contributing, you agree that your contribution is licensed under the
[CC BY 4.0](LICENSE) license that covers this work.

## Principles for changes

Before proposing a change, weigh it against the
[design principles](guidelines/01-design-principles.md) — especially
[`principle-kiss`](guidelines/01-design-principles.md#principle-kiss) and
[`principle-yagni`](guidelines/01-design-principles.md#principle-yagni). Every rule a
reader must learn has a cost. A change earns its place only if it makes code measurably
more readable, maintainable, reliable, or secure.

- **Stay language-agnostic.** This standard is the layer that *every* language and
  framework shares. A rule that only makes sense for one language, framework, or tool
  does not belong here — it belongs in a language-specific overlay that builds on this
  base. If you cannot state a rule without naming a specific tool, it is probably an
  overlay rule, not a base rule.
- **Justify from broad practice.** Ground rules in widely-accepted engineering practice,
  not one organization's house style.
- **Don't over-specify.** Where the industry genuinely splits and both options work,
  prefer "do X, and be consistent" over mandating a single winner without a strong,
  neutral reason. Leave the choice to the adopting organization's overlay.
- **Keep tiers honest.** A rule is `MUST` only if violating it genuinely breaks
  maintainability, reliability, or security in a way most teams would agree on.
  Otherwise it is `SHOULD` or `MAY`.

## What a good rule looks like

Every normative rule in `guidelines/` follows the same shape:

- A stable, kebab-case **rule identifier** in backticks as its heading (e.g.
  `style-formatter`). Identifiers are permanent — tooling, reviews, and exception
  records reference them. **Never reuse or repurpose an identifier**; retire it and mint
  a new one instead.
- A single normative statement led by an [RFC 2119](LICENSE) keyword
  (**MUST** / **SHOULD** / **MAY** / **MUST NOT** / **SHOULD NOT**).
- A short **rationale** — *why* the rule exists. A rule without a reason gets
  cargo-culted and then ignored.
- Where useful, a concrete (but still language-neutral, or clearly illustrative)
  **example**.

Each topic document ends with a **Common mistakes** section; add to it when a rule
addresses a frequent real-world error.

## How to propose a change

1. **Open an issue first** describing the problem the change solves, with a concrete
   example of code or a workflow the current standard handles badly. Changes that start
   from a real pain point land better than changes that start from a preference.
2. **Discuss the tier and wording.** Is it `MUST` or `SHOULD`? Is it truly
   language-agnostic, or does it belong in an overlay? Does it conflict with an existing
   rule? Does it need a new identifier or an edit to an existing one?
3. **Open a pull request** that:
   - Edits the relevant `guidelines/` document (or adds a `patterns/` entry using the
     [pattern template](patterns/README.md#pattern-template)).
   - Updates the [tooling guide](tooling/README.md) when the rule is machine-checkable,
     mapping it to a tool category.
   - Updates cross-references and the `README.md` index if you added a document.
   - Notes the change so it can be summarized in a changelog.

## Changing an existing rule

- **Clarifying** wording or rationale without changing meaning: straightforward; call it
  out as non-normative in the PR.
- **Tightening** a rule (e.g. `SHOULD` → `MUST`, or raising a threshold): treat it like a
  breaking change to adopters. Explain the migration cost for already-conformant
  codebases and why it is worth it.
- **Removing** a rule: state what replaces it (if anything) and retire its identifier
  rather than deleting it silently, so existing exception records and overlay configs
  remain traceable.

## Adding a pattern

Patterns are optional recipes, not mandatory rules. Add one only when there is a
*recurring* problem the guidelines leave a real gap on. Follow the
[pattern template](patterns/README.md#pattern-template), and make the **When to use**
section honest about when *not* to reach for it.

## Local checks before opening a PR

- Every Markdown file ends with a trailing newline.
- Internal links and anchors resolve.
- New normative rules have a unique, kebab-case identifier and a rationale.
- The rule is language-agnostic (or you have explained why it must live in the base).
