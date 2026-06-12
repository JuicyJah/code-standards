# Long-Running Operations
<a id="SDLC-API-P-0004"></a>**`SDLC-API-P-0004`**

## Problem

Some operations cannot complete within the lifetime of a single HTTP request:
provisioning infrastructure, transcoding a video, generating a large export,
running a batch job. Holding the connection open for minutes is fragile — proxies
time out, clients disconnect, and the work is lost or duplicated. The API needs to
accept the work, return promptly, and let the client track progress.

## When to use

Use this pattern when an operation may take longer than a few seconds — longer than
a client should reasonably hold a synchronous request open.

Do **not** use it for operations that complete quickly; a synchronous response is
simpler and preferable (`principle-minimal-surface`). Do not use it to paper over a
slow implementation that could be made fast.

## Solution

The operation is modeled as a **status monitor** resource that the client polls.

1. The client initiates the operation with a normal request (`POST` to a collection,
   `POST` to an action sub-resource, `PUT`, or `DELETE`).
2. The server **MUST** respond `202 Accepted` and **MUST** return a `Location` header
   (and **SHOULD** echo it as a body field) pointing to a **status monitor**
   resource. The server does not wait for the work to finish.
3. The client **GET**s the status monitor to observe progress. The status monitor
   **MUST** include a `status` field drawn from a documented, extensible enum —
   `notStarted`, `running`, `succeeded`, `failed`, `canceled`.
4. While running, the server **SHOULD** return `Retry-After` on the status-monitor
   response so the client knows how long to wait before polling again (avoiding both
   busy-polling and excessive latency).
5. On completion, the status monitor reports a terminal `status`. On `failed`, it
   **MUST** include an [error](../guidelines/07-errors.md) describing the failure. On
   `succeeded`, it **MUST** make the result available — either inline, or via a link
   to the created/affected resource.

The status monitor itself is a resource: it has a stable URL, it can be listed
(`GET /operations`), and it follows all the usual representation rules.

<!-- param: retry_after_seconds | 5 | Default Retry-After polling interval (seconds) | This organization sets the default Retry-After interval on in-progress status monitors to {value} seconds. -->

### Requirements summary

- **MUST** return `202 Accepted` with a `Location` pointing to the status monitor.
- **MUST** make the status monitor pollable with `GET` and expose a `status` enum.
- **MUST** report errors via [Problem Details](../guidelines/07-errors.md) on failure.
- **SHOULD** return `Retry-After` while the operation is in progress.
- **SHOULD** support cancellation where meaningful (e.g. `POST /operations/{id}:cancel`).
- **SHOULD** retain a completed status monitor for a documented period so a client
  that disconnected can still learn the outcome.

<!-- param: status_monitor_retention_hours | 24 | Completed status monitor retention window (hours) | This organization retains completed status monitors for {value} hours before they may be deleted. -->

## Example

Initiate:

```http
POST /v1/videos/vid_42/encodings
Content-Type: application/json

{ "format": "h264", "resolution": "1080p" }
```

```http
HTTP/1.1 202 Accepted
Location: https://api.example.com/v1/operations/op_7f3
Retry-After: 5

{ "id": "op_7f3", "status": "running" }
```

Poll:

```http
GET /v1/operations/op_7f3
```

```http
HTTP/1.1 200 OK
Retry-After: 5

{ "id": "op_7f3", "status": "running", "progressPercent": 40 }
```

Completion:

```http
HTTP/1.1 200 OK

{
  "id": "op_7f3",
  "status": "succeeded",
  "result": { "encodingId": "enc_99", "url": "https://api.example.com/v1/encodings/enc_99" }
}
```

## Consequences

- Clients **MUST** treat the operation as asynchronous: poll the status monitor and
  honor `Retry-After`; never assume completion from the `202`.
- The initiating request **SHOULD** be made idempotent (see
  [Idempotency keys](idempotency.md)) so a retried initiation does not start the work
  twice.
- The server carries the cost of storing operation state. Define and document a
  retention window.
- A common mistake is returning `200 OK` with the final result on the initiating
  request "when it happens to be fast" and `202` otherwise — clients then need two
  code paths. Pick one behavior per operation.

## Related

- Guidelines: [HTTP methods and status](../guidelines/04-http-methods-and-status.md),
  [Errors](../guidelines/07-errors.md),
  [Collections](../guidelines/08-collections.md) (listing operations).
- Patterns: [Idempotency keys](idempotency.md).
