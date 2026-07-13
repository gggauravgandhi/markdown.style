# Notification Fan-Out Service — Architecture Document

*Owner: Platform Infrastructure. Status: Approved.*

## System context

The notification service accepts events from five upstream producers (billing, auth, orders, support, and the mobile push gateway) and fans them out to email, SMS, and in-app channels. Today it is a single process reading one queue; at current growth it will fall over before Q3.

## Problem

Peak throughput is projected to triple within two quarters. The existing consumer cannot be horizontally scaled because delivery ordering is enforced in-process, and a single slow channel (SMS, historically) blocks the other two.

## Decision: split by channel, not by producer

Three approaches were evaluated:

| Option | Scales independently | Preserves ordering | Operational cost |
|---|---|---|---|
| One queue, more workers | No | Yes | Low |
| Shard by producer | Partial | Yes | Medium |
| Shard by channel | Yes | Per-channel only | Medium |

> Ordering only matters within a single channel — a user should not see an SMS delayed behind an unrelated email retry. Cross-channel ordering was never a real requirement; it was inherited by accident from the original single-queue design.

**Sharding by channel** was chosen. Each channel gets its own queue and worker pool, so a slow SMS provider no longer head-of-line blocks email or push.[^1]

## Configuration

Each worker pool is configured independently:

```yaml
channels:
  email:
    concurrency: 40
    retry: { max: 5, backoff: exponential }
  sms:
    concurrency: 8
    retry: { max: 3, backoff: exponential }
  push:
    concurrency: 60
    retry: { max: 2, backoff: linear }
```

## Rollout

1. Stand up the three queues alongside the existing single queue.
2. Dual-write events to both for one week; compare delivery counts.
3. Cut producers over one at a time, ordered by blast radius:
   - Support (lowest volume)
   - Auth
   - Billing, orders, and the push gateway (highest volume, last)
4. Decommission the legacy queue once dual-write parity holds for 72 hours.

## Open questions

- Do we need a fourth channel (webhook) before this ships, or can it reuse the email pool's retry policy?
- SMS provider failover is out of scope for this document and tracked separately.

[^1]: The SMS provider's own incident history shows four multi-hour outages in the past year, all fully contained to SMS once channel isolation was tested in staging.
