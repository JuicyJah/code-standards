# Webhooks

## Problem

Consumers often need to know when something happens in the API's domain — an order
ships, a payment settles, a job finishes. Polling for changes is wasteful and slow:
most polls return nothing, and real changes are noticed only on the next interval.
The API needs to *push* events to consumers as they happen.

## When to use

Use webhooks when consumers need timely notification of server-side events and
polling would be wasteful or too slow.

Consider alternatives first: for a single long operation, the
[long-running-operations](long-running-operations.md) status monitor is simpler. For
high-volume, low-latency streaming to one consumer, a streaming protocol may fit
better. Webhooks shine for event notification to many independently-operated
consumers.

## Solution

The API delivers events by making HTTP `POST` requests to consumer-registered URLs.
Because the API is now an HTTP *client* calling an endpoint it does not control,
authenticity, reliability, and consumer protection become the API's responsibility.

### Subscription

- Consumers **SHOULD** register and manage subscriptions through the API itself —
  model a subscription as a resource (`POST /webhook-subscriptions`) specifying the
  destination URL and the event types of interest.
- The API **SHOULD** verify ownership of a newly registered URL (for example, a
  challenge-response handshake) before sending events, to prevent using the API to
  flood a third party.

### Event delivery

- The API **MUST** deliver each event as a `POST` to the subscribed URL with a JSON
  body following the normal [data-type](../guidelines/06-data-types.md) and
  [naming](../guidelines/02-naming.md) rules.
- Each event **MUST** carry a unique event `id`, an event `type` (an
  [extensible enum](../guidelines/06-data-types.md#type-extensible-enums)), a
  timestamp, and enough data to identify the affected resource. It **SHOULD** include
  a reference (URL) to the resource rather than relying solely on an embedded copy,
  so consumers can fetch the authoritative current state.
- A consumer endpoint **MUST** signal successful receipt with a `2xx` status. The API
  **MUST** treat any non-`2xx` (or timeout) as a delivery failure to be retried.

### Authenticity

- The API **MUST** let consumers verify that an event genuinely came from the API and
  was not forged or tampered with. **RECOMMENDED**: sign each delivery with an HMAC
  over the raw body using a per-subscription secret, sent in a signature header, so
  the consumer can recompute and compare.
- The signature **SHOULD** cover a timestamp, and consumers **SHOULD** reject events
  whose timestamp is outside a small tolerance, to prevent replay of captured
  deliveries.
- The API **MUST NOT** rely on the source IP or an unauthenticated shared secret in
  the URL as the sole proof of authenticity.

### Reliability

- The API **MUST** retry failed deliveries with exponential backoff over a documented
  window, then stop and surface the failure (and **SHOULD** disable or flag a
  persistently failing subscription).
- Delivery is **at-least-once**: the API **MUST** document that consumers may receive
  duplicates, and consumers **MUST** deduplicate on the event `id`
  (idempotent processing). Ordering **SHOULD NOT** be assumed; if order matters,
  consumers **SHOULD** use the event timestamp/sequence to reorder.
- The API **SHOULD** provide a way to inspect recent deliveries and redeliver an
  event, so consumers can recover from an outage on their side.

### Protecting the consumer

- The API **SHOULD** bound event payload size and delivery rate to a subscription so
  a burst of events cannot overwhelm a consumer.

## Example

Delivery:

```http
POST /hooks/incoming HTTP/1.1
Host: consumer.example.org
Content-Type: application/json
Webhook-Id: evt_9c2
Webhook-Timestamp: 1749650400
Webhook-Signature: v1,3v8Z...base64hmac...=

{
  "id": "evt_9c2",
  "type": "order.shipped",
  "createdAt": "2026-06-11T14:00:00Z",
  "data": {
    "orderId": "ord_42",
    "resource": "https://api.example.com/v1/orders/ord_42"
  }
}
```

The consumer verifies the signature over the raw body, checks it has not already
processed `evt_9c2`, processes it, and returns `204 No Content`.

## Consequences

- The API becomes an HTTP client and inherits the reliability problems of calling
  endpoints it does not control: timeouts, slow consumers, and disappearing URLs.
  Budget for retries, backoff, and a dead-letter/disable policy.
- Consumers **MUST** treat delivery as at-least-once and unordered: deduplicate on
  event `id`, and do not assume the embedded data is still current — re-fetch the
  referenced resource when authoritative state matters.
- A common mistake is sending events with no signature, leaving consumers unable to
  distinguish genuine events from forgeries posted to their public endpoint.

## Related

- Guidelines: [Security](../guidelines/10-security.md),
  [Data types](../guidelines/06-data-types.md),
  [Errors](../guidelines/07-errors.md).
- Patterns: [Idempotency keys](idempotency.md) (consumer-side dedup),
  [Long-running operations](long-running-operations.md) (an alternative for single
  operations).
