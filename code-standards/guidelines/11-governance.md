# 11 — Governance

A standard only delivers value if it is actually upheld. Governance is how an
organization turns this document from a wiki page nobody reads into a property of every
codebase it ships — overwhelmingly through automation, with human judgment reserved for
what automation cannot check.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Automated enforcement

### `governance-automate`
<a id="SDLC-CODE-0108"></a>**`SDLC-CODE-0108`**

Wherever a rule in this standard can be checked by a machine, it **MUST** be enforced by
a machine, in continuous integration, on every change. Machines enforce consistency far
more reliably, cheaply, and impartially than human reviewers, who are slow, expensive,
and easily worn down. Human review is for what tools cannot judge, not for catching
unformatted code.

### `governance-required-checks`
<a id="SDLC-CODE-0109"></a>**`SDLC-CODE-0109`**

The following checks **MUST** be configured as required status checks that block merge
to a protected branch when they fail:

- **Format check** — code matches the committed formatter config
  ([`style-formatter`](02-code-style.md#style-formatter)).
- **Lint** — the static linter passes
  ([`style-linter`](02-code-style.md#style-linter)).
- **Tests** — the automated test suite passes
  ([`test-run-in-ci`](05-testing.md#test-run-in-ci)).
- **Coverage gate** — coverage meets the threshold and does not regress
  ([`test-coverage-gate`](05-testing.md#test-coverage-gate)).
- **Secret scan** — no secrets are introduced
  ([`security-secret-scanning`](09-security.md#security-secret-scanning)).
- **Dependency vulnerability scan** — no known-vulnerable dependencies are introduced
  ([`dep-vulnerability-scanning`](10-dependencies.md#dep-vulnerability-scanning)).

A check that merely warns and can be ignored is not enforcement. See the
[tooling guide](../tooling/README.md) for tool categories that satisfy each check.

### `governance-protected-main`
<a id="SDLC-CODE-0110"></a>**`SDLC-CODE-0110`**

The main/trunk branch **MUST** be protected: no direct pushes, required review
([`review-required`](04-code-review.md#review-required)), and required passing checks
([`governance-required-checks`](#governance-required-checks)) before merge. Protection is
what makes [`vc-main-always-releasable`](03-version-control.md#vc-main-always-releasable)
true in practice rather than in principle.

## Applying the standard

### `governance-conformance`
<a id="SDLC-CODE-0111"></a>**`SDLC-CODE-0111`**

Conformance is assessed per repository against the levels defined in the
[README](../README.md#conformance). A repository **SHOULD** make its conformance status
and its enforced checks visible (for example, in its README), so consumers and
contributors know what bar the code is held to.

### `governance-new-code`
<a id="SDLC-CODE-0112"></a>**`SDLC-CODE-0112`**

This standard **MUST** be applied to new code and to code being changed, and **SHOULD
NOT** trigger a mass rewrite of working legacy code solely to conform. The cost of a
big-bang cleanup rarely pays off and risks destabilizing proven code. Instead, raise the
bar where you are already working
([`principle-boy-scout`](01-design-principles.md#principle-boy-scout)).

### `governance-ratchet-legacy`
<a id="SDLC-CODE-0113"></a>**`SDLC-CODE-0113`**

For an existing codebase adopting this standard, enforcement **SHOULD** ratchet: gate on
*not getting worse* (new violations blocked, coverage not decreasing) while existing
violations are burned down over time. A ratchet lets a large legacy codebase adopt the
standard incrementally without halting feature work — and guarantees steady progress
rather than indefinite "we'll clean it up later".

## Exceptions and evolution

### `governance-exceptions`
<a id="SDLC-CODE-0114"></a>**`SDLC-CODE-0114`**

Any deliberate deviation from a `MUST`/`SHOULD` rule **MUST** be recorded as an explicit,
reviewed exception that names the rule (by its identifier), the reason, and — for
temporary deviations — the plan to resolve it. An undocumented deviation is a defect; a
documented, justified one is a decision. Prefer narrowly scoped, in-code suppressions
(with the rule id and a reason) over disabling a check globally.

### `governance-tech-debt`
<a id="SDLC-CODE-0115"></a>**`SDLC-CODE-0115`**

Known shortcuts and deferred work **SHOULD** be tracked explicitly (a linked issue, a
tracked `TODO` — see
[`style-no-todo-without-tracking`](02-code-style.md#style-no-todo-without-tracking)) so
that debt is visible and managed rather than silently accumulating. Debt that no one can
see is debt that never gets paid down.

### `governance-evolve`
<a id="SDLC-CODE-0116"></a>**`SDLC-CODE-0116`**

This standard **SHOULD** be treated as a living document. When a real, recurring need is
not served by an existing rule — or a rule proves wrong in practice — change the standard
through review ([CONTRIBUTING](../CONTRIBUTING.md)) rather than quietly ignoring it. A
standard that cannot evolve gets worked around until it is irrelevant.

## Common mistakes

- Relying on human reviewers to catch formatting, lint, or coverage issues a CI check
  could enforce automatically.
- "Required" checks that only warn, so violations merge anyway.
- An unprotected main branch that anyone can push broken code to directly.
- Blocking all feature work for a big-bang cleanup instead of ratcheting legacy code.
- Disabling a check globally to unblock one change, instead of a narrow, documented
  exception.
- Undocumented one-off deviations that accumulate into de-facto inconsistency.
- Shortcuts taken under deadline and never tracked, so the debt is invisible.
