# Tooling
<a id="SDLC-CODE-T-0001"></a>**`SDLC-CODE-T-0001`**

Automated enforcement is how a standard stays real
([`governance-automate`](../guidelines/11-governance.md#governance-automate)). Because
this standard is **language-agnostic**, it cannot ship a single linter config the way a
language-specific standard would — the right formatter for Go is not the right one for
Python. Instead, this guide maps each enforceable rule to a *category* of tool, names
concrete examples per ecosystem, and gives a CI checklist. Pick the tool from each
category that fits your stack and wire it into CI as a required check.

## Tool categories and what they enforce

| Category | Enforces | Examples (pick per language) |
|----------|----------|------------------------------|
| **Formatter** | [`style-formatter`](../guidelines/02-code-style.md#style-formatter) | Prettier (JS/TS), Black/Ruff (Python), gofmt (Go), rustfmt (Rust), google-java-format (Java), dotnet format (C#) |
| **Linter / static analysis** | [`style-linter`](../guidelines/02-code-style.md#style-linter), [`style-small-units`](../guidelines/02-code-style.md#style-small-units), [`style-no-dead-code`](../guidelines/02-code-style.md#style-no-dead-code) | ESLint (JS/TS), Ruff/Pylint (Python), go vet + staticcheck (Go), Clippy (Rust), Checkstyle/SpotBugs (Java), Roslyn analyzers (C#) |
| **Test runner + coverage** | [`test-run-in-ci`](../guidelines/05-testing.md#test-run-in-ci), [`test-coverage-gate`](../guidelines/05-testing.md#test-coverage-gate), [`test-coverage-floor`](../guidelines/05-testing.md#test-coverage-floor) | Jest/Vitest (JS/TS), pytest + coverage.py (Python), go test -cover (Go), cargo test + tarpaulin (Rust), JUnit + JaCoCo (Java) |
| **Coverage ratchet** | [`test-coverage-gate`](../guidelines/05-testing.md#test-coverage-gate) | Codecov / Coveralls status checks, or a CI step that fails on a drop vs. the base branch |
| **Secret scanner** | [`security-secret-scanning`](../guidelines/09-security.md#security-secret-scanning), [`vc-no-secrets`](../guidelines/03-version-control.md#vc-no-secrets) | gitleaks, trufflehog, detect-secrets, or the platform's native secret scanning |
| **Static application security testing (SAST)** | [`security-safe-interpolation`](../guidelines/09-security.md#security-safe-interpolation), [`security-validate-input`](../guidelines/09-security.md#security-validate-input) | Semgrep, CodeQL, Bandit (Python), gosec (Go), language-specific security linters |
| **Dependency / vulnerability scanner** | [`dep-vulnerability-scanning`](../guidelines/10-dependencies.md#dep-vulnerability-scanning), [`dep-pinned`](../guidelines/10-dependencies.md#dep-pinned) | Dependabot, Renovate, npm/pip/cargo audit, OSV-Scanner, Trivy, Snyk |
| **License checker** | [`dep-license-compliance`](../guidelines/10-dependencies.md#dep-license-compliance) | license-checker (JS), pip-licenses (Python), go-licenses (Go), FOSSA |
| **Commit-message linter** (optional) | [`vc-meaningful-messages`](../guidelines/03-version-control.md#vc-meaningful-messages), [Conventional commits](../patterns/conventional-commits.md) | commitlint, gitlint |

Run the fast checks (format, lint, secret scan) on every commit via a pre-commit hook
*and* in CI; the slower ones (full test suite, SAST, dependency scan) at least in CI on
every change. Pre-commit catches issues before they cost a CI round-trip; CI is the
gate that actually blocks merge.

## CI checklist

Wire these up as **required status checks** on the protected branch
([`governance-required-checks`](../guidelines/11-governance.md#governance-required-checks)).
A representative pipeline:

```text
on: every pull request and push to a protected branch
jobs:
  - format-check    # formatter in --check mode; fails if code isn't formatted
  - lint            # linter / static analysis; warnings-as-errors recommended
  - test            # full automated suite; must pass
  - coverage        # meets floor AND does not regress vs. base branch
  - secret-scan     # no secrets introduced
  - dep-scan        # no known-vulnerable or disallowed-license dependencies
require:
  - all of the above pass before merge
  - at least one approving review from a non-author
  - branch is protected: no direct pushes, no force-push
```

The point is not which product you choose in each row, but that **every row is present,
blocking, and not bypassable**. A check that only warns is not enforcement.

## What automation can NOT judge

A green pipeline means the cheaply-checkable rules pass — **not** that the code is good.
This is surfaced deliberately
([`governance-conformance`](../guidelines/11-governance.md#governance-conformance)); the
following still require human review ([Code review](../guidelines/04-code-review.md)):

- **Design quality** — whether the abstractions are right, responsibilities are
  well-placed, and the code follows the [design principles](../guidelines/01-design-principles.md).
  A linter can flag a 300-line function; it cannot tell you the design is wrong.
- **Naming and readability** — whether names reveal intent
  ([`style-intention-revealing-names`](../guidelines/02-code-style.md#style-intention-revealing-names)).
  A linter checks casing, not meaning.
- **Test quality** — coverage tools measure *what* ran, not whether assertions are
  meaningful ([`test-meaningful-assertions`](../guidelines/05-testing.md#test-meaningful-assertions))
  or whether the important edge cases are tested. 100% coverage can still test nothing.
- **Comment and doc quality** — whether comments explain *why*
  ([`docs-why-not-what`](../guidelines/06-documentation.md#docs-why-not-what)) and
  whether docs are *accurate* ([`docs-keep-current`](../guidelines/06-documentation.md#docs-keep-current)).
- **Correct error handling and authorization logic** — whether the right errors are
  caught and whether every access is properly authorized
  ([`security-authorize-every-access`](../guidelines/09-security.md#security-authorize-every-access));
  SAST finds patterns, not missing business-rule checks.

Treat the toolchain as the floor, not the ceiling: it frees human review to focus on
judgment, and it is only as good as the rules you keep blocking. Add your
language-specific tools and house rules as an overlay on top of this baseline.
