# 07 — Error handling

How code behaves when things go wrong determines whether a system is operable or a
mystery. Good error handling makes failures visible, diagnosable, and recoverable; bad
error handling hides them until they surface as corrupted data or a 3 a.m. page with no
clues. The mechanisms differ by language (exceptions, result types, error returns) but
the principles below are universal.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Never hide failure

### `error-no-silent-failure`
<a id="SDLC-CODE-0069"></a>**`SDLC-CODE-0069`**

An error **MUST NOT** be silently swallowed. Catching an error and ignoring it — an
empty catch block, a discarded error return, a bare `except: pass` — hides failures
until they manifest far away as something inexplicable. If you catch or receive an
error, you **MUST** do something meaningful: handle it, recover, retry, or propagate it
with context. "Log and continue" is only acceptable when continuing is genuinely
correct, not as a reflex.

### `error-fail-fast`
<a id="SDLC-CODE-0070"></a>**`SDLC-CODE-0070`**

Code **SHOULD** detect invalid states and bad inputs as early as possible and stop,
rather than limping on with corrupt data. Validate inputs at boundaries
([`security-validate-input`](09-security.md#security-validate-input)) and assert
invariants. A failure that stops immediately, near its cause, is cheap to diagnose; one
that propagates through layers of half-valid state is expensive.

### `error-no-control-flow`
<a id="SDLC-CODE-0071"></a>**`SDLC-CODE-0071`**

Errors **SHOULD NOT** be used for ordinary, expected control flow. Reserve the error
channel (exceptions/error returns) for the exceptional. An expected "not found" or
"already exists" is often better modeled as a normal return value than as a thrown
error; overusing exceptions for routine branches hides the real ones and hurts
performance and readability.

## Errors must carry information

### `error-context`
<a id="SDLC-CODE-0072"></a>**`SDLC-CODE-0072`**

An error **MUST** carry enough context to diagnose it: what operation failed, on what
input or resource, and why. "Operation failed" is useless; "failed to write order 1234
to ledger: connection refused" is actionable. When propagating, **SHOULD** add context
(wrap/annotate) rather than discarding the original cause — preserve the chain back to
the root.

### `error-typed`
<a id="SDLC-CODE-0073"></a>**`SDLC-CODE-0073`**

Code **SHOULD** distinguish kinds of errors in a way callers can act on
programmatically — distinct types, codes, or categories — rather than forcing callers to
match on human-readable message strings. A caller that needs to retry on a transient
failure but abort on a validation failure must be able to tell them apart without
parsing prose.

### `error-distinguish-recoverable`
<a id="SDLC-CODE-0074"></a>**`SDLC-CODE-0074`**

Code **SHOULD** distinguish *recoverable* errors (a transient network blip, a
conflicting update) from *programmer errors / bugs* (a null where one is impossible, a
broken invariant). Recoverable errors are handled; bugs should fail loudly and visibly
so they get fixed, not caught and hidden.

## Boundaries and cleanup

### `error-cleanup`
<a id="SDLC-CODE-0075"></a>**`SDLC-CODE-0075`**

Resources acquired — files, connections, locks, transactions — **MUST** be released on
every path, including error paths. Use the language's scoped-cleanup mechanism
(`defer`, `try/finally`, context managers, RAII, `using`) rather than manual cleanup
that a thrown error can skip. Leaks under failure are how a system degrades the longer
it runs.

### `error-no-leak-to-users`
<a id="SDLC-CODE-0076"></a>**`SDLC-CODE-0076`**

Errors surfaced to end users or across a trust boundary **MUST NOT** leak internal
detail — stack traces, queries, secrets, internal hostnames. Return a safe, useful
message (and a correlation ID to tie it to internal logs); log the detail internally,
not to the user (see [`security-error-no-leak`](09-security.md#security-error-no-leak)
and [`log-correlation`](08-logging-and-observability.md#log-correlation)).

### `error-retry-safely`
<a id="SDLC-CODE-0077"></a>**`SDLC-CODE-0077`**

Automatic retries **MUST** be limited to operations that are safe to repeat
(idempotent), and **MUST** use bounded retries with backoff. Blindly retrying a
non-idempotent operation can double-charge a customer or duplicate data; unbounded or
un-spaced retries turn a brief outage into a self-inflicted denial of service (a
"retry storm"). See [Feature flags](../patterns/feature-flags.md) for safely disabling a
failing path.

<!-- param: retry_max_attempts | 3 | Maximum automatic retry attempts | This organization limits automatic retries to {value} attempts before giving up. -->
<!-- param: retry_initial_backoff_ms | 200 | Initial retry backoff (milliseconds) | This organization starts retry backoff at {value} milliseconds before exponential growth. -->
<!-- param: retry_max_backoff_ms | 30000 | Maximum retry backoff (milliseconds) | This organization caps retry backoff at {value} milliseconds between attempts. -->

## Common mistakes

- Empty catch blocks and discarded error returns that erase a failure entirely.
- Error messages with no context ("error", "failed"), forcing a guessing game during an
  incident.
- Forcing callers to `string.contains("not found")` because errors aren't typed.
- Leaking a raw stack trace or SQL error to an end user.
- Cleanup code that a thrown error jumps over, leaking connections or holding locks.
- Retrying a non-idempotent call, or retrying with no limit and no backoff, amplifying
  an outage.
- Using exceptions for routine, expected outcomes, drowning the genuine errors.
