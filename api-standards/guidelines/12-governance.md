# 12 — Governance

A standard only delivers consistency if it is actually applied. Governance is how an
organization turns these guidelines from a document into a property of every API it
ships — mostly through automation, with human review reserved for judgment.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Description-first

### `governance-description-first`
<a id="SDLC-API-0168"></a>**`SDLC-API-0168`**

**SHOULD** design and review the API as a machine-readable description **before**
building it (see
[`principle-design-before-build`](01-design-principles.md#principle-design-before-build)).
Reviewing a description catches naming, consistency, and modeling problems while they
are still cheap to change.

### `governance-openapi`
<a id="SDLC-API-0169"></a>**`SDLC-API-0169`**

**MUST** publish a complete, accurate
[OpenAPI](https://spec.openapis.org/) description of the API (3.x or later
**RECOMMENDED**). The description **MUST** be the authority that documentation, SDKs,
mock servers, and contract tests are generated from — not an afterthought written by
hand and left to drift.

### `governance-description-accurate`
<a id="SDLC-API-0170"></a>**`SDLC-API-0170`**

**MUST** keep the published description in sync with the deployed API. **SHOULD**
generate the description from the implementation, or verify the implementation
against the description in CI, so the two cannot diverge. A description that lies is
worse than none.

### `governance-examples`
<a id="SDLC-API-0171"></a>**`SDLC-API-0171`**

**SHOULD** include realistic request and response examples in the description for
every operation, including error responses. Examples are what consumers actually read
and what mock servers and tests use.

## Automated enforcement

### `governance-lint`
<a id="SDLC-API-0172"></a>**`SDLC-API-0172`**

**MUST** lint every API description in continuous integration against a ruleset that
encodes the `MUST`-level rules of this standard, and **MUST** fail the build on
violations. Machines enforce consistency far more reliably and cheaply than
reviewers. Each lint rule **SHOULD** reference the guideline rule identifier (for
example `url-casing`) it enforces. A starter ruleset that does exactly this —
mapping lint rules to guideline identifiers — ships with this standard; see
[tooling](../tooling/README.md).

### `governance-contract-tests`
<a id="SDLC-API-0173"></a>**`SDLC-API-0173`**

**SHOULD** run contract tests that verify the running API conforms to its published
description — status codes, schemas, headers — so that drift and accidental breaking
changes are caught before release.

### `governance-breaking-change-detection`
<a id="SDLC-API-0174"></a>**`SDLC-API-0174`**

**SHOULD** automatically diff each API description against the previously released
version and flag [breaking changes](09-versioning-and-compatibility.md#compat-breaking-taxonomy)
in CI, blocking a breaking change unless it accompanies a new major version. This is
the most reliable guard against the single worst API failure: silently breaking
consumers.

## Human review

### `governance-review-judgment`
<a id="SDLC-API-0175"></a>**`SDLC-API-0175`**

**SHOULD** reserve human API review for what automation cannot judge: resource
modeling, naming quality, fitness for real use cases, and consistency with the rest
of the organization's APIs. **SHOULD NOT** spend human review on rules a linter
already enforces.

### `governance-exceptions`
<a id="SDLC-API-0176"></a>**`SDLC-API-0176`**

**MUST** record any deliberate deviation from a `MUST`/`SHOULD` rule as an explicit,
reviewed exception that names the rule, the reason, and (for temporary deviations)
the plan to resolve it. An undocumented deviation is a defect; a documented,
justified one is a decision. Conformance claims (see
[README](../README.md#conformance)) account for these exceptions.
<!-- param: exception_review_sla_days | 5 | Exception review turnaround (business days) | This organization reviews and decides on a requested rule exception within {value} business days of submission. -->
<!-- param: temporary_exception_max_days | 90 | Temporary exception maximum lifetime (days) | This organization requires every temporary exception to carry a resolution plan completing within {value} days. -->

### `governance-evolve-standard`
<a id="SDLC-API-0177"></a>**`SDLC-API-0177`**

**SHOULD** treat this standard as a living document: when a real, recurring need is
not served by an existing rule — or a rule proves wrong in practice — change the
standard through review rather than quietly ignoring it. A standard that cannot
evolve gets worked around until it is irrelevant.

## Documentation and discovery

### `governance-docs-generated`
<a id="SDLC-API-0178"></a>**`SDLC-API-0178`**

**SHOULD** generate human-facing reference documentation from the OpenAPI description
so docs cannot drift from the contract. **SHOULD** supplement generated reference
with hand-written guides for authentication, pagination, errors, versioning, and the
API's hero scenarios.

### `governance-changelog`
<a id="SDLC-API-0179"></a>**`SDLC-API-0179`**

**MUST** maintain a public, dated changelog of API changes, distinguishing
non-breaking additions, deprecations, and (major-version) breaking changes. Consumers
plan their work against it.
<!-- param: changelog_retention_months | 24 | Public changelog history retention (months) | This organization keeps published changelog entries publicly available for at least {value} months. -->
<!-- param: changelog_publish_lead_days | 7 | Changelog publication lead time before release (days) | This organization publishes changelog entries for upcoming changes at least {value} days before the change ships. -->


### `governance-discoverable`
<a id="SDLC-API-0180"></a>**`SDLC-API-0180`**

**SHOULD** make APIs and their descriptions discoverable through a central catalog so
that teams find and reuse existing APIs instead of duplicating them, and so that
naming and modeling can be kept consistent across the organization.

## Common mistakes

- A hand-maintained OpenAPI file that silently drifts from the real API.
- Relying on human reviewers to catch casing/format issues a linter could enforce.
- No automated breaking-change detection, so a breaking change ships unnoticed.
- Undocumented one-off deviations that accumulate into de-facto inconsistency.
- No changelog, leaving consumers to discover changes by breakage.
