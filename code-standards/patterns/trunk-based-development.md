# Trunk-based development

## Problem

Long-lived feature branches accumulate divergence from the mainline, and the longer
they live the more painful and risky the eventual merge — the "big bang" integration
where conflicts, semantic clashes, and surprises all surface at once.
[`vc-short-lived-branches`](../guidelines/03-version-control.md#vc-short-lived-branches)
asks for frequent integration; this pattern is the discipline that delivers it.

## When to use

Adopt this when a team shares a codebase and wants fast, low-risk integration and
continuous delivery. It pairs naturally with strong automated checks
([`governance-required-checks`](../guidelines/11-governance.md#governance-required-checks))
and [feature flags](feature-flags.md).

It fits less well where work *must* proceed in long-isolated streams — for example, an
open-source project taking contributions from untrusted forks, or a release model that
maintains several long-lived supported versions in parallel. Even then, the
*first-party* development of a given line can still be trunk-based.

## Solution

- Developers **SHOULD** integrate small changes into a single shared trunk (main)
  frequently — at least daily — rather than holding work on a branch for days or weeks.
- Branches, where used, **SHOULD** be short-lived: branch, make a small reviewable
  change, merge, delete. Pull requests still apply
  ([`review-required`](../guidelines/04-code-review.md#review-required)).
- The trunk **MUST** stay releasable at all times
  ([`vc-main-always-releasable`](../guidelines/03-version-control.md#vc-main-always-releasable));
  every integration is gated by the required automated checks.
- Incomplete work **SHOULD** be integrated behind a [feature flag](feature-flags.md) or
  hidden behind an interface, so merging often does not mean shipping half-built
  features to users.
- Large changes **SHOULD** be decomposed into a sequence of small, safe, individually
  mergeable steps rather than one large branch.

## Example

A two-week feature, done trunk-based:

1. Day 1 — merge the new data model and migrations behind no user-visible entry point.
2. Day 3 — merge the service logic, covered by tests, callable but not wired to the UI.
3. Day 6 — merge the UI behind a feature flag, off by default.
4. Day 10 — enable the flag for internal users; fix what they find.
5. Day 14 — enable for everyone; remove the flag in a follow-up.

Every step is small, reviewed, green, and on trunk — there is no two-week branch to
reconcile at the end.

## Consequences

- Integration pain is amortized into many trivial merges instead of one dangerous one.
- The team always works against near-current code, surfacing conflicts and design
  clashes early.
- It demands strong automated checks and a culture of small changes; without them, a
  shared trunk just spreads breakage faster.
- It usually requires feature flags or interface seams to merge incomplete work safely,
  which add their own complexity ([feature flags](feature-flags.md)).

## Related

- [`vc-short-lived-branches`](../guidelines/03-version-control.md#vc-short-lived-branches)
- [`vc-main-always-releasable`](../guidelines/03-version-control.md#vc-main-always-releasable)
- [Feature flags](feature-flags.md)
- [Conventional commits](conventional-commits.md)
