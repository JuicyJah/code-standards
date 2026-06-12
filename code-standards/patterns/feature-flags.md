# Feature flags
<a id="SDLC-CODE-P-0002"></a>**`SDLC-CODE-P-0002`**

## Problem

Merging frequently ([trunk-based development](trunk-based-development.md)) means
integrating work that isn't ready to show users. And even finished features carry
release risk: a bad rollout to everyone at once is hard to undo when the only lever is a
redeploy. Teams need a way to **decouple deploying code from releasing behavior**.

## When to use

Adopt feature flags to: merge incomplete work safely on trunk, roll a change out
gradually (a percentage of users, internal-only first), run an experiment, or get a
fast kill switch for a risky path.

Do **not** flag everything. Each flag is a runtime branch that must be tested,
understood, and eventually removed. Trivial changes, or changes that are safe to ship
directly, do not need a flag. A codebase drowning in stale flags is worse off than one
with none.

## Solution

- A flag **SHOULD** gate the new behavior at a single, well-defined decision point, with
  the *old* behavior as the default until the new path is proven.
- Both sides of a flag **MUST** be covered by tests
  ([`test-with-change`](../guidelines/05-testing.md#test-with-change)) — a flag creates
  two code paths, and the off path must keep working.
- A flag's purpose and intended lifetime **SHOULD** be recorded
  ([`governance-tech-debt`](../guidelines/11-governance.md#governance-tech-debt)).
  Short-lived release flags exist to be removed; treat a lingering flag as tracked debt.
<!-- param: flag_max_lifetime_days | 90 | Maximum release flag lifetime (days) | This organization expects short-lived release flags to be removed within {value} days of creation. -->
<!-- param: stale_flag_review_sla_days | 30 | Stale flag review SLA (days) | This organization reviews any flag still present after {value} days as tracked technical debt. -->
- Flags **MUST NOT** be used to store secrets or enforce security boundaries; a flag is
  a behavior switch, not an authorization mechanism
  ([`security-authorize-every-access`](../guidelines/09-security.md#security-authorize-every-access)).
- Once a feature is fully rolled out (or abandoned), the flag and its dead branch
  **SHOULD** be removed promptly ([`style-no-dead-code`](../guidelines/02-code-style.md#style-no-dead-code)).
<!-- param: flag_cleanup_sla_days | 14 | Fully-rolled-out flag cleanup SLA (days) | This organization removes a fully rolled-out or abandoned flag and its dead branch within {value} days. -->

## Example

```
# Merge the new pricing engine on trunk, dark, behind a flag:
if flags.enabled("new-pricing-engine", user):
    price = new_pricing.quote(cart)
else:
    price = legacy_pricing.quote(cart)   # default until proven
```

Rollout: enable for internal users → 1% → 10% → 100%, watching error and latency
metrics ([`observability-metrics`](../guidelines/08-logging-and-observability.md#observability-metrics))
at each step, with the flag as an instant rollback if something regresses. Once stable
at 100%, delete the flag and the `legacy_pricing` branch.

## Consequences

- Deploy and release are decoupled: code ships continuously, behavior is turned on
  deliberately and reversibly.
- Gradual rollout and instant rollback dramatically lower release risk.
- Each flag doubles the paths through a section of code; without discipline, flags
  accumulate, multiply test combinations, and rot into confusing dead branches.
- Flag state is configuration that must itself be managed, audited, and kept out of the
  realm of security decisions.

## Related

- [Trunk-based development](trunk-based-development.md)
- [`test-with-change`](../guidelines/05-testing.md#test-with-change)
- [`error-retry-safely`](../guidelines/07-error-handling.md#error-retry-safely)
- [`governance-tech-debt`](../guidelines/11-governance.md#governance-tech-debt)
