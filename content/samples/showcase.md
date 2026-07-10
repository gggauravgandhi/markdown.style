# Quarterly Growth Report

*Written by an LLM in seconds — styled by markdown.style.*

This is the markdown an AI assistant hands you: solid structure, zero design. The theme you are looking at is doing all of the visual work.

## Highlights

| Region | Revenue | Growth |
|--------|---------|--------|
| EMEA   | 4.2M    | +14%   |
| APAC   | 3.1M    | +22%   |
| AMER   | 6.8M    | +9%    |

- [x] Consolidate Q3 numbers
- [x] Review regional forecasts
- [ ] Board deck sign-off

## What drove the quarter

Net growth is computed per region as `rate * (1 - churnShare)` and rolled up weekly. The pipeline behind it:

```ts
export function netGrowth(rates: number[], churn: number[]): number {
  return rates.reduce((sum, r, i) => sum + r * (1 - (churn[i] ?? 0)), 0)
}
```

> Numbers exclude the acquisition closed after the quarter cutoff.[^1]

---

Full methodology lives in the [reporting handbook](https://example.com/handbook).

[^1]: See the finance memo for reconciliation details.
