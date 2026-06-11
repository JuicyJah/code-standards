# 07 — Errors

Errors are part of the API contract. Consumers write code against them, so they
must be consistent, machine-readable, and actionable. An API with great success
paths and chaotic error responses is hard to build against.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Foundations

### `error-status-code`

**MUST** signal failure with an appropriate `4xx` or `5xx` status code (see
[HTTP methods and status](04-http-methods-and-status.md#status-codes)). The status
code is the primary, machine-readable error signal. The body explains; it never
replaces the status line.

### `error-problem-details`

**MUST** return a structured error body using the **Problem Details** format defined
by [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) (which obsoletes RFC 7807),
served with the media type `application/problem+json`. Standardizing on Problem
Details means every consumer and every generic client library understands your
errors without custom code.

A Problem Details object has these standard members, all optional but with defined
meaning:

| Member | Type | Meaning |
|--------|------|---------|
| `type` | string (URI) | Identifies the **kind** of problem; stable and dereferenceable to docs |
| `title` | string | Short, human-readable summary of the problem kind |
| `status` | number | The HTTP status code, duplicated for convenience |
| `detail` | string | Human-readable explanation specific to **this** occurrence |
| `instance` | string (URI) | Identifies the specific occurrence (e.g. a request or error ID) |

Example:

```http
HTTP/1.1 409 Conflict
Content-Type: application/problem+json

{
  "type": "https://errors.example.com/order-already-shipped",
  "title": "Order already shipped",
  "status": 409,
  "detail": "Order 'ord_8f3' has already shipped and cannot be cancelled.",
  "instance": "/requests/2c91a8f0",
  "code": "order_already_shipped"
}
```

### `error-machine-code`

**MUST** include a stable, machine-readable error **code** that consumers can branch
on programmatically — either via a dereferenceable `type` URI, an explicit extension
member (this standard **RECOMMENDS** a `code` string as shown above), or both. The
code **MUST NOT** be the human-readable `title` or `detail`, which are free to change
wording. Codes follow the [enum casing](02-naming.md#naming-enum-values) convention
and are treated as an [extensible enum](06-data-types.md#type-extensible-enums).

### `error-stable-codes`

**MUST NOT** change the meaning of an existing error code or its associated status
code once published; consumers branch on them. Adding a new code is a
[non-breaking change](09-versioning-and-compatibility.md); repurposing one is breaking.

## Content

### `error-human-message`

**MUST** provide a human-readable `detail` that helps a developer understand and fix
the problem, without leaking sensitive information. **MUST NOT** put stack traces,
internal hostnames, SQL, or secrets in any error field. The message is read by the
consumer's developer, not an attacker who should learn your internals.

### `error-field-level`

**SHOULD**, for validation failures, identify the specific offending fields using a
consistent extension member so clients can map errors to inputs. This standard
**RECOMMENDS** an `errors` array of per-field problems:

```json
{
  "type": "https://errors.example.com/validation-failed",
  "title": "Validation failed",
  "status": 422,
  "code": "validation_failed",
  "errors": [
    { "field": "email", "code": "invalid_format", "detail": "Not a valid email address." },
    { "field": "age", "code": "out_of_range", "detail": "Must be between 0 and 150." }
  ]
}
```

**MUST** use a stable, documented path syntax to reference nested fields (for example
JSON Pointer, `items/0/quantity`) and apply it consistently.

### `error-actionable`

**SHOULD** tell the consumer what to do about retriable conditions: pair `429` and
`503` with `Retry-After` (see [Rate limiting](11-rate-limiting.md)), and indicate in
the body whether an operation may be safely retried.

### `error-correlation`

**SHOULD** include a correlation/request identifier in the error (commonly via
`instance` or an extension member) that matches a response header (see
[Requests and responses](05-requests-and-responses.md#header-request-id)), so a
consumer can report it and an operator can find the corresponding logs.

## Consistency

### `error-consistent-shape`

**MUST** return the same error shape for every error across the entire API —
including errors produced by gateways, middleware, and frameworks, which often
default to HTML or a different JSON shape. Configure the edge so that a `404` from
the framework and a `404` from your code look identical to the consumer.

### `error-no-success-in-error`

**MUST NOT** return partial-success results in an error response or error results in
a success response. For operations that can partially succeed (batch/bulk), use the
explicit per-item result model in
[Batch and bulk operations](../patterns/batch-and-bulk.md), not an ambiguous mixed body.

### `error-localization`

**MAY** localize the human-readable `title` and `detail` based on the request's
`Accept-Language`. If localized, the machine-readable `code`/`type` **MUST** remain
constant across languages — only human text changes.

## Common mistakes

- `200 OK` with `{"error": "..."}` (use a `4xx`/`5xx` status — see
  [`status-correct-class`](04-http-methods-and-status.md#status-correct-class)).
- A different error shape from the gateway than from the application.
- Branching on `detail` text because there is no stable `code`.
- Leaking stack traces or internal identifiers in `detail`.
- Validation errors that say "invalid input" without naming the field.
