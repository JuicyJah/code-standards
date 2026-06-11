# 09 — Versioning and Compatibility

The promise an API makes is: *code written against it keeps working.* Versioning and
a clear compatibility contract are how that promise is kept while the API still
grows. This document defines what counts as a breaking change, how to version, and
how to deprecate.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## The compatibility contract

### `compat-no-silent-break`

**MUST NOT** make a change that breaks existing clients within a published version.
Every URL, status code, header, request field, and response field that has been
published is a promise. Changing what a promise means — without a new version — is a
defect, not an improvement.

### `compat-breaking-taxonomy`

**MUST** treat the following as **breaking** changes (they require a new version):

- Removing or renaming an endpoint, field, parameter, header, or enum value.
- Changing the type, format, units, or meaning of an existing field or parameter.
- Adding a new **required** request field or parameter, or a new required
  authentication/authorization requirement.
- Making validation **stricter** on existing inputs (rejecting what was accepted).
- Removing or changing the meaning of a status code or error code for a given
  condition.
- Changing default values, default sort, or default page size in a way that alters
  existing responses.
- Adding a value to a **closed** enum (see
  [`type-extensible-enums`](06-data-types.md#type-extensible-enums)).

### `compat-nonbreaking-taxonomy`

**MUST** treat the following as **non-breaking** changes (they are allowed within a
version, provided clients were built to the compatibility expectations below):

- Adding a new endpoint, or a new optional request parameter/field with a safe
  default.
- Adding a new field to a response representation.
- Adding a value to an **extensible** enum.
- Adding a new error `code` (with an existing or new appropriate status class).
- Relaxing validation to accept previously-rejected input.
- Adding new optional response headers.

### `compat-client-robustness`

**MUST** document, and **SHOULD** design SDKs to enforce, the robustness rules
clients must follow so that non-breaking changes stay non-breaking. Clients:

- **MUST** ignore unknown response fields rather than failing.
- **MUST** tolerate new values of [extensible enums](06-data-types.md#type-extensible-enums)
  and new error codes.
- **MUST NOT** depend on the order of properties in a JSON object.
- **MUST NOT** depend on undocumented behavior, response timing, or the exact
  wording of human-readable messages.

An API author and an SDK both uphold compatibility; this rule defines the client
half of the contract.

## Versioning strategy

### `version-explicit`

**MUST** version the API explicitly. **MUST NOT** ship an unversioned public API; an
API with no version has no way to evolve through a breaking change without breaking
everyone.

### `version-strategy-choice`

**MUST** choose one versioning mechanism and apply it consistently across the whole
API. Two mechanisms are acceptable under this standard:

- **URL path versioning** (**RECOMMENDED** for its visibility and cache-friendliness):
  a major-version segment in the base path — `https://api.example.com/v1/orders`.
- **Header / media-type versioning**: the client selects a version via a request
  header (a custom version header, or a versioned media type in `Accept`). Keeps
  URLs stable but is less visible and harder to test by hand.

**MUST NOT** mix both schemes in one API.

### `version-major-only`

**SHOULD** expose only **major** versions in the version identifier (`v1`, `v2`).
Minor and patch evolution happens through non-breaking changes within a major
version (`compat-nonbreaking-taxonomy`); it does not get its own visible version.
This keeps the number of live versions small.

### `version-semantic-meaning`

**MUST** make a new major version mean "breaking changes are present." A major
version bump is the *only* place breaking changes are permitted, and they **MUST**
be documented in a migration guide.

### `version-minimize-live-versions`

**SHOULD** keep the number of simultaneously supported major versions small (two or
three). Every live version multiplies maintenance, testing, and security surface.
Pair new versions with a deprecation timeline for old ones.

### `version-default-behavior`

**MUST** define and document what happens when a client does not specify a version
(if the mechanism allows omission). **RECOMMENDED**: require the version explicitly
and reject requests that omit it with a clear `400`, rather than silently defaulting
to a version that may change under the client.

## Deprecation and sunset

### `deprecation-announce`

**MUST** announce a deprecation before removing anything, through documentation and
**SHOULD** through machine-readable signaling on affected responses. This standard
**RECOMMENDS** the [`Deprecation`](https://www.rfc-editor.org/rfc/rfc9745) and
[`Sunset`](https://www.rfc-editor.org/rfc/rfc8594) HTTP response headers to indicate
that a resource is deprecated and the date after which it may stop working, with a
`Link` to the migration guide.

### `deprecation-window`

**MUST** provide a reasonable, documented migration window between announcing a
deprecation and removing the capability — long enough for consumers to migrate.
**MUST NOT** remove a widely-used capability without a window, even between major
versions.

### `deprecation-monitor`

**SHOULD** track usage of deprecated capabilities so the removal decision is based on
real consumption, and **SHOULD** proactively notify identifiable active consumers
before removal.

### `deprecation-gone`

**SHOULD** respond `410 Gone` (not `404`) for an endpoint that was intentionally
removed after deprecation, so consumers can distinguish "removed" from "never
existed" and "typo." **MAY** keep returning a Problem Details body pointing to the
replacement.

## Previews

### `version-preview-marking`

**MAY** ship preview/beta capabilities to gather feedback, but **MUST** mark them
clearly as unstable (distinct version label such as a date-stamped or `-preview`
identifier) and **MUST** document that preview features may change or be removed
without the compatibility guarantees above. **MUST NOT** let preview features leak
into a stable version's contract without review.

## Common mistakes

- Shipping a public API with no version, then needing a breaking change.
- Calling a breaking change "minor" and pushing it to existing clients.
- Treating "add a field" as breaking (it is not) and over-versioning.
- Treating "add a required parameter" as non-breaking (it is breaking).
- Removing a deprecated endpoint with no migration window or `Sunset` signal.
