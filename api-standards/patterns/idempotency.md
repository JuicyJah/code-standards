# Idempotency Keys
<a id="SDLC-API-P-0003"></a>**`SDLC-API-P-0003`**

## Problem

Networks fail unpredictably. A client sends `POST /payments`, the request reaches the
server and succeeds, but the response is lost on the way back. The client, seeing no
response, retries — and now there are two payments. `POST` is not idempotent
(see [`method-idempotency`](../guidelines/04-http-methods-and-status.md#method-idempotency)),
so the client cannot safely retry it. The API needs a way to let clients retry
non-idempotent operations exactly once.

## When to use

Use this pattern for **non-idempotent, side-effectful** operations that clients may
need to retry — chiefly `POST` that creates a resource or triggers an external
effect (charging a card, sending a message, placing an order).

You do **not** need it for naturally idempotent methods (`GET`, `PUT`, `DELETE`,
idempotent `PATCH`); those are already retry-safe by design.

## Solution

The client generates a unique key per logical operation and sends it; the server
deduplicates on that key.

- The client **MUST** generate a unique idempotency key (a UUID or other
  high-entropy value) for each *distinct* operation and send it in an
  `Idempotency-Key` request header. Every retry of the *same* logical operation
  **MUST** reuse the *same* key.
- On first receipt of a key, the server processes the request normally and **MUST**
  store the key together with the resulting response for a documented retention
  window.
- On a repeat request with a key it has already seen and completed, the server
  **MUST NOT** perform the operation again and **MUST** return the **stored original
  response** (same status, same body). The retry is therefore safe and transparent.
- If a repeat request arrives while the original is still in flight, the server
  **SHOULD** respond `409 Conflict` (or hold the request) rather than risk running it
  twice.
- The server **MUST** scope keys to the authenticated principal so one client's key
  cannot collide with another's.
- The server **SHOULD** verify that a reused key arrives with the same request
  parameters as the original, and **SHOULD** reject a reused key carrying a *different*
  payload with `422`, since that indicates a client bug rather than a retry.
- The server **MUST** document the retention window after which a key is forgotten
  and the operation could run again.

<!-- param: idempotency_key_retention_hours | 24 | Idempotency key retention window (hours) | This organization retains idempotency keys and their stored responses for {value} hours, after which a key is forgotten and the operation may run again. -->

## Example

First attempt (response lost in transit):

```http
POST /v1/payments
Idempotency-Key: 5f3a9c2e-7b1d-4e6a-9f2c-1a2b3c4d5e6f
Content-Type: application/json

{ "amount": "49.00", "currency": "USD", "source": "card_88" }
```

The client times out and retries with the **same** key:

```http
POST /v1/payments
Idempotency-Key: 5f3a9c2e-7b1d-4e6a-9f2c-1a2b3c4d5e6f
Content-Type: application/json

{ "amount": "49.00", "currency": "USD", "source": "card_88" }
```

```http
HTTP/1.1 201 Created
Location: https://api.example.com/v1/payments/pay_123

{ "id": "pay_123", "status": "succeeded", "amount": "49.00", "currency": "USD" }
```

Exactly one payment exists. The second call returned the first call's stored result.

## Consequences

- Clients **MUST** persist the key across retries — generating a fresh key on retry
  defeats the mechanism. The key identifies the *intent*, not the *attempt*.
- The server takes on storage and a retention policy. Keys cannot be remembered
  forever; document the window (commonly 24 hours to a few days) and the behavior
  after it lapses.
- This pattern composes with [rate limiting](../guidelines/11-rate-limiting.md): a
  client honoring `Retry-After` on a `429` can safely retry an idempotent-keyed
  `POST`.
- A common mistake is keying on the request body hash instead of a client-supplied
  key; that conflates two intentionally-identical operations (two separate $49
  charges) into one.

## Related

- Guidelines: [HTTP methods and status](../guidelines/04-http-methods-and-status.md#method-idempotency),
  [Rate limiting](../guidelines/11-rate-limiting.md).
- Patterns: [Long-running operations](long-running-operations.md) (idempotent
  initiation), [Conditional requests](conditional-requests.md) (concurrency, a
  different concern).
