# 06 — Data Types

Consistent representation of values is what makes payloads predictable across an API
and across APIs. This document defines how to represent common kinds of data in JSON.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Primitives

### `type-use-json-types`
<a id="SDLC-API-0076"></a>**`SDLC-API-0076`**

**MUST** use JSON's native types for their natural values: `string`, `number`,
`boolean`, `object`, `array`, and `null`. **MUST NOT** encode a boolean as the
string `"true"`, or a number as a string, *except* where a rule below requires a
string for precision or format reasons.

### `type-no-magic-values`
<a id="SDLC-API-0077"></a>**`SDLC-API-0077`**

**MUST NOT** use sentinel values to mean "absent" (e.g. `-1`, `0`, `""`, or
`"9999-12-31"` standing in for "unknown" or "never"). Use `null` or omit the
property (see [Requests and responses](05-requests-and-responses.md#payload-omit-vs-null)).

## Numbers

### `type-number-precision`
<a id="SDLC-API-0078"></a>**`SDLC-API-0078`**

**MUST** represent values that require exact precision or exceed the safe range of an
IEEE-754 double (integers beyond ±2^53, high-precision decimals) as **strings**, not
JSON numbers. JSON numbers are commonly parsed as doubles and silently lose
precision. This applies to large identifiers, monetary amounts, and arbitrary-
precision decimals.

### `type-integers`
<a id="SDLC-API-0079"></a>**`SDLC-API-0079`**

**MUST** document the range of integer fields and **SHOULD** keep them within signed
64-bit range. Identifiers that may exceed 2^53 **MUST** be represented as strings
(see `type-identifiers`).

<!-- param: integer_default_max | 9223372036854775807 | Default maximum value for integer fields | This organization documents a default upper bound of {value} for integer fields unless a narrower range is specified. -->
<!-- param: integer_default_min | 0 | Default minimum value for integer fields | This organization treats {value} as the default lower bound for integer fields unless a field documents otherwise. -->

### `type-money`
<a id="SDLC-API-0080"></a>**`SDLC-API-0080`**

**MUST** represent monetary amounts as an object carrying both an exact amount and a
currency, never as a bare floating-point number:

```json
{ "amount": "19.99", "currency": "USD" }
```

The `amount` is a decimal **string** to preserve precision; `currency` is an
[ISO 4217](https://www.iso.org/iso-4217-currency-codes.html) code. **MUST NOT**
represent money as a float, and **MUST NOT** mix minor-unit integers and decimal
strings within one API without documenting exactly one convention.

## Strings and text

### `type-string-length`
<a id="SDLC-API-0081"></a>**`SDLC-API-0081`**

**SHOULD** document a maximum length for every string field and **MUST** enforce a
sane upper bound on accepted input to protect the service. Reject overlong input
with `400`/`422` (see [Errors](07-errors.md)).

<!-- param: string_default_max_length | 255 | Default maximum string field length (characters) | This organization caps string fields at {value} characters by default unless a field documents otherwise. -->
<!-- param: string_freetext_max_length | 4000 | Maximum free-text field length (characters) | This organization rejects free-text input longer than {value} characters. -->

### `type-enums`
<a id="SDLC-API-0082"></a>**`SDLC-API-0082`**

**MUST** define enumerations as a fixed set of documented string values (not magic
numbers). Enum values follow the casing rule in
[Naming](02-naming.md#naming-enum-values).

### `type-extensible-enums`
<a id="SDLC-API-0083"></a>**`SDLC-API-0083`**

**SHOULD** treat most enums as **extensible**: document that new values may be added
over time and require clients to handle unknown values gracefully (typically by
falling back to a default behavior) rather than failing. Adding a value to an
extensible enum is a [non-breaking change](09-versioning-and-compatibility.md);
adding a value to a closed enum is breaking. **MUST** state in the contract whether
each enum is closed or extensible.

## Date and time

### `type-datetime-rfc3339`
<a id="SDLC-API-0084"></a>**`SDLC-API-0084`**

**MUST** represent timestamps as strings in
[RFC 3339](https://www.rfc-editor.org/rfc/rfc3339) / ISO 8601 format, in UTC, with an
explicit offset:

```json
"createdAt": "2026-06-11T14:30:00Z"
```

**MUST NOT** use locale-dependent formats, Unix epoch integers, or timestamps
without an offset. **SHOULD** use `Z` (UTC) for stored/returned timestamps and
preserve a meaningful offset only when the local offset is itself significant.

### `type-date-only`
<a id="SDLC-API-0085"></a>**`SDLC-API-0085`**

**MUST** represent date-only values (with no time component) as `YYYY-MM-DD` and
document them as date-only so consumers do not assume a time or zone.

### `type-duration`
<a id="SDLC-API-0086"></a>**`SDLC-API-0086`**

**MUST** represent durations using the ISO 8601 duration format (`P30D`, `PT2H30M`)
or an explicit numeric value paired with a documented unit field. **MUST NOT** use a
bare number whose unit is implied.

### `type-http-date-headers`
<a id="SDLC-API-0087"></a>**`SDLC-API-0087`**

**MUST** format dates carried in HTTP **headers** (such as `Last-Modified`,
`Retry-After` when given as a date) using the IMF-fixdate format required by
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110#name-date-time-formats), not
RFC 3339. Header dates and body dates use different formats by HTTP rule.

## Identifiers

### `type-identifiers`
<a id="SDLC-API-0088"></a>**`SDLC-API-0088`**

**MUST** treat resource identifiers as **opaque strings** in payloads and URLs, even
when they are numeric internally. Representing IDs as strings avoids precision loss
and lets the identifier scheme change (numeric to UUID, for example) without a
breaking type change. Consumers **MUST NOT** be required to parse structure out of
an ID.

### `type-id-no-leak`
<a id="SDLC-API-0089"></a>**`SDLC-API-0089`**

**SHOULD NOT** use sequential integer surrogate keys as public identifiers where
they would leak business-sensitive information (record counts, growth rate,
creation order) or enable enumeration. Prefer UUIDs, ULIDs, or other
non-guessable identifiers for resources exposed to untrusted callers.

### `type-id-name-vs-id`
<a id="SDLC-API-0090"></a>**`SDLC-API-0090`**

**SHOULD** distinguish a stable, immutable `id` (identity that never changes) from a
human-meaningful, possibly mutable `name` or `slug`. Do not overload one field to
serve both roles.

## Other common types

### `type-enumerated-standards`
<a id="SDLC-API-0091"></a>**`SDLC-API-0091`**

**SHOULD** reuse established code lists rather than inventing your own: ISO 4217 for
currency, ISO 3166 for countries, ISO 639 for languages, BCP 47 for locales, E.164
for phone numbers, and RFC 5321 syntax for email addresses. Reuse makes values
interoperable and validatable.

### `type-binary-data`
<a id="SDLC-API-0092"></a>**`SDLC-API-0092`**

**SHOULD** serve binary data (images, files) as its own resource with the correct
`Content-Type`, referenced by URL, rather than base64-encoding it inside JSON.
Inline base64 inflates payloads and defeats streaming and caching. Small binary
fields **MAY** be base64-encoded strings when a separate resource is impractical;
mark them clearly.

### `type-collections-arrays`
<a id="SDLC-API-0093"></a>**`SDLC-API-0093`**

**MUST** represent an ordered or unordered list as a JSON array of homogeneous
items. **MUST NOT** represent a list as an object keyed by index or id when order or
iteration matters; use an array, and use the
[collections](08-collections.md) conventions for large lists.

## Polymorphism

### `type-discriminator`
<a id="SDLC-API-0094"></a>**`SDLC-API-0094`**

**SHOULD**, when a field or resource may take one of several shapes, include an
explicit **discriminator** property (conventionally named `type`) whose value names
the variant. The discriminator **MUST** be a documented, extensible enum and
**MUST** appear on every variant. Consumers select parsing behavior from the
discriminator rather than guessing from which fields are present.

### `type-discriminator-stable`
<a id="SDLC-API-0095"></a>**`SDLC-API-0095`**

**MUST NOT** change a value's discriminator meaning over time, and **MUST** treat
adding a new variant as you would extending an enum: clients must tolerate unknown
discriminator values.

## Common mistakes

- Monetary amounts as floats (`19.99` that becomes `19.989999...`).
- Epoch-second integers or zone-less timestamps in bodies.
- Numeric IDs as JSON numbers, losing precision past 2^53.
- Sentinels like `-1` or `""` instead of `null`/omission.
- Closed enums that break clients every time a value is added.
