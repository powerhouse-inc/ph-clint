# CLI Benchmark Results

## Dev: hello Prometheus

`pnpm dev -- hello Prometheus`

| Run | Real (s) |
|-----|----------|
| 1 | 1.136 |
| 2 | 0.777 |
| 3 | 0.778 |
| 4 | 0.772 |
| 5 | 0.775 |
| 6 | 0.782 |
| 7 | 0.775 |
| 8 | 0.784 |
| 9 | 0.770 |
| 10 | 0.779 |

## Dev: weather Gent

`pnpm dev -- weather Gent`

| Run | Real (s) |
|-----|----------|
| 1 | 12.883 |
| 2 | 7.162 |
| 3 | 7.177 |
| 4 | 7.450 |
| 5 | 7.214 |
| 6 | 7.157 |
| 7 | 7.116 |
| 8 | 12.523 |
| 9 | 12.962 |
| 10 | 14.074 |

## Production: hello Prometheus

`node dist/cli.js hello Prometheus`

| Run | Real (s) |
|-----|----------|
| 1 | 0.328 |
| 2 | 0.297 |
| 3 | 0.291 |
| 4 | 0.294 |
| 5 | 0.299 |
| 6 | 0.292 |
| 7 | 0.291 |
| 8 | 0.299 |
| 9 | 0.308 |
| 10 | 0.294 |

## Production: weather Gent

`node --env-file=.env dist/cli.js weather Gent`

| Run | Real (s) |
|-----|----------|
| 1 | 6.002 |
| 2 | 11.151 |
| 3 | 5.949 |
| 4 | 5.938 |
| 5 | 11.229 |
| 6 | 6.008 |
| 7 | 5.933 |
| 8 | 5.916 |
| 9 | 5.908 |
| 10 | 11.437 |

