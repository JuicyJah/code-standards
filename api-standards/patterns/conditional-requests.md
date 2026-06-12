# Conditional Requests
<a id="SDLC-API-P-0002"></a>**`SDLC-API-P-0002`**

## Problem

Two problems share one solution. **Lost updates**: two clients read a resource, both
modify it, and the second write silently overwrites the first. **Wasted transfer**: a
client re-fetches a resource that has not changed since it last saw it. Both are
solved by giving each resource version a *validator* and letting clients make
requests conditional on it.

## When to use

Use this pattern when concurrent updates to a resource can conflict (to prevent lost
updates), or when clients re-fetch resources that change infrequently (to save
bandwidth and latency). Resources that are immutable or single-writer may not need
it.

## Solution

The server stamps each resource representation with a validator and honors
conditional headers defined by
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#name-conditional-requests).

### Emitting validators

- The server **SHOULD** return an `ETag` header on `GET` responses for resources that
  support conditional requests. The `ETag` is an opaque string identifying the
  current version of the representation.
- A **strong** `ETag` (`"a1b2c3"`) means byte-for-byte identity; a **weak** `ETag`
  (`W/"a1b2c3"`) means semantic equivalence. Use strong ETags for concurrency
  control.
- The server **MAY** additionally emit `Last-Modified`, but `ETag` is preferred
  because it is precise and not limited to one-second resolution.

### Optimistic concurrency (prevent lost updates)

- A client that updates a resource **SHOULD** send the `ETag` it last saw in an
  `If-Match` header on the `PUT`/`PATCH`/`DELETE`.
- The server **MUST** perform the write only if the current `ETag` matches; if it
  does not, the server **MUST** reject the write with `412 Precondition Failed` and
  make no change. The client re-reads, reconciles, and retries.
- The server **MAY** require this by responding `428 Precondition Required` to an
  unconditional unsafe request on a resource where lost updates matter.
- To create a resource only if it does not already exist, a client **MAY** send
  `If-None-Match: *`; the server **MUST** respond `412` if it already exists.

### Cache validation (avoid wasted transfer)

- A client that has a cached copy **SHOULD** send `If-None-Match` with the stored
  `ETag` on a `GET`.
- If the resource is unchanged, the server **MUST** respond `304 Not Modified` with
  no body; the client reuses its cached copy. Otherwise the server returns `200` with
  the new representation and a new `ETag`.

### Computing ETags

- The server **MUST** change the `ETag` whenever the representation changes and
  **MUST** keep it stable while the representation does not. A version number, a
  content hash, or a last-modified timestamp combined with an identifier are all
  acceptable sources.
- The `ETag` is **opaque**: clients **MUST NOT** parse or compare it for ordering;
  they only test equality by echoing it back.

## Example

Read, capturing the validator:

```http
GET /v1/articles/art_5
```

```http
HTTP/1.1 200 OK
ETag: "v7"

{ "id": "art_5", "title": "Hello", "body": "..." }
```

Conditional update — succeeds only if still at `"v7"`:

```http
PATCH /v1/articles/art_5
If-Match: "v7"
Content-Type: application/merge-patch+json

{ "title": "Hello, world" }
```

If another writer already advanced the resource:

```http
HTTP/1.1 412 Precondition Failed
Content-Type: application/problem+json

{ "type": "https://errors.example.com/version-conflict",
  "title": "Version conflict", "status": 412, "code": "version_conflict" }
```

## Consequences

- Clients **MUST** be prepared to handle `412` by re-reading and retrying; this is
  the normal, expected outcome under contention, not an error to surface raw to users.
<!-- param: precondition_retry_max | 3 | Maximum 412 retry attempts | This organization retries a write rejected with 412 Precondition Failed at most {value} times before surfacing a conflict to the caller. -->
- `ETag`-based concurrency works across multiple servers without sticky sessions,
  because the validator lives in the resource, not in server memory.
- A common mistake is generating a new `ETag` on every read (e.g. from a timestamp
  that includes the read time), which makes every conditional request miss. The
  `ETag` must depend only on the representation.

## Related

- Guidelines: [HTTP methods and status](../guidelines/04-http-methods-and-status.md),
  [Requests and responses](../guidelines/05-requests-and-responses.md#caching).
- Patterns: [Idempotency keys](idempotency.md) (retry safety, a different concern).
