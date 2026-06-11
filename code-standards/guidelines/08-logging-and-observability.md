# 08 — Logging and observability

You cannot fix what you cannot see. Observability — logs, metrics, and traces — is how
operators understand a running system, diagnose incidents, and know whether a change
helped. This document applies primarily to code that *runs as a service*; a pure
library should emit diagnostics through its caller, not log on its own. Treat
observability as a feature, designed in, not bolted on after the first outage.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Logging

### `log-structured`

Services **SHOULD** emit logs in a structured, machine-parseable format (for example,
key-value or JSON), not as free-form prose. Structured logs can be searched, filtered,
and aggregated; "user 1234 failed" buried in a sentence cannot. Attach context as
fields (operation, resource id, duration, outcome) rather than concatenating it into the
message string.

### `log-levels`

Logs **MUST** use severity levels consistently and meaningfully (typically error / warn
/ info / debug). Levels let operators tune signal vs. noise and alert on what matters.
Reserve `error` for genuine failures that need attention; do not log routine,
successful operations at `error`, and do not bury a real failure at `debug`.

### `log-actionable`

Log what helps diagnose and operate the system, and **SHOULD NOT** drown it in noise. A
log nobody reads is wasted I/O; a log that fires thousands of times an hour hides the
one line that matters and trains operators to ignore it. Every log line should be able
to answer "what happened, to what, and what should I do about it?"

### `log-no-secrets`

Logs **MUST NOT** contain secrets, credentials, tokens, or sensitive personal data
(see [`security-no-sensitive-data-exposure`](09-security.md#security-no-sensitive-data-exposure)).
Logs are widely accessible, retained, shipped to third-party systems, and rarely
treated as sensitive — making them a prime accidental leak. Redact or omit sensitive
fields at the point of logging, not in a downstream filter you hope is configured.

### `log-correlation`

In a system that spans multiple services or handles concurrent requests, logs **SHOULD**
include a correlation/request identifier (and, where applicable, a trace id) so that all
the records for one operation can be tied together. Propagate it across service
boundaries. Without it, debugging a distributed request is reassembling a shredded
document.

### `log-no-behavior-change`

Logging **MUST NOT** change program behavior or be load-bearing. Code must run correctly
with logging turned down, and a logging failure (a full disk, an unserializable field)
**MUST NOT** crash the operation it was observing. Logging is an observer, never a
participant.

## Metrics, health, and tracing

### `observability-health`

A long-running service **SHOULD** expose a health/readiness signal so that
orchestrators and load balancers can tell whether it is alive and ready for traffic.
This is the minimum needed to operate a service safely in a modern deployment.

### `observability-metrics`

Services **SHOULD** emit key operational metrics — request rate, error rate, latency,
and the saturation of critical resources — so operators can see health at a glance, set
alerts, and spot regressions. Metrics answer "is it healthy *right now*, and is it
getting worse?" in a way scanning logs cannot.

### `observability-tracing`

In a distributed system, services **SHOULD** support distributed tracing by propagating
trace context across calls, so a single request can be followed across service
boundaries and latency can be attributed to the right hop. Adopt a standard propagation
format rather than a bespoke scheme.

## Common mistakes

- Free-text log messages that can't be searched, filtered, or aggregated.
- Everything logged at one level (all `info`, or everything at `error`), making levels
  meaningless.
- Secrets, tokens, or personal data written to logs and then shipped to a third-party
  log service.
- No correlation id, so a single distributed request is impossible to reconstruct.
- Logging so verbose that the signal drowns and operators mute it.
- A logging call that throws and takes down the request it was meant to observe.
- A service with no health check or basic metrics, operated blind.
