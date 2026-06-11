# 04 — HTTP Methods and Status Codes

HTTP already defines a uniform, well-understood vocabulary of verbs and result
codes. Using them for their standard meanings is what lets caches, proxies, and
generic clients work correctly without special-casing your API.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).
> The authority for method and status semantics is
> [RFC 9110 (HTTP Semantics)](https://www.rfc-editor.org/rfc/rfc9110).

## Methods

### `method-standard-semantics`

**MUST** use HTTP methods only with their standard semantics:

| Method | Purpose | Safe | Idempotent | Request body | Success response |
|--------|---------|------|------------|--------------|------------------|
| `GET` | Retrieve a resource or collection | Yes | Yes | No | `200` with representation |
| `HEAD` | Like `GET` but headers only | Yes | Yes | No | `200`, no body |
| `POST` | Create a subordinate resource, or invoke a non-idempotent action | No | No | Yes | `201`/`200`/`202` |
| `PUT` | Create or fully replace a resource at a known URL | No | Yes | Yes | `200`/`201`/`204` |
| `PATCH` | Apply a partial modification | No | No\* | Yes | `200`/`204` |
| `DELETE` | Remove a resource | No | Yes | Optional | `200`/`202`/`204` |
| `OPTIONS` | Discover communication options | Yes | Yes | No | `200`/`204` |

\* `PATCH` can be made idempotent by design; see `method-patch-idempotency`.

### `method-get-no-side-effects`

**MUST NOT** cause state changes via `GET` or `HEAD`. Safe methods are assumed
side-effect-free by caches, prefetchers, crawlers, and link-checkers. A `GET` that
mutates state will be triggered unexpectedly and cannot be retried safely.

### `method-get-no-body`

**MUST NOT** require a request body on `GET`. Bodies on `GET` are not universally
supported by intermediaries and clients. When a query is too large or complex for
the query string, use a `POST` to a search sub-resource (see
[Collections](08-collections.md)).

### `method-put-full-replace`

**MUST** treat `PUT` as a full replacement of the target resource with the supplied
representation. Fields omitted from a `PUT` body **MUST** be reset to their default
or cleared, not left unchanged. A consumer that wants to change one field uses
`PATCH`, not `PUT`.

### `method-patch-partial`

**MUST** treat `PATCH` as a partial update: only the fields present in the request
are modified. **MUST** document the patch format used — either a
[merge patch](https://www.rfc-editor.org/rfc/rfc7386) (`application/merge-patch+json`,
**RECOMMENDED** for most APIs) or a
[JSON Patch](https://www.rfc-editor.org/rfc/rfc6902)
(`application/json-patch+json`) for fine-grained operations. **MUST NOT** silently
accept both with the same media type.

### `method-patch-idempotency`

**SHOULD** design `PATCH` semantics to be idempotent where practical (setting fields
to absolute values is idempotent; relative operations like "increment" are not).
When `PATCH` is not idempotent, support the
[Idempotency-Key pattern](../patterns/idempotency.md) so clients can retry safely.

### `method-idempotency`

**MUST** make `GET`, `HEAD`, `PUT`, and `DELETE` idempotent: repeating the same
request has the same effect on server state as making it once. This lets clients
safely retry after a network failure. `POST` is not idempotent; when a client needs
retry-safe creation, support the [Idempotency-Key pattern](../patterns/idempotency.md).

### `method-no-custom-methods`

**MUST NOT** invent non-standard HTTP methods. If an operation does not fit a
standard method, model it as a resource or action (see
[URLs and resources](03-urls-and-resources.md#actions)).

## Status codes

### `status-correct-class`

**MUST** return a status code whose class matches the outcome:

- `2xx` — the request succeeded.
- `3xx` — further action (usually a redirect) is needed.
- `4xx` — the request was rejected because of something the **client** can fix.
- `5xx` — the request was valid but the **server** failed to fulfill it.

**MUST NOT** return `200 OK` with an error described in the body. Reporting failure
in a `2xx` response breaks every client, cache, and tool that relies on the status
line. Errors use `4xx`/`5xx` with a [Problem Details](07-errors.md) body.

### `status-use-standard-codes`

**MUST** use the standard, registered status codes for their defined meaning and
**SHOULD** restrict usage to this common set unless a more specific registered code
clearly applies:

| Code | When |
|------|------|
| `200 OK` | Successful `GET`/`PATCH`/`PUT`/`DELETE`/action returning a body |
| `201 Created` | A resource was created; include a `Location` header |
| `202 Accepted` | Request accepted for async processing (see [LRO pattern](../patterns/long-running-operations.md)) |
| `204 No Content` | Success with no response body |
| `301`/`308` | Resource moved permanently |
| `302`/`307` | Resource is temporarily elsewhere |
| `304 Not Modified` | Conditional `GET` whose validators matched (see [Conditional requests](../patterns/conditional-requests.md)) |
| `400 Bad Request` | Malformed syntax or invalid parameters the client must fix |
| `401 Unauthorized` | Missing or invalid authentication |
| `403 Forbidden` | Authenticated but not permitted |
| `404 Not Found` | No such resource (or hidden for authorization reasons) |
| `405 Method Not Allowed` | Method not supported on this resource; include `Allow` |
| `406 Not Acceptable` | Cannot produce any representation the client will accept |
| `409 Conflict` | Request conflicts with current state (e.g. duplicate, version conflict) |
| `410 Gone` | Resource existed but is permanently removed |
| `412 Precondition Failed` | A conditional request's precondition failed |
| `415 Unsupported Media Type` | Request body media type not supported |
| `422 Unprocessable Content` | Syntactically valid but semantically invalid (see below) |
| `428 Precondition Required` | The server requires a conditional request |
| `429 Too Many Requests` | Rate limit exceeded (see [Rate limiting](11-rate-limiting.md)) |
| `500 Internal Server Error` | Unexpected server fault |
| `502`/`503`/`504` | Upstream failure, overload/maintenance, upstream timeout |

### `status-400-vs-422`

**MAY** distinguish `400 Bad Request` (the request is malformed — bad JSON, wrong
types, missing required fields) from `422 Unprocessable Content` (the request is
well-formed but violates a business rule). **MUST** pick one convention and apply it
consistently; do not return `400` for a validation error on one endpoint and `422`
for the same kind of error on another.

### `status-401-vs-403`

**MUST** return `401 Unauthorized` when authentication is missing or invalid (the
client should authenticate and retry) and `403 Forbidden` when the authenticated
principal is not allowed (retrying without a credential change will not help).
A `401` response **MUST** include a `WWW-Authenticate` header.

### `status-404-for-authorization`

**MAY** return `404 Not Found` instead of `403 Forbidden` when revealing the
resource's existence would itself leak sensitive information. Choose one behavior
per resource type and document it. See [Security](10-security.md).

### `status-201-location`

**MUST** include a `Location` header pointing to the new resource's URL on every
`201 Created` response, and **SHOULD** return the created resource's representation
in the body.

### `status-405-allow`

**MUST** include an `Allow` header listing the supported methods when responding
`405 Method Not Allowed`.

### `status-no-vanity-codes`

**MUST NOT** use unregistered or repurposed status codes (e.g. returning `418`, or
`200` to mean "partial failure"). Clients and intermediaries interpret status codes
by their registered meaning.

## Common mistakes

- `200 OK` with `{"success": false}` instead of a `4xx`/`5xx` status.
- Using `PUT` for partial updates, silently leaving omitted fields unchanged.
- `POST` for retrieval because the query was "too big" — use a search sub-resource.
- `403` where `401` is correct (or vice versa), leaving clients unable to recover.
- `500` for client mistakes, which hides real server faults in the noise.
