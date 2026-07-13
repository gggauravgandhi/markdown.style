# Cache Invalidation Latency in Edge-Replicated Key-Value Stores

## Abstract

Edge-replicated key-value stores trade write latency for read locality, but invalidation lag between edge nodes is rarely measured in production settings. We instrument three commercial edge platforms over a four-week window and find a median cross-region invalidation latency of 340ms, with a long tail past 4 seconds during regional failover events. We argue that the tail, not the median, should drive the consistency guarantees offered to application developers.

## Introduction

Applications that read from the nearest edge node assume writes propagate quickly enough that stale reads are rare and short-lived. Prior work on invalidation protocols focuses on steady-state behavior[^1] and largely ignores failover, when propagation paths reroute and queue depth spikes.

## Method

We deployed identical write-heavy workloads (80% write, 20% read, uniform key distribution) against three edge platforms, denoted A, B, and C to preserve vendor anonymity per our data-use agreement. Each platform ran for seven days under steady state, plus one induced regional failover per platform.

## Results

| Platform | Median latency | P99 latency | Failover P99 |
|---|---|---|---|
| A | 210ms | 890ms | 2.1s |
| B | 410ms | 1.4s | 4.6s |
| C | 380ms | 1.1s | 3.3s |

Steady-state medians cluster within a factor of two, but failover behavior diverges sharply. Platform B's failover P99 is roughly five times its steady-state P99, the largest degradation observed.[^2]

## Discussion

The steady-state numbers alone would suggest these platforms are broadly interchangeable for latency-sensitive workloads. The failover column tells a different story: an application that reads its own writes during steady state can silently violate that guarantee for seconds at a time during a failover it never observes directly. We recommend platform selection guides report failover-state latency alongside steady-state medians, not as an afterthought.

## Limitations

Three platforms is a small sample, and vendor anonymity prevents readers from mapping our labels onto public SLAs. We also did not test multi-region failover (two regions failing concurrently), which operators report anecdotally as materially worse.

## References

[^1]: Demers et al., "Epidemic Algorithms for Replicated Database Maintenance," PODC 1987.
[^2]: Internal telemetry, platform B failover drill, week 3 of the measurement window.
