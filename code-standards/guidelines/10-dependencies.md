# 10 — Dependencies

Modern software is mostly other people's code. Dependencies are leverage — and a
liability you partly own: their bugs, vulnerabilities, licenses, and abandonment become
yours. This document is about taking on that liability deliberately, keeping builds
reproducible, and defending the supply chain.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Declared and reproducible

### `dep-declared`
<a id="SDLC-CODE-0098"></a>**`SDLC-CODE-0098`**

All third-party dependencies **MUST** be declared explicitly in the project's manifest,
not vendored by hand, copy-pasted, or relied upon from a developer's globally installed
tools. The full dependency set must be visible and reconstructable from the repository
alone ([`vc-everything-tracked`](03-version-control.md#vc-everything-tracked)).

### `dep-pinned`
<a id="SDLC-CODE-0099"></a>**`SDLC-CODE-0099`**

Dependency versions **MUST** be pinned via a committed lockfile (or equivalent exact
version constraints) so that every build — on every machine and in CI — resolves the
identical dependency tree. Unpinned dependencies make builds non-reproducible and let an
upstream release silently change or break your software between two builds of the same
commit. The lockfile is a source artifact and is committed; the downloaded packages are
not ([`vc-no-generated-artifacts`](03-version-control.md#vc-no-generated-artifacts)).

### `dep-reproducible-build`
<a id="SDLC-CODE-0100"></a>**`SDLC-CODE-0100`**

Building the same commit **SHOULD** produce the same result regardless of when or where
it is built. Pinned dependencies ([`dep-pinned`](#dep-pinned)) are the foundation;
avoid build steps that pull "latest" or depend on ambient machine state. Reproducibility
is what makes a build trustworthy and an incident debuggable.

## Choosing dependencies

### `dep-vetted`
<a id="SDLC-CODE-0101"></a>**`SDLC-CODE-0101`**

A new dependency **SHOULD** be evaluated before adoption: is it actively maintained,
reasonably popular, secure, and compatibly licensed? Each dependency is a long-term
commitment and an expansion of your trusted surface. A moment's vetting prevents
inheriting an abandoned, insecure, or legally incompatible package.

### `dep-minimal`
<a id="SDLC-CODE-0102"></a>**`SDLC-CODE-0102`**

**SHOULD** keep the dependency surface as small as the problem allows. Prefer the
standard library or a small, focused dependency over a sprawling framework pulled in for
one function. Every dependency adds attack surface, build time, upgrade burden, and
transitive risk. Pulling in a large package to avoid writing a few lines is rarely a
good trade.

### `dep-license-compliance`
<a id="SDLC-CODE-0103"></a>**`SDLC-CODE-0103`**

Dependency licenses **MUST** be compatible with how the project is distributed and used,
and **SHOULD** be tracked automatically. A license incompatibility discovered late can
force a costly rewrite or create legal exposure; catch it when the dependency is added,
not at release.

## Keeping them safe

### `dep-vulnerability-scanning`
<a id="SDLC-CODE-0104"></a>**`SDLC-CODE-0104`**

Dependencies (including transitive ones) **MUST** be scanned automatically and
continuously for known vulnerabilities, with scanning enforced in CI
([`governance-required-checks`](11-governance.md#governance-required-checks)). Most
exploited application vulnerabilities live in dependencies, not first-party code; you
cannot patch what you do not know is vulnerable. See
[`security-dependencies`](09-security.md#security-dependencies).

<!-- param: dep_scan_cadence_hours | 24 | Dependency vulnerability scan cadence (hours) | This organization rescans dependencies for known vulnerabilities at least every {value} hours. -->
<!-- param: critical_vuln_remediation_days | 7 | Critical vulnerability remediation window (days) | This organization remediates critical dependency vulnerabilities within {value} days of disclosure. -->

### `dep-keep-current`
<a id="SDLC-CODE-0105"></a>**`SDLC-CODE-0105`**

Dependencies **SHOULD** be kept reasonably up to date, ideally via automated update
pull requests gated by the test suite. Large, deferred upgrades are painful and risky
and tend to coincide with an urgent security patch you now cannot apply safely. Small,
frequent, tested updates keep the cost low and the security window short.

<!-- param: dep_update_cadence_days | 7 | Automated dependency update cadence (days) | This organization opens automated dependency update pull requests at least every {value} days. -->
<!-- param: dep_max_age_days | 90 | Maximum dependency staleness before flagging (days) | This organization flags any dependency more than {value} days behind its latest compatible release. -->

### `dep-verify-integrity`
<a id="SDLC-CODE-0106"></a>**`SDLC-CODE-0106`**

The toolchain **SHOULD** verify the integrity of downloaded dependencies (checksums or
signatures recorded in the lockfile) so a tampered or substituted package is detected
before it enters a build. This defends against supply-chain attacks where a registry or
network path is compromised. **SHOULD** prefer trusted, controlled sources for packages.

### `dep-no-unmaintained`
<a id="SDLC-CODE-0107"></a>**`SDLC-CODE-0107`**

**SHOULD NOT** depend on unmaintained or abandoned packages for anything important. An
abandoned dependency receives no security fixes and becomes a stranded liability; plan a
migration before it becomes an emergency.

<!-- param: dep_abandoned_inactivity_months | 12 | Inactivity period before a dependency is deemed abandoned (months) | This organization treats a dependency with no upstream releases or commits for {value} months as abandoned and schedules its migration. -->

## Common mistakes

- Floating, unpinned versions, so two builds of the same commit differ and "works on my
  machine" is unanswerable.
- Committing the downloaded packages instead of (or alongside) the lockfile.
- Pulling in a huge framework to avoid writing a few lines, then owning its whole
  surface.
- No vulnerability scanning, so a known-CVE dependency ships unnoticed.
- Years of deferred upgrades, turning a routine security patch into a major migration.
- Adopting a dependency without checking its license, then discovering the conflict at
  release.
- Depending on an abandoned package with no plan for when it breaks.
