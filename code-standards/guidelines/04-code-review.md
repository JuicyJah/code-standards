# 04 — Code review

Code review is the primary place where humans catch what automation cannot: unclear
design, missing edge cases, wrong abstractions, and knowledge that should be shared.
Done well it raises quality and spreads understanding; done badly it is a bottleneck
and a source of friction. The rules below aim for the former.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## When review happens

### `review-required`

Every change to a shared branch **MUST** be reviewed by at least one person who is not
its author before it merges. Review catches defects early, spreads knowledge so no code
has exactly one person who understands it, and creates a second pair of eyes on
security- and correctness-sensitive change. The only changes that **MAY** skip review
are those a team has explicitly agreed are trivial and mechanical (for example,
automated dependency bumps that pass all checks) — and that agreement is itself a
documented decision.

### `review-automation-first`

All required automated checks — formatting, linting, tests, coverage, security scans —
**MUST** pass before a human spends time reviewing
([`governance-required-checks`](11-governance.md#governance-required-checks)). Humans
should review design and correctness, not act as a slow linter for problems a machine
already flags.

### `review-independence`

The reviewer **MUST** be someone other than the author. Self-approval defeats the
purpose. For higher-risk areas (security, payments, data migrations), more than one
reviewer, or a reviewer with specific expertise, is **RECOMMENDED**.

## What review covers

### `review-scope`

A review **SHOULD** focus on what matters: correctness, design and fit with existing
code, readability, adequate and meaningful tests, security implications, and whether
the change does what it claims. It **SHOULD NOT** re-litigate matters a formatter or
linter owns ([`style-formatter`](02-code-style.md#style-formatter)) — those are settled
by tools, not opinion.

### `review-tests-present`

A reviewer **MUST** confirm that new behavior and bug fixes are covered by tests
([`test-with-change`](05-testing.md#test-with-change)). "Where are the tests?" is a
valid blocking comment. Code without tests is not review-complete.

### `review-understandable`

A reviewer **SHOULD NOT** approve code they do not understand. If the reviewer cannot
follow it, future maintainers won't either — that is a finding, not the reviewer's
failing. The remedy is clearer code or better explanation, not a rubber stamp.

## How review is conducted

### `review-small-changes`

Authors **SHOULD** keep changes small and single-purpose so they can be reviewed
thoroughly ([`vc-atomic-commits`](03-version-control.md#vc-atomic-commits)). Large pull
requests get shallow reviews — attention does not scale with diff size. Split big work
into a sequence of reviewable steps.

### `review-author-context`

The author **MUST** give reviewers the context to review well: a description of what the
change does and why, how it was tested, and anything that needs special attention. The
reviewer should not have to reverse-engineer the intent from the diff.

### `review-timely`

Reviews **SHOULD** be done promptly. A change waiting on review is blocked work and
grows stale and harder to merge. Teams **SHOULD** agree on a turnaround expectation and
treat reviewing peers' code as real work, not an interruption.

### `review-constructive`

Review comments **MUST** address the code, not the person, and **SHOULD** be specific
and actionable. Distinguish blocking concerns from optional suggestions (e.g. prefix
non-blocking notes with "nit:"). The goal is better code and a stronger team, not
winning an argument.

## Common mistakes

- Reviews that nitpick formatting a tool should own while missing a logic error.
- Rubber-stamp "LGTM" approvals on code the reviewer didn't actually read or
  understand.
- Pull requests so large no one can review them meaningfully, so everyone approves on
  faith.
- Approving changes with no tests for the new behavior.
- Review comments that are vague ("this is wrong") or personal rather than specific and
  about the code.
- Letting review requests sit for days, blocking teammates.
