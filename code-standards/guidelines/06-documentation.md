# 06 — Documentation and comments

Documentation exists to save a future reader time and prevent mistakes. The best
documentation is code that doesn't need explaining; the second best is the small amount
of prose that captures what code cannot — intent, rationale, and how to get started.
This document is about being deliberate: write the docs that earn their keep, and don't
let them lie.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Repository documentation

### `docs-readme`
<a id="SDLC-CODE-0059"></a>**`SDLC-CODE-0059`**

Every repository **MUST** have a README that tells a newcomer what the project is, and
how to build, test, and run it. The README is the front door; without it, onboarding
depends on tribal knowledge. It **SHOULD** also point to where deeper documentation,
ownership, and support live.

### `docs-runnable-instructions`
<a id="SDLC-CODE-0060"></a>**`SDLC-CODE-0060`**

Setup and run instructions **MUST** be accurate and **SHOULD** be verified to work from
a clean checkout. Instructions that have silently drifted are worse than none: they cost
a newcomer hours before they conclude the docs are wrong. Where possible, encode setup
in scripts or a task runner so the instructions *are* the automation and cannot rot
unnoticed.

### `docs-ownership`
<a id="SDLC-CODE-0061"></a>**`SDLC-CODE-0061`**

A repository **SHOULD** record who owns it and how to reach them (for example, a
`CODEOWNERS` file or a maintainers section), so that questions, reviews, and incidents
have a clear destination.

## Comments

### `docs-why-not-what`
<a id="SDLC-CODE-0062"></a>**`SDLC-CODE-0062`**

Comments **SHOULD** explain *why* — intent, rationale, trade-offs, and non-obvious
constraints — not restate *what* the code already says. `i++ // increment i` is noise;
`// retry budget: the upstream rate-limits bursts above 3/s` is gold. If a comment just
narrates the code, delete the comment and let the code speak.

### `docs-prefer-clear-code`
<a id="SDLC-CODE-0063"></a>**`SDLC-CODE-0063`**

A comment **SHOULD NOT** be used to excuse unclear code that could instead be made
clear. Prefer a well-named function or variable over a comment explaining a cryptic
one ([`style-intention-revealing-names`](02-code-style.md#style-intention-revealing-names)).
Reserve comments for what code genuinely cannot express.

### `docs-explain-surprises`
<a id="SDLC-CODE-0064"></a>**`SDLC-CODE-0064`**

Code that is surprising for a real reason — a workaround for an upstream bug, a
deliberate deviation from the obvious approach, a subtle ordering requirement — **MUST**
carry a comment explaining it. This is how you protect a necessary surprise from a
future "cleanup" that reintroduces the bug.

### `docs-no-commented-code`
<a id="SDLC-CODE-0065"></a>**`SDLC-CODE-0065`**

Commented-out code **MUST NOT** be committed (see also
[`style-no-dead-code`](02-code-style.md#style-no-dead-code)). It rots, confuses readers
about whether it matters, and is already preserved in version control. Delete it.

## Interfaces and decisions

### `docs-public-interfaces`
<a id="SDLC-CODE-0066"></a>**`SDLC-CODE-0066`**

Public interfaces — library APIs, exported functions, configuration options, CLI flags
— **SHOULD** be documented with their purpose, parameters, return values, errors, and
any important behavior (units, ranges, side effects). These are the parts other people
build against without reading your implementation; ambiguity here multiplies across
every caller.

### `docs-decision-records`
<a id="SDLC-CODE-0067"></a>**`SDLC-CODE-0067`**

Significant or non-obvious decisions — an architecture choice, a technology selection, a
deliberate trade-off — **SHOULD** be recorded durably (for example, as lightweight
Architecture Decision Records in the repo). Months later, "why is it built this way?"
has an answer, and the team avoids re-litigating settled questions or unknowingly
undoing a deliberate choice.

### `docs-keep-current`
<a id="SDLC-CODE-0068"></a>**`SDLC-CODE-0068`**

Documentation **MUST** be updated in the same change that alters the behavior it
describes. Documentation that contradicts the code is actively harmful: readers trust
it and get burned. Treat doc updates as part of "done", and prefer generating reference
docs from the source of truth where you can, so they cannot drift.

## Common mistakes

- A README that is missing, or whose setup steps stopped working three refactors ago.
- Comments that narrate the code (`// loop over users`) instead of explaining intent.
- Using a comment to apologize for confusing code instead of fixing the code.
- Commented-out blocks kept "just in case" — that's what version control is for.
- A clever workaround with no comment, deleted by the next person as "dead code", and
  the bug returns.
- Docs updated in a separate, later change (or never), so they drift from reality.
