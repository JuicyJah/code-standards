# Tooling

Automated enforcement is how a standard stays real
([`governance-lint`](../guidelines/12-governance.md#governance-lint)). This directory
holds a starter [Spectral](https://docs.stoplight.io/docs/spectral) ruleset that
checks the machine-checkable subset of the standard against an OpenAPI description.

## Quick start

Install Spectral and lint an OpenAPI document:

```bash
# one-off
npx @stoplight/spectral-cli lint openapi.yaml \
  --ruleset api-standards/tooling/spectral-ruleset.yaml

# or install globally
npm install -g @stoplight/spectral-cli
spectral lint openapi.yaml --ruleset api-standards/tooling/spectral-ruleset.yaml
```

Each finding names the guideline rule identifier it enforces (for example
`url-no-trailing-slash`), so you can jump straight from a lint failure to the
relevant guidance.

### Extending it in your own repo

Create a project-level `.spectral.yaml` that extends this ruleset and layers on your
organization-specific overlay rules:

```yaml
extends:
  - ./api-standards/tooling/spectral-ruleset.yaml
rules:
  # your house rules here, e.g. require a specific server hostname pattern
  my-org-host:
    given: "$.servers[*].url"
    then:
      function: pattern
      functionOptions:
        match: "^https://api\\.my-org\\.com/"
    severity: error
```

### In CI

Fail the build on any error-severity finding
([`governance-lint`](../guidelines/12-governance.md#governance-lint)):

```bash
spectral lint openapi.yaml \
  --ruleset api-standards/tooling/spectral-ruleset.yaml \
  --fail-severity=error
```

## What this ruleset covers

| Lint rule | Guideline rule | Severity |
|-----------|----------------|----------|
| `uas-url-no-trailing-slash` | `url-no-trailing-slash` | error |
| `uas-url-lowercase-kebab` | `naming-url-kebabcase` / `url-lowercase-path` | error |
| `uas-no-verbs-in-paths` | `naming-no-verbs-in-paths` | warn |
| `uas-property-names-camelcase` | `naming-json-camelcase` | error |
| `uas-query-param-camelcase` | `naming-query-camelcase` | error |
| `uas-created-has-location` | `status-201-location` | error |
| `uas-no-success-with-error-shape` | `status-correct-class` | error |
| `uas-errors-use-problem-details` | `error-problem-details` | warn |
| `uas-json-charset-utf8` | `payload-utf8` | warn |
| `uas-info-has-version` | `version-explicit` | error |
| `uas-429-has-retry-after` | `ratelimit-retry-after` | warn |
| `uas-https-servers-only` | `security-tls-only` | error |
| `uas-security-defined` | `security-authn-required` | warn |
| `uas-operation-has-description` | `governance-examples` | warn |

Structural correctness of the OpenAPI document itself (valid references, required
fields, unique `operationId`s, and so on) is inherited from the built-in
`spectral:oas` ruleset this one extends.

## What this ruleset does NOT cover

This is deliberately surfaced rather than left implicit
(see [`governance-review-judgment`](../guidelines/12-governance.md#governance-review-judgment)).
A green lint run does **not** mean an API is conformant — it means the cheaply
automatable rules pass. The following still require human review or other tooling:

- **Modeling and naming quality** — whether resources are the right resources, whether
  collections are sensibly pluralized, whether one term is used per concept
  (`naming-consistent-vocabulary`). A linter cannot judge whether `/widgets` is the
  right noun.
- **Semantic correctness of types** — that timestamps are genuinely RFC 3339, money
  is an amount+currency object, IDs are opaque strings, enums are documented as
  open/closed (`type-*`). Format *hints* can be linted; correct *use* cannot.
- **Behavioral rules** — idempotency, full-replace `PUT` vs partial `PATCH`,
  conditional-request handling, pagination determinism, object-level authorization
  (`security-object-level-authz`). These are properties of the running service, best
  caught by **contract tests** (`governance-contract-tests`), not description linting.
- **Compatibility** — whether a change is breaking
  (`compat-breaking-taxonomy`). Use an OpenAPI **diff / breaking-change detector** in
  CI (`governance-breaking-change-detection`) against the previously released
  description; that is a separate tool from this linter.
- **Choice-of-convention rules** — where the standard says "pick one and be
  consistent" (e.g. `400` vs `422`, per-field vs expression `filter`, cursor vs
  offset pagination). A linter can enforce *a* choice once your organization has made
  it (add an overlay rule); it cannot make the choice for you.

Treat this ruleset as the floor, not the ceiling. Add overlay rules for your
organization's settled conventions, pair it with contract tests and a breaking-change
detector, and keep human review for what only judgement can assess.

## Compatibility note

The ruleset targets Spectral v6+ and OpenAPI 3.x. Some rules use JSONPath property
filters (e.g. `@property.match(...)`); if you run an older Spectral, upgrade rather
than rewriting the rules.
