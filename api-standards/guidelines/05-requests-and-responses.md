# 05 — Requests and Responses

This document covers the envelope around the resource: media types, headers,
content negotiation, and the conventions every JSON body follows.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Media types and content negotiation

### `payload-json-default`

**MUST** use JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)) as the
default representation for resource bodies, with the media type
`application/json`. JSON is the lingua franca of REST APIs and what SDK tooling
assumes. Other formats (CSV, binary, etc.) **MAY** be offered for resources where
they are genuinely more appropriate (file content, exports).

### `payload-content-type-required`

**MUST** send a `Content-Type` header that accurately describes any request or
response body, and **MUST** send `charset=utf-8` semantics by encoding all text as
UTF-8. **MUST NOT** send a body without a `Content-Type`.

### `payload-utf8`

**MUST** encode all text as UTF-8, in requests and responses. **MUST NOT** require a
byte-order mark. Property names and string values are Unicode.

### `payload-respect-accept`

**SHOULD** honor the client's `Accept` header for content negotiation and respond
`406 Not Acceptable` when no acceptable representation can be produced. An API that
only speaks JSON **MAY** ignore `Accept` and always return JSON, but **MUST** still
return valid JSON, not a different format.

### `payload-validate-content-type`

**MUST** respond `415 Unsupported Media Type` when a request body arrives with a
`Content-Type` the endpoint does not support, rather than attempting to parse it as
something else.

## JSON body conventions

### `payload-top-level-object`

**MUST** make the top-level JSON value of every response body an **object**, never a
bare array or primitive. A top-level object can grow new fields (pagination
metadata, links, warnings) without breaking parsers; a top-level array cannot.
Collection responses therefore wrap items in an object — see
[Collections](08-collections.md).

### `payload-no-envelope`

**MUST NOT** wrap successful single-resource responses in a generic envelope (such
as `{"data": {...}, "status": "ok"}`). The resource *is* the body. Reserve
top-level metadata fields for genuine cross-cutting concerns (pagination links,
warnings). Status belongs in the HTTP status line, not the body.

### `payload-omit-vs-null`

**MUST** distinguish "absent" from "null" deliberately and document the choice:

- **Omitting** a property means "no information / not applicable."
- A `null` value means "explicitly has no value."

**SHOULD** omit properties that are not applicable rather than sending `null`,
unless a `null` carries distinct meaning the consumer needs. Within one API the
choice **MUST** be consistent. On `PATCH`, sending `null` **MUST** mean "clear this
field" and omitting it **MUST** mean "leave it unchanged" (see
[merge patch semantics](04-http-methods-and-status.md#method-patch-partial)).

### `payload-no-sensitive-data`

**MUST NOT** include secrets, full credential values, or sensitive data in responses
beyond what the consumer is authorized to see and needs. Return a created secret
exactly once at creation time if at all; never echo it on subsequent reads.

### `payload-stable-shape`

**MUST** return a stable shape for a given resource: the same property always has the
same type. **MUST NOT** sometimes return a field as a string and sometimes as an
object, or sometimes as a scalar and sometimes as an array. Polymorphism is handled
explicitly (see [Data types](06-data-types.md#polymorphism)).

### `payload-unknown-fields-ignored`

**SHOULD** ignore unknown fields in request bodies rather than rejecting them, to
support forward compatibility — but **MUST** document this behavior, and **MUST NOT**
ignore an unknown field whose presence indicates a likely client error on a
security-sensitive operation. (An API **MAY** instead choose strict rejection; the
choice must be consistent and documented.)

## Headers

### `header-standard-first`

**MUST** prefer a standard HTTP header over a custom one whenever a standard header
expresses the need (`Authorization`, `Content-Type`, `Accept`, `ETag`, `Location`,
`Retry-After`, `Cache-Control`, `Content-Location`). Do not reinvent these.

### `header-case-insensitive`

**MUST NOT** depend on the case of received header names; HTTP field names are
case-insensitive. **SHOULD** emit headers using their conventional capitalization
(see [Naming](02-naming.md#casing)).

### `header-request-id`

**SHOULD** accept a client-supplied correlation identifier and **SHOULD** return a
server-assigned request identifier on every response so that consumers can reference
a specific request in support and tracing. This standard **RECOMMENDS**
`X-Request-Id` for the de-facto compatibility it carries, echoing the client's value
when supplied and generating one otherwise. See
[Governance](12-governance.md) and tracing below.

### `header-no-secrets-in-custom`

**MUST NOT** invent custom headers that duplicate `Authorization` semantics. Carry
credentials in `Authorization` (see [Security](10-security.md)).

### `header-tracing`

**SHOULD** support standard distributed-tracing context propagation
([W3C Trace Context](https://www.w3.org/TR/trace-context/): `traceparent` and
`tracestate`) so that requests can be correlated across services without a
proprietary scheme.

## Caching

### `cache-explicit`

**SHOULD** send explicit caching directives (`Cache-Control`) on `GET` responses so
that intermediaries and clients cache correctly. Resources that must not be cached
**MUST** say so (`Cache-Control: no-store`). Do not rely on default heuristic
caching for resources whose freshness matters.

### `cache-validators`

**SHOULD** emit validators (`ETag` and/or `Last-Modified`) on cacheable resources so
clients can make conditional requests and avoid transferring unchanged data. See the
[Conditional requests pattern](../patterns/conditional-requests.md).

## Common mistakes

- A top-level array response that cannot later carry pagination metadata.
- A generic `{"data": ..., "error": ...}` envelope that duplicates the status line.
- Inconsistent null-vs-absent handling across endpoints.
- Custom auth headers instead of `Authorization`.
- No correlation/request ID, making production issues hard to trace.
