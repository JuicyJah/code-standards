# 09 — Security

Security is a property of code, not a phase at the end. Most breaches exploit ordinary
mistakes — a hardcoded key, an unvalidated input, an over-broad permission — far more
than exotic attacks. This document covers the language-agnostic secure-coding baseline
every codebase owes its users; it is not a substitute for threat modeling, a security
review of sensitive systems, or domain-specific compliance requirements.

> Requirement keywords follow [RFC 2119/8174](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Secrets

### `security-no-hardcoded-secrets`
<a id="SDLC-CODE-0087"></a>**`SDLC-CODE-0087`**

Secrets — passwords, API keys, tokens, private keys, connection strings — **MUST NOT**
be hardcoded in source, configuration, or committed anywhere in version control (see
[`vc-no-secrets`](03-version-control.md#vc-no-secrets)). Supply them at runtime through
a secrets manager or injected environment configuration. A secret in a repo is
compromised the moment the repo is cloned, forked, or leaked, and revoking it means
rotation, not deletion.

<!-- param: secret_rotation_days | 90 | Maximum secret rotation interval (days) | This organization rotates secrets at least every {value} days. -->

### `security-secret-scanning`
<a id="SDLC-CODE-0088"></a>**`SDLC-CODE-0088`**

The codebase **MUST** run automated secret scanning (pre-commit and/or in CI) to catch
credentials before they are committed
([`governance-required-checks`](11-governance.md#governance-required-checks)). Humans
miss secrets in diffs; machines don't. A committed-and-rotated secret is far cheaper
than a leaked one discovered months later.

## Handling untrusted input

### `security-validate-input`
<a id="SDLC-CODE-0089"></a>**`SDLC-CODE-0089`**

All input crossing a trust boundary — user input, request payloads, file contents,
inter-service messages, environment data — **MUST** be validated against an expected
shape, type, and range before use, and rejected if it does not conform
([`error-fail-fast`](07-error-handling.md#error-fail-fast)). Prefer allow-lists (accept
known-good) over deny-lists (block known-bad). Unvalidated input is the root of most
injection and corruption vulnerabilities.

### `security-safe-interpolation`
<a id="SDLC-CODE-0090"></a>**`SDLC-CODE-0090`**

Untrusted data **MUST NOT** be concatenated into the syntax of another language or
interpreter — SQL, shell commands, HTML, file paths, template expressions. Use the safe,
context-aware mechanism instead: parameterized queries, argument arrays for
subprocesses, contextual output encoding, safe path joins. This is the direct defense
against injection (SQL injection, command injection, cross-site scripting, path
traversal).

### `security-no-sensitive-data-exposure`
<a id="SDLC-CODE-0091"></a>**`SDLC-CODE-0091`**

Sensitive data **MUST** be protected in transit and at rest, and **MUST NOT** be exposed
where it doesn't belong — in logs ([`log-no-secrets`](08-logging-and-observability.md#log-no-secrets)),
error messages, URLs, or responses to unauthorized callers. Use encrypted transport for
data in motion, and collect and retain only what you actually need (data minimization
limits the blast radius of any breach).

<!-- param: sensitive_data_retention_days | 90 | Maximum sensitive data retention period (days) | This organization retains sensitive personal data for at most {value} days unless a longer period is legally required. -->

### `security-error-no-leak`
<a id="SDLC-CODE-0092"></a>**`SDLC-CODE-0092`**

Errors crossing a trust boundary **MUST NOT** reveal internal implementation detail —
stack traces, library versions, queries, internal paths — that aids an attacker
([`error-no-leak-to-users`](07-error-handling.md#error-no-leak-to-users)). Return a
generic safe message externally; keep the detail in internal logs.

## Access and trust

### `security-least-privilege`
<a id="SDLC-CODE-0093"></a>**`SDLC-CODE-0093`**

Code, services, and the credentials they use **MUST** operate with the minimum
privileges required for their task, scoped as narrowly as practical. A component that
needs read access gets read access, not admin. Least privilege ensures a compromised or
buggy component can do limited damage.

### `security-authorize-every-access`
<a id="SDLC-CODE-0094"></a>**`SDLC-CODE-0094`**

Every access to a protected resource or operation **MUST** be authorized on the server,
against the identity making the request — not assumed because the caller reached the
code path or because the UI hides the option. Never trust the client to enforce
authorization. Missing object-level authorization (letting one user act on another's
data by changing an id) is among the most common and damaging flaws.

## Building securely

### `security-trusted-crypto`
<a id="SDLC-CODE-0095"></a>**`SDLC-CODE-0095`**

Cryptography and other security-critical primitives **MUST** use well-vetted, current
standard libraries; teams **MUST NOT** invent their own crypto, password hashing, or
token schemes. Use a standard password-hashing function for passwords, a vetted library
for encryption and signing, and a cryptographically secure random source for anything
security-relevant. Rolling your own is how subtle, catastrophic flaws are born.

### `security-secure-defaults`
<a id="SDLC-CODE-0096"></a>**`SDLC-CODE-0096`**

Systems **MUST** be secure by default: access denied unless granted, encryption on
unless explicitly and deliberately disabled, the safe option the path of least
resistance. Security that depends on every user remembering to turn it on will be off
in production somewhere.

### `security-dependencies`
<a id="SDLC-CODE-0097"></a>**`SDLC-CODE-0097`**

Third-party dependencies **MUST** be tracked and scanned for known vulnerabilities, and
patched promptly — most application risk arrives through dependencies. The full set of
rules lives in [Dependencies](10-dependencies.md); see
[`dep-vulnerability-scanning`](10-dependencies.md#dep-vulnerability-scanning).

<!-- param: critical_vuln_patch_days | 7 | Critical dependency vulnerability patch SLA (days) | This organization patches critical-severity dependency vulnerabilities within {value} days of disclosure. -->

## Common mistakes

- A hardcoded API key or password in source or config, surviving in history after
  "removal".
- Building SQL or shell commands by string concatenation with user input.
- Trusting client-side checks for authorization, so changing an id exposes another
  user's data.
- Logging tokens, passwords, or personal data, then shipping logs to third parties.
- Home-grown encryption, password hashing, or token signing instead of vetted libraries.
- Over-broad credentials (admin everywhere) so any compromise is total.
- Leaking stack traces and internal detail in error responses.
