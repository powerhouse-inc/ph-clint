# CLI Benchmark Results

## Dev: hello Prometheus

`pnpm dev -- hello Prometheus`

| Run | Real (s) |
|-----|----------|
| 1 | 2.023 |
| 2 | 2.137 |
| 3 | 1.934 |
| 4 | 1.922 |
| 5 | 1.947 |
| 6 | 1.992 |
| 7 | 1.957 |
| 8 | 1.985 |
| 9 | 1.976 |
| 10 | 2.050 |

## Dev: weather Gent

`pnpm dev -- weather Gent`

| Run | Real (s) |
|-----|----------|
| 1 | 7.219 |
| 2 | 7.082 |
| 3 | 7.113 |
| 4 | 7.096 |
| 5 | 7.351 |
| 6 | 14.703 |
| 7 | 7.223 |
| 8 | 7.143 |
| 9 | 7.268 |
| 10 | 7.100 |

## Production: hello Prometheus

`node dist/cli.js hello Prometheus`

| Run | Real (s) |
|-----|----------|
| 1 | 0.809 |
| 2 | 0.809 |
| 3 | 0.832 |
| 4 | 0.819 |
| 5 | 0.816 |
| 6 | 0.812 |
| 7 | 0.835 |
| 8 | 0.814 |
| 9 | 0.815 |
| 10 | 0.804 |

## Production: weather Gent

`node --env-file=.env dist/cli.js weather Gent`

| Run | Real (s) |
|-----|----------|
| 1 | 5.899 |
| 2 | 5.943 |
| 3 | 5.915 |
| 4 | 5.908 |
| 5 | 5.892 |
| 6 | 5.897 |
| 7 | 5.900 |
| 8 | 5.927 |
| 9 | 6.015 |
| 10 | 5.941 |

