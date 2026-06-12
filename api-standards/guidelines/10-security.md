# 10 — Security

Security is part of the contract, not a layer added afterward. This document defines
the baseline every conformant API meets: encrypted transport, authenticated access,
least-privilege authorization, and safe handling of input and secrets. It is a
baseline, not a complete security program.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Transport

### `security-tls-only`
<a id="SDLC-API-0138"></a>**`SDLC-API-0138`**

**MUST** serve the API exclusively over TLS (HTTPS). **MUST NOT** offer any
plaintext HTTP endpoint that accepts credentials or data; an HTTP listener, if any,
**MUST** only redirect to HTTPS. Plaintext exposes credentials and data to anyone on
the network path.

### `security-modern-tls`
<a id="SDLC-API-0139"></a>**`SDLC-API-0139`**

**MUST** require a modern TLS version (TLS 1.2 or higher; TLS 1.3 **RECOMMENDED**)
and **MUST NOT** accept known-broken protocol versions or cipher suites. **SHOULD**
send `Strict-Transport-Security` (HSTS) so clients refuse to downgrade.

### `security-no-secrets-in-url`
<a id="SDLC-API-0140"></a>**`SDLC-API-0140`**

**MUST NOT** transmit credentials, tokens, or sensitive data in the URL path or query
string (restating [`url-no-secrets`](03-urls-and-resources.md#url-no-secrets)). URLs
are logged and cached. Carry credentials in the `Authorization` header and sensitive
data in the request body.

## Authentication

### `security-authn-required`
<a id="SDLC-API-0141"></a>**`SDLC-API-0141`**

**MUST** require authentication for every endpoint that exposes non-public data or
any mutating operation. Endpoints that are genuinely public **MUST** be an explicit,
documented decision, not an accident of a missing check.

### `security-standard-auth`
<a id="SDLC-API-0142"></a>**`SDLC-API-0142`**

**MUST** use a standard authentication mechanism rather than a bespoke one.
**RECOMMENDED**: [OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749) bearer tokens
([RFC 6750](https://www.rfc-editor.org/rfc/rfc6750)) for delegated/user access, with
[OpenID Connect](https://openid.net/connect/) where identity is needed. Tokens are
**RECOMMENDED** to be [JWTs](https://www.rfc-editor.org/rfc/rfc7519) or opaque tokens
validated against an authorization server. Service-to-service callers **MAY** use
API keys or mTLS. **MUST NOT** invent a homegrown signing or credential scheme.

### `security-authorization-header`
<a id="SDLC-API-0143"></a>**`SDLC-API-0143`**

**MUST** carry the credential in the standard `Authorization` header
(`Authorization: Bearer <token>`). On rejection, **MUST** return `401 Unauthorized`
with a `WWW-Authenticate` header describing the scheme (see
[`status-401-vs-403`](04-http-methods-and-status.md#status-401-vs-403)).

### `security-token-validation`
<a id="SDLC-API-0144"></a>**`SDLC-API-0144`**

**MUST** fully validate every token on every request: signature/issuer/audience,
expiry, and revocation where applicable. **MUST NOT** trust claims from an unverified
token, and **MUST NOT** accept expired tokens. **SHOULD** keep access-token lifetimes
short and support refresh rather than long-lived bearer tokens.

### `security-no-credentials-in-code-paths`
<a id="SDLC-API-0145"></a>**`SDLC-API-0145`**

**MUST NOT** log credentials, tokens, or `Authorization` header values. **MUST**
redact them in logs, traces, and error messages (see
[`error-human-message`](07-errors.md#error-human-message)).

## Authorization

### `security-authz-server-side`
<a id="SDLC-API-0146"></a>**`SDLC-API-0146`**

**MUST** enforce authorization on the server for every request, independent of any
client-side checks. **MUST NOT** rely on the client hiding a button, omitting a
field, or knowing a URL as an access control. Every request is independently
authorized.

### `security-least-privilege`
<a id="SDLC-API-0147"></a>**`SDLC-API-0147`**

**MUST** grant the least privilege necessary. **SHOULD** model permissions as
fine-grained **scopes** (for delegated OAuth access) and/or roles, and check that the
caller's scopes/roles permit the specific operation on the specific resource.
**MUST NOT** treat authentication as authorization — being a valid caller is not the
same as being permitted.

### `security-object-level-authz`
<a id="SDLC-API-0148"></a>**`SDLC-API-0148`**

**MUST** verify that the authenticated principal may act on the **specific**
resource instance, not merely on the resource type. Checking "may read orders" but
not "may read *this* order" is the most common serious API vulnerability (broken
object-level authorization); an attacker simply changes the identifier in the URL.

### `security-avoid-enumeration`
<a id="SDLC-API-0149"></a>**`SDLC-API-0149`**

**SHOULD** prevent resource enumeration: use non-sequential, non-guessable
identifiers for resources exposed to untrusted callers (see
[`type-id-no-leak`](06-data-types.md#type-id-no-leak)), and **MAY** return
`404 Not Found` instead of `403 Forbidden` where the existence of a resource is
itself sensitive (see
[`status-404-for-authorization`](04-http-methods-and-status.md#status-404-for-authorization)).

## Input handling

### `security-validate-input`
<a id="SDLC-API-0150"></a>**`SDLC-API-0150`**

**MUST** validate every input — path and query parameters, headers, and body —
against an explicit schema of allowed types, ranges, lengths, and formats, and reject
violations with `400`/`422` (see [Errors](07-errors.md)). Treat all client input as
untrusted.

### `security-no-injection`
<a id="SDLC-API-0151"></a>**`SDLC-API-0151`**

**MUST NOT** construct backend queries, commands, or downstream requests by
concatenating untrusted input. Use parameterized queries and safe encoding. This
applies especially to [filter and sort expressions](08-collections.md#filtering),
which **MUST** be parsed and validated against an allowlist, never passed through.

### `security-limit-payload-size`
<a id="SDLC-API-0152"></a>**`SDLC-API-0152`**

**MUST** enforce a maximum request body size and reject larger payloads (`413
Content Too Large`), and **MUST** bound the size and depth of nested structures and
arrays. Unbounded input is a denial-of-service vector.

### `security-mass-assignment`
<a id="SDLC-API-0153"></a>**`SDLC-API-0153`**

**MUST** bind request bodies only to fields the caller is permitted to set.
**MUST NOT** blindly map an incoming object onto an internal record (mass
assignment), which lets a caller set fields like `isAdmin`, `ownerId`, or `balance`.
Accept an explicit, documented set of writable fields per operation.

## Response hygiene

### `security-minimal-exposure`
<a id="SDLC-API-0154"></a>**`SDLC-API-0154`**

**MUST** return only the data the caller is authorized to see, filtered per
principal — not the full record with sensitive fields the client is trusted to hide.
**MUST NOT** include internal system details (stack traces, internal hostnames,
infrastructure identifiers) in any response (see [Errors](07-errors.md)).

### `security-cors-explicit`
<a id="SDLC-API-0155"></a>**`SDLC-API-0155`**

**MUST**, for browser-facing APIs, configure
[CORS](https://www.w3.org/TR/cors/) explicitly with a specific allowlist of origins,
methods, and headers. **MUST NOT** reflect arbitrary origins or pair
`Access-Control-Allow-Origin: *` with credentialed requests.

### `security-rate-limit`
<a id="SDLC-API-0156"></a>**`SDLC-API-0156`**

**MUST** apply rate limiting and abuse protection to authentication endpoints and
**SHOULD** apply it across the API (see [Rate limiting](11-rate-limiting.md)) to
blunt brute-force, scraping, and denial-of-service attempts.

### `security-relevant-headers`
<a id="SDLC-API-0157"></a>**`SDLC-API-0157`**

**SHOULD** set defensive response headers where applicable: `Cache-Control:
no-store` on sensitive responses (so credentials and personal data are not cached),
and `Content-Type` with the correct type so clients do not sniff. APIs that can
return content rendered by browsers **SHOULD** set `X-Content-Type-Options: nosniff`.

## Common mistakes

- Type-level authorization without object-level checks (changing the ID in the URL
  returns someone else's data).
- Mass assignment that lets a request set privileged fields.
- Putting tokens or API keys in query strings, where they end up in logs.
- Passing filter/sort input into a backend query unsanitized.
- Returning the full internal record and trusting the client to hide fields.
