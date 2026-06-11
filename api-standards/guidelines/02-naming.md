# 02 — Naming

Names are the API's vocabulary. Consistent, predictable names let a consumer guess
correctly. This document covers casing, word choice, and structure for every named
thing in an API: path segments, query parameters, JSON properties, headers, and
enum values.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Casing

### `naming-json-camelcase`

**MUST** name JSON object properties in `camelCase`: a lowercase first letter, no
separators, subsequent words capitalized (`createdAt`, `phoneNumber`,
`totalItemCount`). This is the dominant convention in JSON APIs and what
SDK generators expect. An API **MUST NOT** mix casing styles across properties.

### `naming-url-kebabcase`

**MUST** use `kebab-case` for multi-word URL **path** segments that the API defines
(`/payment-methods`, `/access-reviews`). Path segments are case-sensitive
(see [URLs](03-urls-and-resources.md)) and lowercase kebab-case avoids
case-related mistakes and reads well in URLs. Resource-identifier segments supplied
by the client are exempt — they carry whatever value the resource uses.

### `naming-query-camelcase`

**MUST** name query parameters in `camelCase` (`pageSize`, `orderBy`,
`includeDeleted`). A small set of standard parameters defined by this standard are
lowercase single words by convention (`filter`, `fields`, `sort`, `cursor`); see
[Collections](08-collections.md). Match those exactly.

### `naming-header-conventional`

**MUST** name HTTP headers in `Hyphenated-Pascal-Case` (`X-Request-Id`,
`Idempotency-Key`). HTTP header field names are case-insensitive per
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#name-field-names), but using the
conventional capitalization keeps logs and tooling readable. **SHOULD NOT** use the
`X-` prefix for new headers ([RFC 6648](https://www.rfc-editor.org/rfc/rfc6648)
deprecates it); use it only to match an established de-facto header.

### `naming-enum-values`

**MUST** use a single, documented casing for enumeration string values across the
entire API. `camelCase` is **RECOMMENDED** for consistency with property names.
Whatever is chosen, it **MUST NOT** vary between enums.

## Word choice

### `naming-collections-plural`

**MUST** name resource collections with a plural noun (`/orders`, `/users`,
`/invoices`). A collection holds many resources; its name should say so. The
single-resource URL is the collection name plus an identifier (`/orders/{orderId}`).

### `naming-no-verbs-in-paths`

**MUST NOT** put verbs in resource path segments (`/getUser`, `/createOrder`,
`/users/{id}/delete`). The HTTP method is the verb. The rare, genuinely
non-CRUD operation is modeled as documented in
[URLs and resources](03-urls-and-resources.md#actions), not as an ad-hoc verb path.

### `naming-consistent-vocabulary`

**MUST** use one term for one concept throughout the API. Do not call the same
thing `customer` in one place and `client` in another, or `delete` here and
`remove` there. **SHOULD** maintain a short glossary of the domain's canonical
terms and reuse them.

### `naming-abbreviations`

**SHOULD NOT** abbreviate names unless the abbreviation is more widely recognized
than the full word (`id`, `url`, `html`, `iso`). Spell out everything else
(`description` not `desc`, `organization` not `org`). Saved keystrokes are not worth
the ambiguity.

### `naming-acronyms`

**MUST** treat acronyms as words for casing purposes and apply the casing rule
uniformly: in `camelCase`, write `userId`, `ipAddress`, `httpStatus`,
`importUrl` — not `userID`, `IPAddress`, or `importURL`. This keeps automatic
case conversion (to snake_case, PascalCase, etc.) lossless.

### `naming-booleans`

**SHOULD** name boolean properties as a positive assertion with an `is`, `has`,
`can`, or `allows` prefix where it improves readability (`isActive`, `hasChildren`,
`allowsComments`). **SHOULD NOT** name booleans negatively (`isNotActive`,
`disabled` meaning the opposite of what a reader expects); negative booleans force
double-negative reasoning.

### `naming-dates`

**SHOULD** suffix timestamp properties with `At` (`createdAt`, `expiresAt`) and
date-only properties with `On` or `Date` (`bornOn`, `invoiceDate`). The suffix tells
the consumer the value is temporal and hints at its granularity. Timestamp values
themselves follow [Data types](06-data-types.md#date-and-time).

### `naming-counts-and-collections`

**SHOULD** name a property holding a count with a `Count` suffix (`itemCount`) and
a property holding a list with a plural noun (`items`, `tags`). A property named
`item` should be a single item; a property named `items` should be an array.

## Reserved and special names

### `naming-reserved-properties`

**MUST NOT** repurpose property names that this standard reserves for a defined
meaning. In particular: `error` (see [Errors](07-errors.md)), the pagination
envelope fields defined in [Collections](08-collections.md), and `type` when used
as a polymorphic discriminator (see
[Data types](06-data-types.md#polymorphism)). If your domain needs one of these
words for a different purpose, qualify it (`errorBudget`, `mediaType`).

### `naming-no-leading-special-characters`

**MUST NOT** begin property names with characters that complicate access in common
languages or tooling — no leading `$`, `@`, `_`, or digits, and no embedded spaces
or dots. Stick to letters for the first character and alphanumerics thereafter.

## Common mistakes

- Mixing `snake_case` and `camelCase` JSON properties in the same API.
- Pluralizing inconsistently (`/people` here, `/persons` there); pick one and record it.
- Encoding type information in names (`amountStr`, `dateInt`) instead of using the
  right [data type](06-data-types.md).
- Naming a field for its current implementation (`mysqlId`, `v2Token`) rather than
  its meaning.
