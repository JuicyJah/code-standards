# 03 — URLs and Resources

The URL is how a consumer forms a mental model of the API. A well-structured URL
space is self-describing: a developer who has seen a few endpoints can predict the
rest. This document covers resource modeling and URL structure.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Resource modeling

### `resource-noun`
<a id="SDLC-API-0026"></a>**`SDLC-API-0026`**

**MUST** model each addressable thing as a resource named by a noun, and manipulate
it with the standard HTTP methods (see
[HTTP methods](04-http-methods-and-status.md)). Resources are typically one of:

- A **collection** — a set of resources of one type (`/articles`).
- An **item** — a single member of a collection, addressed by identifier
  (`/articles/{articleId}`).
- A **singleton** — a single resource that is not a member of a collection
  (`/me`, `/settings`).

### `resource-stable-identity`
<a id="SDLC-API-0027"></a>**`SDLC-API-0027`**

**MUST** give each resource a stable identity: the same logical resource keeps the
same URL over its lifetime. Identifiers in URLs **MUST NOT** be reused for a
different resource after deletion. Stable URLs let consumers store references,
cache, and link.

### `resource-from-domain`
<a id="SDLC-API-0028"></a>**`SDLC-API-0028`**

**SHOULD** derive resources from the domain the API serves, not from the database
tables or internal services behind it. A resource may aggregate several backend
records, and one backend record may surface as several resources. Model what the
consumer needs to manipulate.

## URL structure

### `url-pattern`
<a id="SDLC-API-0029"></a>**`SDLC-API-0029`**

**MUST** structure URLs as a hierarchy of collection/identifier pairs:

```text
https://{host}/{base-path}/{collection}/{id}/{sub-collection}/{sub-id}
```

For example:

```text
https://api.example.com/v1/organizations/42/members/7
```

Each segment alternates between a collection name and an identifier within it. This
makes every URL parseable and every parent/child relationship visible.

### `url-https-only`
<a id="SDLC-API-0030"></a>**`SDLC-API-0030`**

**MUST** serve the API over HTTPS only. See [Security](10-security.md#transport).
URLs in this standard are always `https://`.

### `url-lowercase-path`
<a id="SDLC-API-0031"></a>**`SDLC-API-0031`**

**MUST** use lowercase `kebab-case` for API-defined path segments
(see [Naming](02-naming.md#casing)). Treat API-defined path segments as
**case-sensitive**: a request whose path casing does not match **MUST** fail with
`404 Not Found` rather than silently matching. (Identifier segments supplied by the
client may be compared case-insensitively when the underlying identity is, such as
a UUID.)

### `url-no-trailing-slash`
<a id="SDLC-API-0032"></a>**`SDLC-API-0032`**

**MUST** define each endpoint without a trailing slash (`/orders`, not `/orders/`)
and treat the two as equivalent or redirect consistently. Do not expose two URLs
that differ only by a trailing slash with different behavior.

### `url-stable-and-readable`
<a id="SDLC-API-0033"></a>**`SDLC-API-0033`**

**SHOULD** keep URLs readable and avoid unnecessary encoding. Prefer human-readable
identifiers and slugs where the domain allows; avoid forcing opaque UUIDs into the
path when a stable, readable key exists. **SHOULD** keep total URL length under
{{max_url_length|2000|Maximum URL length in characters}} characters so that intermediaries and browsers handle it; **MUST** respond
`414 URI Too Long` if a URL exceeds the server's supported length.

### `url-query-for-non-identity`
<a id="SDLC-API-0034"></a>**`SDLC-API-0034`**

**MUST** put information that **selects, filters, sorts, or paginates** in the query
string, not in the path. The path identifies *what* resource; the query string
shapes *how* it is returned. See [Collections](08-collections.md).

### `url-no-secrets`
<a id="SDLC-API-0035"></a>**`SDLC-API-0035`**

**MUST NOT** place secrets, credentials, tokens, or sensitive personal data in the
URL path or query string. URLs are logged by servers, proxies, and browsers. Carry
secrets in headers (see [Security](10-security.md)).

## Hierarchy and relationships

### `resource-nesting-depth`
<a id="SDLC-API-0036"></a>**`SDLC-API-0036`**

**SHOULD** limit URL nesting to one parent level (`/parents/{id}/children`).
Deeper nesting (`/a/{}/b/{}/c/{}/d`) couples the URL to a rigid hierarchy and grows
unwieldy. When a child has its own stable identity, **SHOULD** also expose it at a
top-level collection (`/children/{childId}`) so it can be addressed directly.

<!-- param: max_url_nesting_depth | 1 | Maximum URL nesting depth (parent levels) | This organization limits URL nesting to {value} parent level(s) before a child must be exposed at a top-level collection. -->


### `resource-relationship-by-reference`
<a id="SDLC-API-0037"></a>**`SDLC-API-0037`**

**SHOULD** express relationships between resources by including the related
resource's identifier (and optionally a URL) in the representation, rather than
embedding the full related resource by default. Offer embedding as an opt-in (see
[Collections](08-collections.md) on field selection) for consumers that need it.

### `resource-no-implementation-keys`
<a id="SDLC-API-0038"></a>**`SDLC-API-0038`**

**MUST NOT** expose internal surrogate keys (auto-increment database IDs that reveal
volume or order, internal node addresses) when a domain identifier or opaque ID
serves the consumer's need. See [Data types](06-data-types.md#identifiers).

## Actions

Some operations are genuinely not the creation, retrieval, update, or deletion of a
resource — for example, "send this invoice" or "cancel this job." Model these
deliberately.

### `resource-prefer-state`
<a id="SDLC-API-0039"></a>**`SDLC-API-0039`**

**SHOULD** first try to model an operation as a change of resource state rather than
an action. "Publish an article" can be `PATCH /articles/{id}` setting
`status: "published"`. State changes are more uniform and more evolvable than
actions.

### `resource-action-sub-resource`
<a id="SDLC-API-0040"></a>**`SDLC-API-0040`**

**SHOULD**, when a state change is not a natural fit, model the action as a
**sub-resource** that represents the action's record: `POST /jobs/{id}/cancellations`
creates a cancellation. This keeps the noun-based model and gives the action a
result resource that can carry status and timestamps.

### `resource-action-verb-segment`
<a id="SDLC-API-0041"></a>**`SDLC-API-0041`**

**MAY**, when neither of the above fits, use an explicit action segment marked so it
is unmistakably an action and cannot collide with a resource identifier. **MUST**
namespace such actions consistently — this standard **RECOMMENDS** a colon-prefixed
verb on the resource:

```text
POST /jobs/{id}:cancel
POST /documents/{id}:export
```

Action operations **MUST** use `POST` (they are neither safe nor idempotent by
default) and **MUST NOT** be used as an escape hatch to avoid resource modeling.
Keep them rare.

## Common mistakes

- RPC-style URLs (`/api/doThing`) that ignore the resource model.
- Putting filters in the path (`/orders/status/open`) instead of the query string
  (`/orders?filter=status eq 'open'`).
- Unbounded nesting that bakes a fragile hierarchy into every URL.
- Leaking database IDs that expose row counts or creation order.
- Two URLs for the same resource (with/without trailing slash, different casing)
  behaving differently.
