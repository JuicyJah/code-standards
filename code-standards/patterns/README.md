# Pattern Catalog

Patterns are reusable practices that solve recurring engineering problems. Unlike the
[guidelines](../README.md#guidelines--normative-rules-you-conform-to), patterns are
**not mandatory**. Adopt a pattern when your situation matches its **When to use**
criteria — and when you do, implement it as written, so the rest of the organization
recognizes it.

A pattern that conflicts with a `MUST`-level guideline rule does not override it;
patterns operate within the guidelines.

## Catalog

| Pattern | Solves |
|---------|--------|
| [Conventional commits](conventional-commits.md) | Making commit history machine-readable and automating versioning/changelogs |
| [Trunk-based development](trunk-based-development.md) | Avoiding painful merges and integration debt from long-lived branches |
| [Feature flags](feature-flags.md) | Merging incomplete or risky work safely, decoupling deploy from release |
| [Test doubles](test-doubles.md) | Isolating the unit under test from slow or non-deterministic dependencies |

## Pattern template

Every pattern in this catalog follows the same structure. Use it when proposing a new
pattern.

```markdown
# <Pattern name>

## Problem
What recurring situation does this address? Why do the basic guidelines leave a gap?

## When to use
The conditions under which this pattern applies — and when it does NOT (so people
don't reach for it reflexively).

## Solution
The shape of the practice, with the requirement keywords (MUST/SHOULD/MAY) that apply
once you have adopted it.

## Example
A concrete walkthrough.

## Consequences
Trade-offs, obligations it creates, and common mistakes.

## Related
Links to guidelines and other patterns.
```
