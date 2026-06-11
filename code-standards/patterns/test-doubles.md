# Test doubles

## Problem

[`test-isolated`](../guidelines/05-testing.md#test-isolated) and
[`test-deterministic`](../guidelines/05-testing.md#test-deterministic) require tests that
don't depend on slow, flaky, or external collaborators — a real database, a payment
gateway, the wall clock, a random source. A test double stands in for such a
collaborator so the unit under test can be exercised in isolation, fast and
repeatably. The trap is using the wrong kind of double, or using one where the real
thing would test more.

## When to use

Use a double when a real dependency is slow, non-deterministic, has side effects you
don't want in a test (charging a card, sending email), or isn't available in the test
environment.

Do **not** reach for a double reflexively. If the real collaborator is fast and pure
(a value object, a small pure function), use the real thing — it tests more and is more
robust to refactoring ([`test-behavior-not-implementation`](../guidelines/05-testing.md#test-behavior-not-implementation)).
Over-mocking produces tests that assert how the code is wired internally and break on
every harmless change.

## Solution

Pick the lightest double that does the job. The common kinds:

- **Dummy** — a placeholder passed only to satisfy a signature; never used.
- **Stub** — returns canned answers to calls, so the unit can proceed (e.g. a repository
  stub that returns a fixed user). Use to control *inputs* coming from a collaborator.
- **Fake** — a working but simplified implementation (e.g. an in-memory repository).
  Use when you need real-ish behavior without the real dependency's cost.
- **Mock** — a double with *expectations* about how it is called, which the test
  verifies. Use sparingly, only when the interaction itself is the behavior under test
  (e.g. "an email is sent exactly once").

Guidance once you adopt doubles:

- Doubles **SHOULD** stand in at a seam created by depending on an abstraction
  ([`principle-dependency-inversion`](../guidelines/01-design-principles.md#principle-dependency-inversion)),
  not by patching internals. If a unit is hard to test without heavy mocking, that is a
  design signal, not just a testing problem.
- Prefer **stubs and fakes** (assert on the resulting state/output) over **mocks**
  (assert on interactions). State-based tests survive refactors; interaction-based tests
  often don't.
- A double **MUST** stay faithful to the real contract. A stub that returns shapes the
  real collaborator never would gives false confidence. Where it matters, pin the
  double's fidelity with a shared contract test against the real implementation.

## Example

```
# Inject collaborators so they can be doubled at a clean seam.
class Checkout:
    def __init__(self, pricing, clock, payments):
        self._pricing, self._clock, self._payments = pricing, clock, payments

# Test: stub pricing + a fixed clock (control inputs), mock payments
# (the interaction is the behavior we care about).
def test_checkout_charges_once():
    pricing = StubPricing(total=Money("10.00", "USD"))
    clock   = FixedClock("2026-01-01T00:00:00Z")
    payments = MockPayments()

    Checkout(pricing, clock, payments).complete(cart)

    payments.assert_charged_once(Money("10.00", "USD"))
```

The clock and pricing are controlled so the test is deterministic; payments is mocked
because "charge exactly once" *is* the property under test
([`error-retry-safely`](../guidelines/07-error-handling.md#error-retry-safely)).

## Consequences

- Tests become fast, deterministic, and independent of external systems.
- A unit that's easy to double is usually well-decoupled; difficulty doubling exposes
  tight coupling worth fixing.
- Over-mocking couples tests to implementation detail, making them brittle and giving
  false confidence when a double drifts from the real contract.
- Doubles must be maintained as the real contracts evolve; a stale fake can hide a real
  break.

## Related

- [`test-isolated`](../guidelines/05-testing.md#test-isolated)
- [`test-deterministic`](../guidelines/05-testing.md#test-deterministic)
- [`test-behavior-not-implementation`](../guidelines/05-testing.md#test-behavior-not-implementation)
- [`principle-dependency-inversion`](../guidelines/01-design-principles.md#principle-dependency-inversion)
