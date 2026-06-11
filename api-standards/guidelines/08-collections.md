# 08 — Collections

Collections are where most API performance and consistency problems live. A
collection endpoint must remain usable when it holds ten items and when it holds ten
million. This document defines pagination, filtering, sorting, and field selection.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Collection responses

### `collection-envelope`

**MUST** return a collection as a JSON **object** containing an array of items plus
metadata — never a bare top-level array (see
[`payload-top-level-object`](05-requests-and-responses.md#payload-top-level-object)).
This standard **RECOMMENDS** this envelope:

```json
{
  "items": [ { "id": "1" }, { "id": "2" } ],
  "pageSize": 2,
  "nextPage": "https://api.example.com/v1/orders?cursor=eyJrIjoyfQ"
}
```

**MUST** name the array consistently across the whole API (this standard uses
`items`). The envelope can grow new metadata fields without breaking consumers.

### `collection-item-shape`

**SHOULD** return collection items in the same shape as the single-resource
representation, optionally trimmed to a documented subset of fields for efficiency.
**MUST NOT** return a fundamentally different shape that forces consumers to write
two parsers for one resource type.

## Pagination

### `collection-pagination-required`

**MUST** paginate any collection that can grow without a fixed, small upper bound.
An endpoint that returns "all" rows will eventually time out, exhaust memory, or
return unusably large payloads. Pagination is not optional for unbounded data.

### `collection-default-and-max-page-size`

**MUST** apply a sensible default page size when the client does not specify one, and
**MUST** enforce a maximum page size that caps server cost. **MUST** name the
client's page-size parameter `pageSize`. If a client requests more than the maximum,
**SHOULD** clamp to the maximum (and **MAY** indicate this) rather than rejecting.

### `collection-cursor-pagination`

**SHOULD** use **cursor- (token-) based** pagination for large or frequently-changing
collections. The server returns an opaque cursor that the client passes back to get
the next page:

```http
GET /v1/orders?pageSize=50
GET /v1/orders?pageSize=50&cursor=eyJrIjoxMjN9
```

Cursor pagination is stable under concurrent inserts and deletes and scales to large
offsets, whereas offset pagination skips or duplicates rows when the underlying data
changes and degrades as the offset grows.

### `collection-cursor-opaque`

**MUST** treat the cursor as opaque to the client: clients **MUST NOT** construct or
parse it, and the server **MUST NOT** require them to. The server **MAY** encode page
position, filters, and sort within it. A cursor **MUST** remain valid for a
documented window and **SHOULD** fail gracefully (`400` with a clear code) when
expired or malformed.

### `collection-offset-pagination`

**MAY** offer offset/limit pagination (`page`, `pageSize` or `offset`, `limit`) for
small, stable collections or where consumers need random page access. When offered,
**MUST** document the data-skew caveat above and **MUST** cap the maximum offset.

### `collection-next-link`

**SHOULD** return a ready-to-use link to the next page (and, where applicable, the
previous page) in the response so clients can follow it without reconstructing query
parameters. Absence of a next link **MUST** unambiguously mean "no more pages."

### `collection-total-count-optional`

**SHOULD NOT** return a total count by default for large collections, because
computing an exact count is often as expensive as the query itself. **MAY** provide
the count behind an explicit opt-in parameter, and **MAY** return an estimate
clearly labeled as such.

## Filtering

### `collection-filter-param`

**SHOULD** support filtering via query parameters. Two approaches are acceptable;
**MUST** pick one per API and apply it consistently:

- **Per-field parameters** (simpler, easier to validate): `?status=open&priority=high`.
- **A single expression parameter** named `filter` (more expressive): supports
  comparison and boolean logic, e.g. `?filter=status eq 'open' and priority eq 'high'`.

### `collection-filter-grammar`

**MUST**, when offering an expression `filter`, document its grammar precisely
(operators, precedence, value syntax, escaping) and validate input, returning `400`
with a clear [error](07-errors.md) on malformed expressions. **MUST NOT** pass filter
expressions through to a backend query engine unsanitized (injection risk — see
[Security](10-security.md)).

### `collection-filter-defined-fields`

**MUST** restrict filtering to an explicitly documented set of fields and operators.
**MUST NOT** allow arbitrary filtering on every field by default, which couples the
public contract to internal storage and creates performance and security cliffs.

## Sorting

### `collection-sort-param`

**SHOULD** support sorting via a `sort` parameter accepting one or more fields with
an explicit direction, applied in order:

```http
GET /v1/orders?sort=createdAt desc,total asc
```

**MUST** restrict sortable fields to a documented set, **MUST** define a stable
default sort (so pagination is deterministic), and **MUST** ensure the sort yields a
total order (break ties on a unique field such as `id`) so cursor pagination cannot
skip or repeat items.

## Field selection and embedding

### `collection-field-selection`

**MAY** support sparse fieldsets via a `fields` parameter so clients can request only
the properties they need (`?fields=id,status,total`), reducing payload size. When
offered, **MUST** always include the resource's identifier regardless of selection,
and **MUST** validate field names.

### `collection-embedding`

**MAY** support opt-in expansion of related resources via an `expand` (or `include`)
parameter (`?expand=customer,lineItems`) so clients can avoid extra round-trips.
**MUST** keep expansion opt-in (default to references, per
[`resource-relationship-by-reference`](03-urls-and-resources.md#resource-relationship-by-reference)),
**MUST** bound expansion depth, and **MUST** document which relationships are
expandable.

## Large or complex queries

### `collection-search-subresource`

**SHOULD**, when query criteria are too large or complex to express safely in a query
string (long lists of values, structured predicates), accept them in the body of a
`POST` to a dedicated search sub-resource (`POST /orders/search`) that returns a
paginated collection. This avoids URL-length limits and request bodies on `GET`
(see [`method-get-no-body`](04-http-methods-and-status.md#method-get-no-body)). Such
a search `POST` is safe in intent; document it as non-mutating.

## Standard query parameter names

To keep collections uniform across APIs, this standard reserves these names:

| Parameter | Meaning |
|-----------|---------|
| `pageSize` | Maximum items per page |
| `cursor` | Opaque pagination token |
| `page` / `offset` | Offset-based pagination position (if offered) |
| `filter` | Filter expression (if the expression approach is used) |
| `sort` | Sort fields and directions |
| `fields` | Sparse fieldset selection |
| `expand` | Related-resource expansion |

**MUST NOT** repurpose these names for unrelated meanings.

## Common mistakes

- Returning an unbounded array with no pagination.
- Offset pagination over data that changes, silently skipping/duplicating rows.
- A non-deterministic default sort, making pages non-repeatable.
- Allowing arbitrary filtering/sorting on every column, coupling the API to storage.
- A bare top-level array that can never carry a `nextPage` link.
