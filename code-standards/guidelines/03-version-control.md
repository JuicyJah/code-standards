# 03 — Version control

Version control is the shared memory of a codebase. Its history is read during
debugging, auditing, reverting, and onboarding for years after the code is written. A
clean, honest history is as much a deliverable as the code itself.

This document assumes a modern distributed version control system (the examples use Git
terminology) but the rules are tool-independent.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## What goes in

### `vc-everything-tracked`
<a id="SDLC-CODE-0027"></a>**`SDLC-CODE-0027`**

All source code, configuration, tests, infrastructure definitions, and documentation
needed to build and run the project **MUST** live in version control. If reproducing a
build depends on something only on someone's laptop or in someone's memory, the project
is not reproducible.

### `vc-no-generated-artifacts`
<a id="SDLC-CODE-0028"></a>**`SDLC-CODE-0028`**

Build outputs, compiled binaries, dependency caches, and other generated files
**MUST NOT** be committed; ignore them (for example, via `.gitignore`). They bloat the
repository, cause spurious merge conflicts, and drift from the sources that produce
them. The lockfile that *pins* dependencies is a source and is committed (see
[`dep-pinned`](10-dependencies.md#dep-pinned)); the downloaded packages are not.

### `vc-no-secrets`
<a id="SDLC-CODE-0029"></a>**`SDLC-CODE-0029`**

Secrets — passwords, API keys, tokens, private keys — **MUST NOT** be committed, not
even in history, not even in a private repository. A secret in history is a leaked
secret: it must be rotated, not just deleted. Use ignore rules and an automated secret
scanner ([`security-secret-scanning`](09-security.md#security-secret-scanning)) to
prevent it. See [`security-no-hardcoded-secrets`](09-security.md#security-no-hardcoded-secrets).

## Commits

### `vc-atomic-commits`
<a id="SDLC-CODE-0030"></a>**`SDLC-CODE-0030`**

A commit **SHOULD** be a single, coherent, self-contained change: one logical step that
builds and passes its tests on its own. Atomic commits make history readable, reverts
surgical, and `bisect`-style debugging possible. Don't bundle an unrelated refactor,
reformat, and bug fix into one commit — and don't split one logical change across
commits that individually break the build.

### `vc-meaningful-messages`
<a id="SDLC-CODE-0031"></a>**`SDLC-CODE-0031`**

Every commit message **MUST** explain the change well enough for a future reader: a
concise subject line stating *what* changed, and, for any non-trivial change, a body
explaining *why* — the motivation and context that the diff itself cannot show. Write
the subject in the imperative mood ("Add retry to upload", not "Added"/"Adds"). A good
message answers the question a future debugger will ask: "why was this done?"

### `vc-reference-context`
<a id="SDLC-CODE-0032"></a>**`SDLC-CODE-0032`**

A commit or its pull request **SHOULD** reference the issue, ticket, or discussion that
motivated it, so the full context is one link away during a future investigation.

## Branches and integration

### `vc-main-always-releasable`
<a id="SDLC-CODE-0033"></a>**`SDLC-CODE-0033`**

The main/trunk branch **MUST** always be in a working, releasable state: it builds and
its checks pass. Broken code **MUST NOT** be merged to main. Everyone branches from
main and depends on it being green; a broken main blocks the whole team.

### `vc-short-lived-branches`
<a id="SDLC-CODE-0034"></a>**`SDLC-CODE-0034`**

Branches **SHOULD** be short-lived and integrated frequently. Long-running branches
accumulate divergence and end in painful, risky merges. Prefer small changes merged
often (see [Trunk-based development](../patterns/trunk-based-development.md) and
[Feature flags](../patterns/feature-flags.md) for how to ship incrementally without
long branches).

<!-- param: branch_max_age_days | 3 | Maximum branch lifetime before integration (days) | This organization expects feature branches to be integrated within {value} days. -->

### `vc-review-before-merge`
<a id="SDLC-CODE-0035"></a>**`SDLC-CODE-0035`**

Changes to a shared branch **MUST** be reviewed and pass all required automated checks
before merging (see [Code review](04-code-review.md) and
[`governance-required-checks`](11-governance.md#governance-required-checks)). Direct
pushes to a protected main branch **MUST NOT** be allowed.

<!-- param: review_sla_business_hours | 24 | Code review turnaround SLA (business hours) | This organization expects review of an open change to begin within {value} business hours. -->

### `vc-no-history-rewrite-shared`
<a id="SDLC-CODE-0036"></a>**`SDLC-CODE-0036`**

Published history on a shared branch **MUST NOT** be rewritten (no force-push to main).
Others have built on it; rewriting it breaks their clones and erases the audit trail.
Rewriting your *own* unpublished branch to clean it up before review is fine and
encouraged.

## Common mistakes

- Committing build artifacts or dependency directories, causing endless merge noise.
- A leaked credential "removed" in a later commit but still present in history and
  never rotated.
- Commit messages like "fix", "wip", or "address comments" that tell a future reader
  nothing.
- One giant commit (or PR) mixing a feature, a refactor, and a reformat, impossible to
  review or revert cleanly.
- Months-long feature branches that turn integration into an archaeological dig.
- Force-pushing a shared branch and breaking everyone who had pulled it.
