# Pattern Catalog

Patterns are reusable solutions to recurring API design problems. Unlike the
[guidelines](../README.md#guidelines--normative-rules-you-conform-to), patterns are
**not mandatory**. Adopt a pattern when your situation matches its **When to use**
criteria — and when you do, implement it as written, so that consumers who have seen
the pattern elsewhere recognize it immediately.

A pattern that conflicts with a `MUST`-level guideline rule does not override it;
patterns operate within the guidelines.

## Catalog

| Pattern | Solves |
|---------|--------|
| [Long-running operations](long-running-operations.md) | Operations too slow to complete within one request |
| [Conditional requests](conditional-requests.md) | Optimistic concurrency and cache validation with ETags |
| [Idempotency keys](idempotency.md) | Safe retries of non-idempotent operations (e.g. `POST`) |
| [Batch and bulk operations](batch-and-bulk.md) | Acting on many resources in one request, with partial success |
| [Webhooks](webhooks.md) | Delivering events to consumers without polling |

## Pattern template

Every pattern in this catalog follows the same structure. Use it when proposing a
new pattern.

```markdown
# <Pattern name>

## Problem
What recurring situation does this address? Why do the basic guidelines leave a gap?

## When to use
The conditions under which this pattern applies — and when it does NOT (so people
don't reach for it reflexively).

## Solution
The normative shape of the pattern: the URLs, methods, status codes, headers, and
payloads involved, with the requirement keywords (MUST/SHOULD/MAY) that apply.

## Example
A concrete request/response walkthrough.

## Consequences
Trade-offs, client obligations, and common mistakes.

## Related
Links to guidelines and other patterns.
```
