# 11 — Rate Limiting

Every API has finite capacity. Rate limiting protects the service and its users from
overload and abuse, and — done well — lets well-behaved clients stay within limits
automatically. The goal is a limit that is predictable, observable, and recoverable.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Applying limits

### `ratelimit-apply`
<a id="SDLC-API-0158"></a>**`SDLC-API-0158`**

**SHOULD** apply rate limits to protect the service, and **MUST** apply them to
authentication and other abuse-prone endpoints (see
[`security-rate-limit`](10-security.md#security-rate-limit)). An API with no limits
can be taken down by a single misbehaving client.

### `ratelimit-documented`
<a id="SDLC-API-0159"></a>**`SDLC-API-0159`**

**MUST** document the limits that apply: the dimension they are scoped to (per API
key, per user, per IP, per tenant), the quota, and the window. Consumers cannot
build resilient clients against an undocumented, invisible limit.

### `ratelimit-scope`
<a id="SDLC-API-0160"></a>**`SDLC-API-0160`**

**SHOULD** scope limits to the authenticated principal (API key, client, or user)
rather than to the source IP alone, so that one client cannot exhaust another's
capacity and so that shared-NAT clients are not penalized for each other. **MAY**
layer an IP-based limit beneath the principal limit for unauthenticated traffic.

## Signaling rejection

### `ratelimit-429`
<a id="SDLC-API-0161"></a>**`SDLC-API-0161`**

**MUST** reject requests that exceed a limit with `429 Too Many Requests` and a
[Problem Details](07-errors.md) body explaining the limit. **MUST NOT** use a generic
`400` or `403` for throttling, which prevents clients from reacting correctly.

### `ratelimit-retry-after`
<a id="SDLC-API-0162"></a>**`SDLC-API-0162`**

**MUST** include a `Retry-After` header on `429` (and on `503` when shedding load)
telling the client how long to wait before retrying — as a number of seconds or an
HTTP date. A throttling response without `Retry-After` forces clients to guess, and
they usually guess by hammering.

### `ratelimit-headers`
<a id="SDLC-API-0163"></a>**`SDLC-API-0163`**

**SHOULD** expose the client's current limit state on responses so clients can
self-pace *before* being throttled, not just after. This standard **RECOMMENDS** the
fields defined by the IETF
[RateLimit header fields](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
draft — a structured `RateLimit` header conveying remaining quota and reset time —
and, for broad client compatibility, **MAY** additionally emit the widely-deployed
de-facto headers:

| Header | Meaning |
|--------|---------|
| `RateLimit` | Structured remaining quota and reset (preferred, standards-track) |
| `RateLimit-Policy` | The policy (quota and window) in effect |
| `X-RateLimit-Limit` | Total requests allowed in the window (de-facto) |
| `X-RateLimit-Remaining` | Requests remaining in the current window (de-facto) |
| `X-RateLimit-Reset` | When the window resets (de-facto) |

**MUST** pick one primary scheme and emit it consistently across the API.

## Client guidance the API enables

### `ratelimit-idempotent-retry`
<a id="SDLC-API-0164"></a>**`SDLC-API-0164`**

**SHOULD** make throttled requests safe to retry by supporting idempotency on unsafe
operations (see [Idempotency keys](../patterns/idempotency.md)), so that a client
honoring `Retry-After` cannot cause duplicate side effects.

### `ratelimit-backoff-friendly`
<a id="SDLC-API-0165"></a>**`SDLC-API-0165`**

**SHOULD** design limits and `Retry-After` values to reward exponential backoff with
jitter, and **SHOULD** document that clients are expected to back off rather than
retry immediately. **SHOULD NOT** penalize a client that respects `Retry-After` by
counting the rejected request against a stricter abuse threshold.

## Server behavior under load

### `ratelimit-graceful-degradation`
<a id="SDLC-API-0166"></a>**`SDLC-API-0166`**

**SHOULD** distinguish *rate limiting* (`429` — the client exceeded its allotted
quota) from *overload* (`503 Service Unavailable` — the server as a whole cannot
serve right now). Use `429` for per-client quota enforcement and `503` with
`Retry-After` for capacity shedding. Conflating them misleads clients about whether
slowing down will help.

### `ratelimit-fairness`
<a id="SDLC-API-0167"></a>**`SDLC-API-0167`**

**SHOULD** enforce limits fairly so that heavy clients cannot starve light ones, and
**SHOULD** consider request *cost* (an expensive query may consume more quota than a
cheap one) rather than counting all requests equally where costs vary widely.

## Common mistakes

- Throttling with `403`/`400` so clients cannot tell it is a rate limit.
- `429` with no `Retry-After`, so clients retry immediately and make it worse.
- No pre-emptive limit headers, so clients only learn the limit by hitting it.
- IP-only limits that punish shared-NAT users and miss per-key abuse.
- Non-idempotent operations plus retries, producing duplicate side effects.
