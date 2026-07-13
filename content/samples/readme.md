# tidyq

A tiny queue with backpressure, retries, and nothing else.

## Install

```bash
bun add tidyq
```

## Usage

```ts
import { queue } from 'tidyq'

const q = queue({ concurrency: 4, retries: 2 })

for (const job of jobs) q.push(() => process(job))
await q.drain()
```

## Why another queue?

| | tidyq | typical alternative |
|---|---|---|
| Dependencies | 0 | 12+ |
| Size | 1.1 kB | 40 kB+ |
| Backpressure | built-in | plugin |

## API

- `queue(opts)`: create a queue. `concurrency` (default 1), `retries` (default 0).
- `q.push(fn)`: enqueue a task returning a promise.
- `q.drain()`: resolves when the queue is empty.

## License

MIT
