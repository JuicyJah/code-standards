# 01 — Design principles

These are the values that the rest of the standard operationalizes. They are
deliberately language-agnostic: they describe how to shape code and its structure, not
which syntax to use. Where later guidelines give you a concrete, checkable rule (for
example "use a formatter"), this document gives you the *why* it serves.

Principles can pull against each other — DRY can fight simplicity, abstraction can
fight directness. When they conflict, favor the reader and the next person who has to
change the code.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## SOLID

The five SOLID principles describe how to structure units of code (functions, classes,
modules) so they stay changeable. They apply in any paradigm — substitute "module" or
"function" for "class" as your language demands.

### `principle-single-responsibility`

A unit of code **SHOULD** have one reason to change. When unrelated concerns live in
the same function or module, a change to one risks breaking the other and every change
touches a larger surface. If you cannot describe what a unit does without saying "and",
consider splitting it.

### `principle-open-closed`

Code **SHOULD** be open to extension but closed to modification: prefer adding new
behavior by adding new code (a new implementation, a new case) over editing
battle-tested code in place. This limits the blast radius of change and protects
working code from accidental regressions.

### `principle-liskov-substitution`

A subtype or implementation **MUST** be usable anywhere its abstraction is expected,
without surprising the caller. An implementation that throws where the contract
implies success, tightens preconditions, or weakens guarantees breaks callers that
were written against the abstraction. If a "kind of X" cannot honor X's contract, it
is not an X.

### `principle-interface-segregation`

An abstraction **SHOULD** expose only what its callers need. Fat interfaces force
implementers to provide behavior they do not have and callers to depend on methods
they never call. Prefer several small, role-focused interfaces over one large one.

### `principle-dependency-inversion`

High-level policy **SHOULD** depend on abstractions, not on low-level details.
Depending on an interface rather than a concrete implementation (a specific database,
HTTP client, or clock) keeps business logic testable and lets details change without
rewriting policy. See also [`test-isolated`](05-testing.md#test-isolated).

## Simplicity and reuse

### `principle-kiss`

Prefer the simplest design that solves the actual problem. Complexity is a cost paid on
every future read, change, and debugging session. A clever solution that the next
engineer cannot follow is a liability, not an asset. Simplicity is measured by how
hard the code is to *understand and change*, not by how few characters it has.

### `principle-yagni`

**SHOULD NOT** build functionality, configuration, or abstraction for a need that is
only speculated, not real. Speculative generality adds code to maintain, paths to
test, and concepts to learn, in exchange for flexibility that often never gets used —
and that is usually the wrong shape when the real need finally arrives.

### `principle-dry`

Each piece of *knowledge* — a business rule, a constant, a validation — **SHOULD** have
a single authoritative representation, so a change is made in one place. But beware:
DRY is about knowledge, not about characters that happen to look alike. Two snippets
that are identical today for different reasons will need to change independently
tomorrow; deduplicating them couples unrelated things. Prefer a little duplication
over the wrong abstraction.

## Structure

### `principle-low-coupling`

Modules **SHOULD** depend on as little of each other as possible, and through narrow,
explicit interfaces. Loose coupling lets you understand, test, and change one module
without holding the rest of the system in your head, and contains the spread of change.

### `principle-high-cohesion`

Things that change together **SHOULD** live together. Code related to one capability
belongs in one place rather than scattered across the codebase, so a feature can be
found, understood, and changed as a unit.

### `principle-composition-over-inheritance`

**SHOULD** prefer composing behavior from small parts over deep inheritance
hierarchies. Inheritance couples a subtype to its parent's internals and is rigid;
composition (and delegating to injected collaborators) is more flexible and easier to
test. Reserve inheritance for genuine, stable "is-a" relationships that honor
[`principle-liskov-substitution`](#principle-liskov-substitution).

## Disposition

### `principle-least-astonishment`

Code **SHOULD** behave the way a competent reader expects from its name, signature, and
context. A function called `get*` that also writes, a parameter that is silently
ignored, or an operation with a surprising side effect costs every future reader. Make
the surprising explicit, or remove the surprise.

### `principle-explicit-over-implicit`

**SHOULD** prefer explicit, visible behavior over hidden magic. Implicit global state,
action-at-a-distance, and "it just works" conventions that aren't written down make
code hard to reason about and debug. When something must be implicit for ergonomics,
document it.

### `principle-boy-scout`

**SHOULD** leave code at least slightly better than you found it: a clearer name, a
missing test, a deleted dead branch. Incremental improvement on every change is how a
large codebase is kept healthy without ever stopping for a big cleanup — and it is the
mechanism by which legacy code becomes conformant over time (see
[`governance-new-code`](11-governance.md#governance-new-code)).

## Common mistakes

- Treating SOLID, DRY, or any principle as an absolute law and torturing code to obey
  it, instead of as a heuristic in service of readable, changeable code.
- "DRYing up" two coincidentally-similar pieces of code, then fighting the coupling
  forever as they need to diverge.
- Building a configurable, pluggable framework for a problem that had exactly one case
  (`principle-yagni`).
- Deep inheritance hierarchies that no one can change because every subclass depends on
  a parent's internals.
- Hiding important behavior behind implicit magic and calling it "clean".
