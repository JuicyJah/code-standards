# 01 — Design Principles

These principles underpin every other guideline. When a specific rule does not
cover your situation, decide by applying these principles. When two rules appear
to conflict, the one that better serves these principles wins.

> Requirement keywords (**MUST**, **SHOULD**, **MAY**, …) follow
> [RFC 2119/8174](https://www.rfc-editor.org/rfc/rfc8174). See the
> [README](../README.md#requirement-levels-rfc-2119--rfc-8174).

## Intent

A good API is a product whose users are developers. Its quality is measured by how
quickly a competent developer can do the right thing and how hard it is to do the
wrong thing. The principles below optimize for that.

## Principles

### `principle-contract-first`
<a id="SDLC-API-0001"></a>**`SDLC-API-0001`**

**MUST** treat the API contract — its URLs, payloads, headers, and status codes —
as the product. Implementation details (database schema, internal services,
language, framework) **MUST NOT** leak into the contract. Consumers depend on the
contract, not the implementation; the contract therefore changes more slowly and
more carefully than the code behind it.

### `principle-design-before-build`
<a id="SDLC-API-0002"></a>**`SDLC-API-0002`**

**SHOULD** design the API contract before implementing it, and **SHOULD** express
that design in a machine-readable description (see
[Governance](12-governance.md)). Designing first surfaces inconsistency and
naming problems while they are still cheap to fix. Reviewing a description is far
cheaper than reworking a shipped API.

### `principle-resource-oriented`
<a id="SDLC-API-0003"></a>**`SDLC-API-0003`**

**MUST** model the API as a set of **resources** — named things — manipulated with
a uniform set of HTTP methods, rather than as a set of remote procedure calls.
Resources are nouns; the verbs are HTTP methods. This is what makes REST APIs
predictable: once a consumer understands how one resource behaves, they understand
how all of them behave. See [URLs and resources](03-urls-and-resources.md).

### `principle-least-surprise`
<a id="SDLC-API-0004"></a>**`SDLC-API-0004`**

**MUST** prefer the behavior an experienced HTTP developer would expect. Use HTTP
methods and status codes for their standard meanings. Do not overload `200 OK` to
report failure, do not use `POST` where `GET` is correct, and do not invent a
bespoke mechanism where a standard one exists. Surprise is a defect.

### `principle-consistency`
<a id="SDLC-API-0005"></a>**`SDLC-API-0005`**

**MUST** make the same concept look the same everywhere — across endpoints within
an API, and, by following this standard, across APIs. Casing, date formats, error
shapes, pagination, and naming **MUST NOT** vary from one endpoint to the next.
Local consistency within an existing API outweighs conformance to a new rule:
if a service already does something one way, a new endpoint **SHOULD** match the
service over the standard, and the service **SHOULD** migrate as a whole.

### `principle-evolvable`
<a id="SDLC-API-0006"></a>**`SDLC-API-0006`**

**MUST** design so the API can change without breaking existing clients. Add
rather than remove, make new fields optional, never repurpose an existing field,
and treat every published behavior as a promise. See
[Versioning and compatibility](09-versioning-and-compatibility.md). An API that
cannot evolve safely will either stagnate or break its consumers; both are failures.

### `principle-explicit`
<a id="SDLC-API-0007"></a>**`SDLC-API-0007`**

**SHOULD** be explicit rather than clever. Prefer obvious names over short ones,
documented defaults over implicit behavior, and clear errors over silent
correction. A consumer **SHOULD** be able to predict what a request does from its
shape alone.

### `principle-secure-by-default`
<a id="SDLC-API-0008"></a>**`SDLC-API-0008`**

**MUST** require transport security and authentication by default, grant the least
privilege necessary, and never depend on obscurity. Security is not a layer added
later; it is a property of the contract. See [Security](10-security.md).

### `principle-fault-tolerant`
<a id="SDLC-API-0009"></a>**`SDLC-API-0009`**

**SHOULD** enable consumers to build reliable clients: make unsafe operations
retry-safe through idempotency, support optimistic concurrency where lost updates
matter, and signal overload with `429` and `Retry-After` rather than failing
opaquely. The network is unreliable; the API should help clients cope.

### `principle-minimal-surface`
<a id="SDLC-API-0010"></a>**`SDLC-API-0010`**

**SHOULD** expose the smallest surface that satisfies real use cases (apply YAGNI).
Every endpoint, field, parameter, and option is a permanent commitment that must be
documented, tested, secured, and maintained. It is far easier to add capability
later than to remove it. Prefer to ship less and grow deliberately.

## Applying the principles

When you face a decision this standard does not settle:

1. Choose the option a competent consumer would expect (`principle-least-surprise`).
2. Among those, choose the one consistent with the rest of the API (`principle-consistency`).
3. Among those, choose the one that keeps future evolution open (`principle-evolvable`).
4. Among those, choose the smallest (`principle-minimal-surface`).

Document the decision so the next endpoint can follow it.
