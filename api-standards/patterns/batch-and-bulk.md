# Batch and Bulk Operations

## Problem

A client needs to act on many resources at once — create a hundred records, update a
list of items, delete a selection. Sending one request per item is slow (round-trip
latency dominates) and can run into rate limits. The API needs a way to carry many
operations in one request while reporting clearly which ones succeeded and which
failed.

## When to use

Use this pattern when clients genuinely need to operate on many resources together
and per-item requests are too slow or too numerous.

Prefer ordinary single-resource operations when the volume is small — they are
simpler, fully RESTful, and individually retryable. Do not reach for batch as the
default; reach for it when measurement shows per-item calls are the bottleneck.

This pattern distinguishes two flavors:

- **Bulk** — the *same* operation applied to *many* resources of one type (create 100
  contacts).
- **Batch** — *different* operations bundled into one request (create this, update
  that, delete the other).

## Solution

### The central rule: explicit per-item results

**MUST** report the outcome of each item independently. The single most important
property of this pattern is that callers can tell exactly which items succeeded and
which failed, and why. **MUST NOT** collapse a partial outcome into a single
ambiguous success or failure (this is why an error body
[never carries partial success](../guidelines/07-errors.md#error-no-success-in-error)).

### Bulk (same operation, many items)

- Model bulk as a `POST` to a dedicated sub-resource so it does not collide with the
  single-resource collection — e.g. `POST /contacts:batchCreate` or
  `POST /contacts/bulk`.
- The request body **MUST** carry an array of items, each of which **SHOULD** include
  a client-supplied correlation reference so results can be matched to inputs
  regardless of order.
- The response **MUST** return an array of per-item results, each carrying that
  correlation reference, the item's status, and — on failure — a
  [Problem Details](../guidelines/07-errors.md) object.

### Partial success status

- When some items succeed and some fail, the server **SHOULD** respond `207
  Multi-Status` (or a documented `200 OK` whose body conveys the per-item mix) and
  **MUST** make the per-item statuses unambiguous. **MUST NOT** return a top-level
  `2xx` that implies everything succeeded when some items failed.
- The server **MUST** document whether the batch is **atomic** (all-or-nothing — any
  failure rolls back the whole batch, typically `4xx`/`5xx` with no partial effect)
  or **non-atomic** (each item is independent). Atomicity **MUST NOT** be left
  ambiguous, because it changes how clients retry.

### Limits and retries

- The server **MUST** bound the number of items per request and reject oversized
  batches with a clear [error](../guidelines/07-errors.md) (see
  [`security-limit-payload-size`](../guidelines/10-security.md#security-limit-payload-size)).
- For non-atomic batches, the client **SHOULD** retry only the failed items. The
  operation **SHOULD** support [idempotency keys](idempotency.md) so a whole-batch
  retry does not duplicate the items that already succeeded.

## Example

```http
POST /v1/contacts:batchCreate
Content-Type: application/json

{
  "items": [
    { "ref": "a", "email": "ok@example.com",  "name": "Ada" },
    { "ref": "b", "email": "not-an-email",     "name": "Bo"  }
  ]
}
```

```http
HTTP/1.1 207 Multi-Status
Content-Type: application/json

{
  "items": [
    { "ref": "a", "status": 201, "id": "con_1" },
    { "ref": "b", "status": 422,
      "error": { "type": "https://errors.example.com/validation-failed",
                 "title": "Validation failed", "status": 422, "code": "invalid_email" } }
  ]
}
```

The client knows contact `a` was created and exactly why `b` was not, and can retry
only `b`.

## Consequences

- Clients **MUST** inspect per-item results, not just the top-level status — a `207`
  (or partial `200`) means "read the body."
- Batch endpoints are less uniform than single-resource endpoints and harder to
  cache and authorize (each item may need its own authorization check — and the
  server **MUST** still perform per-item authorization, per
  [`security-object-level-authz`](../guidelines/10-security.md#security-object-level-authz)).
  Keep them as a performance optimization, not the primary interface.
- A common mistake is returning `200 OK` with no per-item detail, forcing clients to
  re-fetch everything to discover what actually happened.

## Related

- Guidelines: [Errors](../guidelines/07-errors.md),
  [Security](../guidelines/10-security.md),
  [URLs and resources](../guidelines/03-urls-and-resources.md#actions).
- Patterns: [Idempotency keys](idempotency.md).
