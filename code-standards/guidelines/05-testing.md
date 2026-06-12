# 05 — Testing

Automated tests are what let a codebase change without fear. They document intended
behavior, catch regressions before users do, and make refactoring safe. A codebase
without trustworthy tests calcifies: every change is risky, so changes slow down.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Tests must exist and run

### `test-automated`
<a id="SDLC-CODE-0047"></a>**`SDLC-CODE-0047`**

Code **MUST** have automated tests. Manual testing does not scale, is not repeatable,
and is skipped under deadline pressure exactly when it matters most. The unit of
confidence is a test that runs the same way for everyone, every time.

### `test-run-in-ci`
<a id="SDLC-CODE-0048"></a>**`SDLC-CODE-0048`**

The full test suite **MUST** run automatically in CI on every change, and a failing
suite **MUST** block the merge
([`governance-required-checks`](11-governance.md#governance-required-checks)). Tests
that only run when someone remembers to run them locally provide no guarantee.

### `test-with-change`
<a id="SDLC-CODE-0049"></a>**`SDLC-CODE-0049`**

New behavior **MUST** ship with tests that exercise it, and every bug fix **MUST**
include a test that fails before the fix and passes after. The regression test is what
stops the same bug from returning — and proves the fix actually works. This is enforced
at review ([`review-tests-present`](04-code-review.md#review-tests-present)).

## Coverage

### `test-coverage-gate`
<a id="SDLC-CODE-0050"></a>**`SDLC-CODE-0050`**

The codebase **MUST** measure test coverage and enforce a coverage gate in CI that
**MUST NOT** decrease over time. A ratchet that fails the build when coverage drops is
more valuable than any single target number: it prevents new untested code from
accumulating, whatever your current level.

### `test-coverage-floor`
<a id="SDLC-CODE-0051"></a>**`SDLC-CODE-0051`**

New and changed code **SHOULD** meet a coverage floor of at least **80%**, and teams
**MAY** set a higher bar. The exact number is less important than measuring it,
enforcing it ([`test-coverage-gate`](#test-coverage-gate)), and not regressing.
Coverage is a *floor and a smoke detector*, not a goal: 100% coverage of meaningless
assertions proves nothing, and some code (generated, trivial, or glue) is legitimately
low-value to cover. Chase *meaningful* coverage of behavior and branches, not a vanity
percentage.

### `test-meaningful-assertions`
<a id="SDLC-CODE-0052"></a>**`SDLC-CODE-0052`**

A test **MUST** assert on observable behavior and outcomes, not merely execute code.
Tests that call a function but assert nothing (or assert only that it didn't throw)
inflate coverage while catching nothing. A test that cannot fail is not a test.

## Qualities of a good suite

### `test-deterministic`
<a id="SDLC-CODE-0053"></a>**`SDLC-CODE-0053`**

Tests **MUST** be deterministic: the same code produces the same result every run.
Flaky tests — failing intermittently due to timing, ordering, real network calls, or
unseeded randomness — are worse than no tests, because they train the team to ignore
red builds. A flaky test **MUST** be fixed or quarantined with a tracked issue, never
left to erode trust in the suite.

### `test-isolated`
<a id="SDLC-CODE-0054"></a>**`SDLC-CODE-0054`**

Tests **SHOULD** be independent of each other and of external state: any test can run
alone or in any order and still pass. Isolation comes from controlling dependencies —
injecting a clock, a fake repository, a stub service
([`principle-dependency-inversion`](01-design-principles.md#principle-dependency-inversion),
[Test doubles](../patterns/test-doubles.md)) — rather than relying on shared databases,
global state, or a specific run order.

### `test-fast`
<a id="SDLC-CODE-0055"></a>**`SDLC-CODE-0055`**

The suite **SHOULD** be fast enough that developers run it often. A suite that takes too
long to run gets skipped, defeating its purpose. Keep the fast majority (unit tests)
runnable in seconds; relegate slow tests to layers that run less often
([`test-pyramid`](#test-pyramid)).

### `test-behavior-not-implementation`
<a id="SDLC-CODE-0056"></a>**`SDLC-CODE-0056`**

Tests **SHOULD** verify *what* the code does (its contract), not *how* it does it
internally. Tests coupled to private implementation details break on every harmless
refactor, punishing exactly the cleanup the standard encourages. Test through public
interfaces.

### `test-pyramid`
<a id="SDLC-CODE-0057"></a>**`SDLC-CODE-0057`**

A codebase **SHOULD** favor many fast, focused unit tests, fewer integration tests, and
a small number of end-to-end tests — the "test pyramid". Push coverage of logic down to
the cheapest, fastest layer that can verify it, and reserve slow, broad tests for the
critical paths they alone can cover. An inverted pyramid (mostly slow end-to-end tests)
is brittle and expensive.

### `test-no-silent-skip`
<a id="SDLC-CODE-0058"></a>**`SDLC-CODE-0058`**

Disabled, skipped, or ignored tests **MUST NOT** accumulate silently. A test turned off
**MUST** have a tracked issue and a plan to re-enable it; otherwise it is a coverage
gap pretending to be covered.

## Common mistakes

- Tests that run the code but assert nothing, inflating coverage while catching nothing.
- Chasing a coverage percentage with trivial tests instead of testing real behavior and
  edge cases.
- Flaky tests left in the suite until the team reflexively re-runs red builds.
- Tests coupled to implementation details, so every refactor breaks them.
- An inverted test pyramid: a few slow, brittle end-to-end tests standing in for unit
  tests.
- Bug fixes merged without a regression test, so the bug quietly returns.
- A growing pile of `skip`/`ignore`d tests that no one tracks.
