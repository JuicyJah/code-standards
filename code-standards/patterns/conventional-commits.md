# Conventional commits
<a id="SDLC-CODE-P-0001"></a>**`SDLC-CODE-P-0001`**

## Problem

[`vc-meaningful-messages`](../guidelines/03-version-control.md#vc-meaningful-messages)
requires informative commit messages, but free-form messages are not machine-readable.
Teams that want to automate version bumps, generate changelogs, or categorize history
need a small amount of structure in the subject line — without forcing authors to write
prose by committee.

## When to use

Adopt this when you want to **automate** release versioning and changelog generation
from history, or when a consistent, scannable commit vocabulary helps a large team.

It is **not** worth the ceremony for a tiny solo project, a throwaway prototype, or a
team that releases manually and reads history rarely. The convention is a means to
automation, not an end in itself.

## Solution

Structure each commit subject as a type, an optional scope, and a description:

```
<type>(<optional scope>): <description>
```

- The **type** **MUST** come from an agreed, closed set. A common set is: `feat` (a new
  feature), `fix` (a bug fix), `docs`, `refactor`, `test`, `build`, `ci`, `perf`, and
  `chore`.
- The **description** **MUST** be a concise, imperative summary, consistent with
  [`vc-meaningful-messages`](../guidelines/03-version-control.md#vc-meaningful-messages).
- A breaking change **MUST** be marked — conventionally with a `!` before the colon
  (`feat!: ...`) and/or a `BREAKING CHANGE:` footer — because this is what drives a major
  version bump.
- The body and footers still carry the *why* and references
  ([`vc-reference-context`](../guidelines/03-version-control.md#vc-reference-context)).

Once adopted, the format **SHOULD** be checked automatically (a commit-message linter in
CI or a commit hook) so it stays consistent enough to automate against.

## Example

```
feat(auth): add token refresh endpoint

Sessions previously expired hard at one hour, forcing re-login. Add a
refresh endpoint so clients can extend a session silently.

Refs: PROJ-481
```

```
fix(billing): stop double-charging on retried webhook

The webhook handler was not idempotent; a retried delivery created a
second charge. Key charges by event id.

Refs: PROJ-512
```

Tooling can now read these to bump the version (a `fix` → patch, a `feat` → minor, a
breaking change → major) and assemble a categorized changelog with no manual curation.

## Consequences

- Versioning and changelog generation become automatable and consistent.
- History is scannable by type and scope.
- Authors must learn a small vocabulary, and the team must agree on the type set and
  enforce it — an unenforced convention drifts and breaks the automation that depended
  on it.
- The structure constrains only the subject line; it does not replace a meaningful body
  for non-trivial changes.

## Related

- [`vc-meaningful-messages`](../guidelines/03-version-control.md#vc-meaningful-messages)
- [`vc-atomic-commits`](../guidelines/03-version-control.md#vc-atomic-commits)
- [Trunk-based development](trunk-based-development.md)
