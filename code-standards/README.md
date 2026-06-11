# Universal Enterprise Code Standard

A vendor-neutral, language-agnostic standard for writing source code that is
readable, testable, maintainable, and safe, regardless of the organization,
programming language, or framework that produces it.

This standard is intended to be adopted as-is, forked, or used as a baseline that an
organization extends. It deliberately contains **no** language-, framework-, or
tool-specific guidance: every rule is something you could reasonably ask of a Python
service, a Go CLI, a TypeScript front end, a Rust library, or a Java monolith alike.
Where a rule needs a concrete tool to be enforced, it names a *category* of tool (a
formatter, a linter, a coverage gate) rather than a specific product.

Language, framework, or tool-specific guidance will be documented separately.

## Why a standard

When every team picks its own formatting, testing bar, commit hygiene, and error
conventions, the cost lands on everyone else: code reviews argue over style instead
of substance, bugs hide in untested paths, and onboarding takes longer. A shared standard turns "learn how this team
writes code" into "apply what you already know." The goals are:

- **Readability** — code is read far more often than it is written; optimize for the
  reader.
- **Maintainability** — a stranger (including you in six months) can change the code
  safely.
- **Reliability** — defects are caught by automation, early and cheaply, not by users.
- **Consistency** — the same intent looks the same across files, repositories, and
  teams.
- **Security** — code is safe by default, and unsafe code is hard to write by accident.

## How this standard is organized

There are two tiers.

### `guidelines/` — normative rules you conform to

These are mid-size topic documents. To claim conformance with this standard, a
codebase **MUST** satisfy the `MUST`-level rules in every applicable guideline.

| # | Document | Covers |
|---|----------|--------|
| 01 | [Design principles](guidelines/01-design-principles.md) | SOLID, DRY, KISS, YAGNI, coupling, cohesion — the values that shape good code |
| 02 | [Code style and readability](guidelines/02-code-style.md) | Automated formatting and linting, naming, function size, dead code, magic values |
| 03 | [Version control](guidelines/03-version-control.md) | Atomic commits, meaningful messages, branch hygiene, what belongs in the repo |
| 04 | [Code review](guidelines/04-code-review.md) | Review before merge, reviewer independence, review scope, PR size |
| 05 | [Testing](guidelines/05-testing.md) | Automated tests, coverage gates, determinism, the test pyramid, regression tests |
| 06 | [Documentation and comments](guidelines/06-documentation.md) | READMEs, why-not-what comments, public-interface docs, decision records |
| 07 | [Error handling](guidelines/07-error-handling.md) | No silent failures, fail fast, error context, cleanup, recoverable vs programmer errors |
| 08 | [Logging and observability](guidelines/08-logging-and-observability.md) | Structured logs, levels, correlation IDs, metrics, never logging secrets |
| 09 | [Security](guidelines/09-security.md) | Secrets, input validation, least privilege, vetted crypto, secure defaults |
| 10 | [Dependencies](guidelines/10-dependencies.md) | Pinned and vetted dependencies, vulnerability scanning, supply-chain integrity |
| 11 | [Governance](guidelines/11-governance.md) | Automated enforcement, required checks, exceptions, applying the standard to legacy code |

### `patterns/` — optional recipes you adopt when they apply

The [pattern catalog](patterns/README.md) collects reusable practices that solve
recurring engineering problems. Patterns are **not** mandatory; adopt one when your
situation matches its "When to use" criteria. When you do adopt a pattern, implement
it as written so that the rest of the organization recognizes it.

- [Conventional commits](patterns/conventional-commits.md)
- [Trunk-based development](patterns/trunk-based-development.md)
- [Feature flags](patterns/feature-flags.md)
- [Test doubles](patterns/test-doubles.md)

## Requirement levels (RFC 2119 / RFC 8174)

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**,
**SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this
standard are to be interpreted as described in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and
[RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) — that is, the keywords carry
their normative meaning only when in **UPPERCASE**.

Rules are written as a keyword-led statement followed by rationale and, where helpful,
an example. Each normative rule has a stable identifier (for example `style-formatter`)
so that reviews, automation, and exception requests can reference it precisely.

## Conformance

A codebase is **conformant** with this standard at one of two levels:

- **Conformant** — it satisfies every applicable `MUST`/`MUST NOT` rule.
- **Fully conformant** — it additionally satisfies every applicable `SHOULD`/`SHOULD
  NOT` rule, or documents a deliberate, reviewed exception for each one it does not
  (see [`governance-exceptions`](guidelines/11-governance.md#governance-exceptions)).

Conformance is assessed per repository. Some rules apply only to certain kinds of code
(for example, observability rules apply to running services, not to a pure library);
a rule that does not apply does not count against conformance.

Existing codebases that predate adoption **SHOULD NOT** be mass-rewritten solely to
become conformant. Apply this standard to new code and to code you are already
changing (see [`governance-new-code`](guidelines/11-governance.md#governance-new-code)),
and ratchet legacy code toward it over time rather than freezing work for a big-bang
cleanup.

## Using this standard in your organization

1. Adopt this repository as a baseline (vendored, submoduled, or forked).
2. Add an organization- or language-specific overlay for the decisions this standard
   intentionally leaves open (your chosen formatter and linter, your coverage
   threshold above the floor, your branching model). Keep overlays additive: they may
   **tighten** a rule but **MUST NOT** contradict a `MUST`-level rule here.
3. Enforce the rules automatically wherever possible — see
   [Governance](guidelines/11-governance.md) and the
   [tooling guide](tooling/README.md).

## Tooling

Because this standard is language-agnostic, it ships no single linter config. Instead,
the [tooling guide](tooling/README.md) maps each enforceable rule to a *category* of
tool (formatter, linter, coverage gate, dependency/vulnerability scanner, secret
scanner) and gives concrete examples per ecosystem, plus a CI checklist and an honest
account of which rules automation cannot judge.

## Contributing

This is a living standard. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose
new rules and patterns, how rule identifiers work, and how changes are tiered.

## License

This work is licensed under the
[Creative Commons Attribution 4.0 International License](LICENSE) (CC BY 4.0). You may
share and adapt it for any purpose, including commercially, provided you give
appropriate credit.
