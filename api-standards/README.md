# Universal Enterprise REST API Standard

A vendor-neutral standard for designing RESTful HTTP APIs that are consistent,
predictable, and pleasant to consume — regardless of the organization, language,
or platform that builds them.

This standard is intended to be adopted as-is, forked, or used as a baseline that
an organization extends. It deliberately contains **no** company-, cloud-, or
product-specific guidance. Every rule is grounded in published web standards
(HTTP, URI, JSON, and related RFCs) and in widely-accepted REST practice.

## Why a standard

When every team invents its own URL shapes, error formats, pagination scheme, and
versioning policy, consumers pay the cost: every API must be learned from scratch,
SDKs are hard to generate, and tooling cannot be shared. A shared standard turns
"learn this API" into "apply what you already know." The goals are:

- **Least surprise** — an API that follows this standard behaves the way an
  experienced developer expects without reading the docs.
- **Consistency** — the same concept looks the same in every API and every endpoint.
- **Evolvability** — APIs can grow for years without breaking the clients that depend on them.
- **Toolability** — APIs are describable in OpenAPI, lintable, and SDK-generatable.
- **Interoperability** — APIs rely on standard HTTP semantics so that proxies,
  caches, and clients behave correctly without special cases.

## How this standard is organized

There are two tiers.

### `guidelines/` — normative rules you conform to

These are mid-size topic documents. To claim conformance with this standard, an API
**MUST** satisfy the `MUST`-level rules in every applicable guideline.

| # | Document | Covers |
|---|----------|--------|
| 01 | [Design principles](guidelines/01-design-principles.md) | Foundational values: API-first, resource orientation, consistency, least surprise |
| 02 | [Naming](guidelines/02-naming.md) | Casing, vocabulary, pluralization, reserved terms |
| 03 | [URLs and resources](guidelines/03-urls-and-resources.md) | URL structure, resource modeling, hierarchy, actions |
| 04 | [HTTP methods and status codes](guidelines/04-http-methods-and-status.md) | Method semantics, idempotency, safe methods, status code usage |
| 05 | [Requests and responses](guidelines/05-requests-and-responses.md) | Headers, content negotiation, JSON body conventions |
| 06 | [Data types](guidelines/06-data-types.md) | Strings, numbers, dates, durations, enums, null, money, identifiers |
| 07 | [Errors](guidelines/07-errors.md) | Problem Details (RFC 9457), error structure, machine-readable codes |
| 08 | [Collections](guidelines/08-collections.md) | Pagination, filtering, sorting, sparse fieldsets |
| 09 | [Versioning and compatibility](guidelines/09-versioning-and-compatibility.md) | Versioning strategy, breaking-change taxonomy, deprecation |
| 10 | [Security](guidelines/10-security.md) | TLS, authentication, OAuth 2.0 / OIDC, scopes, authorization, secrets |
| 11 | [Rate limiting](guidelines/11-rate-limiting.md) | Quotas, throttling, `429`, `Retry-After`, rate-limit headers |
| 12 | [Governance](guidelines/12-governance.md) | OpenAPI-first workflow, linting, review, lifecycle |

### `patterns/` — optional recipes you adopt when they apply

The [pattern catalog](patterns/README.md) collects reusable solutions to recurring
design problems. Patterns are **not** mandatory; adopt one when your situation
matches its "When to use" criteria. When you do adopt a pattern, implement it as
written so that consumers recognize it.

- [Long-running operations](patterns/long-running-operations.md)
- [Conditional requests](patterns/conditional-requests.md)
- [Idempotency keys](patterns/idempotency.md)
- [Batch and bulk operations](patterns/batch-and-bulk.md)
- [Webhooks](patterns/webhooks.md)

## Requirement levels (RFC 2119 / RFC 8174)

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**,
**SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this
standard are to be interpreted as described in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and
[RFC 8174](https://www.rfc-editor.org/rfc/rfc8174) — that is, the keywords carry
their normative meaning only when in **UPPERCASE**.

Rules are written as a keyword-led statement followed by rationale and, where
helpful, an example. Each normative rule has a stable identifier (for example
`url-casing`) so that linters, reviews, and exception requests can reference it
precisely.

## Conformance

An API is **conformant** with this standard at one of two levels:

- **Conformant** — the API satisfies every applicable `MUST`/`MUST NOT` rule.
- **Fully conformant** — the API additionally satisfies every applicable
  `SHOULD`/`SHOULD NOT` rule, or documents a deliberate, reviewed exception for
  each one it does not.

Conformance is per-API and assessed against the API's public contract (its
URLs, payloads, headers, and status codes), not its implementation.

Existing APIs that predate adoption **SHOULD NOT** introduce breaking changes
solely to become conformant. Apply this standard to new APIs and new versions,
and prioritize consistency *within* an existing API over retrofitting it.

## Using this standard in your organization

1. Adopt this repository as a baseline (vendored, submoduled, or forked).
2. Add an organization-specific overlay document for the few decisions this
   standard intentionally leaves open (for example, your chosen authorization
   server, your domain vocabulary, or your hostname conventions). Keep overlays
   additive; do not contradict `MUST`-level rules.
3. Enforce the rules automatically wherever possible — see
   [Governance](guidelines/12-governance.md).

## Tooling

A starter [Spectral](https://docs.stoplight.io/docs/spectral) ruleset in
[`tooling/`](tooling/README.md) lints OpenAPI descriptions against the
machine-checkable subset of this standard, with each lint rule mapped to the
guideline rule identifier it enforces. It is the floor, not the ceiling: the
[tooling README](tooling/README.md) documents exactly what the linter does and does
not cover, and what to pair it with (contract tests and a breaking-change detector).

## Contributing

This is a living standard. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose
new rules and patterns, how rule identifiers work, and how changes are tiered.

## License

This work is licensed under the
[Creative Commons Attribution 4.0 International License](LICENSE) (CC BY 4.0).
You may share and adapt it for any purpose, including commercially, provided you
give appropriate credit.
