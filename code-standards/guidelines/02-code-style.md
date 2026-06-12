# 02 — Code style and readability

Style is not decoration. Consistent, readable code lowers the cost of every future
read and review, and removes a whole category of pointless debate. The governing idea
of this document: **machines enforce style so humans don't have to.** Reviewers should
never spend attention on formatting a tool could fix.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Automated formatting and linting

### `style-formatter`
<a id="SDLC-CODE-0015"></a>**`SDLC-CODE-0015`**

Every codebase **MUST** use an automated code formatter, with its configuration
committed to the repository, so that formatting is identical for every contributor and
not a matter of opinion. Formatting **MUST** be checked in CI (see
[`governance-required-checks`](11-governance.md#governance-required-checks)) so
unformatted code cannot merge. Pick one formatter per language and let it win; do not
hand-format around it.

### `style-linter`
<a id="SDLC-CODE-0016"></a>**`SDLC-CODE-0016`**

Every codebase **MUST** use a static linter appropriate to its language, with its
configuration committed to the repository, and **MUST** run it in CI as a required
check. A linter catches an entire class of defects and inconsistencies — unused
variables, shadowed names, suspicious comparisons, common bug patterns — before a
human ever looks at the code.

### `style-no-warnings`
<a id="SDLC-CODE-0017"></a>**`SDLC-CODE-0017`**

**SHOULD** keep the build, compiler, and linter free of warnings: either fix them or
explicitly, narrowly suppress a specific warning with a comment explaining why.
Warnings that are routinely ignored train everyone to ignore all warnings, including
the one that matters. Treating warnings as errors in CI is **RECOMMENDED**.

### `style-consistent`
<a id="SDLC-CODE-0018"></a>**`SDLC-CODE-0018`**

Within a codebase, there **MUST** be exactly one style for any given decision the
formatter and linter do not settle (file organization, ordering conventions, idiom
choices). Consistency *within* a codebase matters more than which option you picked;
when in doubt, match the surrounding code.

## Naming

### `style-intention-revealing-names`
<a id="SDLC-CODE-0019"></a>**`SDLC-CODE-0019`**

Names **MUST** reveal intent: what a thing is, what a function does, or what a value
means. `daysUntilExpiry` beats `d`; `isEligible` beats `flag`. A reader should rarely
need to inspect a definition to understand a use. Avoid abbreviations that aren't
universal, and avoid encoding type or scope into names when the language already makes
them clear.

### `style-naming-conventions`
<a id="SDLC-CODE-0020"></a>**`SDLC-CODE-0020`**

Names **MUST** follow the established casing and naming conventions of the language
(for example, the community-standard convention for constants, types, functions, and
variables). Conventions are part of least astonishment
([`principle-least-astonishment`](01-design-principles.md#principle-least-astonishment));
fighting them makes code read as foreign.

### `style-no-misleading-names`
<a id="SDLC-CODE-0021"></a>**`SDLC-CODE-0021`**

A name **MUST NOT** lie. A `get*` that mutates, a `list` that is actually a set, a
`count` that can be negative, or a unit-less `timeout` whose unit you must guess are
all traps. Encode units and meaning where ambiguity is likely (`timeoutMs`).

## Structure of the code

### `style-small-units`
<a id="SDLC-CODE-0022"></a>**`SDLC-CODE-0022`**

Functions and modules **SHOULD** be small and focused enough to understand as a whole.
A function that does one thing at one level of abstraction is easier to name, test, and
reuse. Long functions, deep nesting, and high cyclomatic complexity are signals to
extract — and a linter **SHOULD** flag them past an agreed threshold rather than
leaving it to taste.

### `style-no-deep-nesting`
<a id="SDLC-CODE-0023"></a>**`SDLC-CODE-0023`**

**SHOULD** keep nesting shallow by using guard clauses and early returns instead of
arrowhead `if`/`else` pyramids. Flatter code has fewer states to track and fewer places
for a bug to hide.

### `style-no-magic-values`
<a id="SDLC-CODE-0024"></a>**`SDLC-CODE-0024`**

Literal numbers and strings with non-obvious meaning **SHOULD** be named constants, not
sprinkled inline. `MAX_RETRIES = 3` documents intent and gives the value a single home
([`principle-dry`](01-design-principles.md#principle-dry)); a bare `3` in five places
does neither. Genuinely self-evident literals (`0`, `1`, `""`) are fine.

### `style-no-dead-code`
<a id="SDLC-CODE-0025"></a>**`SDLC-CODE-0025`**

Dead code — unreachable branches, unused functions, and code "commented out just in
case" — **MUST NOT** be committed. Version control already remembers deleted code; dead
code in the tree only misleads readers and rots. Delete it; retrieve it from history if
you ever need it (see [`docs-no-commented-code`](06-documentation.md#docs-no-commented-code)).

### `style-no-todo-without-tracking`
<a id="SDLC-CODE-0026"></a>**`SDLC-CODE-0026`**

A `TODO`/`FIXME` left in the code **SHOULD** reference a tracked issue, so it becomes
real work rather than a wish that decays in place. An untracked `TODO` is invisible to
planning and will outlive everyone who understood it (see
[`debt-tracked`](11-governance.md#governance-tech-debt)).

## Common mistakes

- Arguing about formatting in code review instead of delegating it to a committed
  formatter config (`style-formatter`).
- A linter that exists but isn't run in CI, so violations accumulate until it's
  worthless.
- Single-letter or abbreviated names that force every reader to decode them.
- Commented-out code kept "for reference" — that's what version control is for.
- Magic numbers duplicated across files, so a policy change means a hunt-and-replace.
- Suppressing warnings broadly (whole-file or whole-project) instead of fixing or
  narrowly justifying them.
