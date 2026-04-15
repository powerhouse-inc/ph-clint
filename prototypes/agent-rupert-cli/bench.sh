#!/usr/bin/env bash
set -euo pipefail

RUNS=10
OUT="bench-results.md"

cat > "$OUT" <<'HEADER'
# CLI Benchmark Results

HEADER

printf "Running benchmarks (%d iterations each)…\n\n" "$RUNS"

run_bench() {
  local label="$1"
  shift
  local cmd=("$@")

  printf "| Run | Real (s) |\n|-----|----------|\n" >> "$OUT"

  for i in $(seq 1 "$RUNS"); do
    real=$( { TIMEFORMAT='%R'; time "${cmd[@]}" > /dev/null 2>&1; } 2>&1 )
    printf "| %d | %s |\n" "$i" "$real" >> "$OUT"
    printf "  %s run %d: %ss\n" "$label" "$i" "$real"
  done

  printf "\n" >> "$OUT"
}

echo "## Dev: hello Prometheus" >> "$OUT"
echo "" >> "$OUT"
printf "\`%s\`\n\n" "pnpm dev -- hello Prometheus" >> "$OUT"
run_bench "dev hello" pnpm dev -- hello Prometheus

echo "## Dev: weather Gent" >> "$OUT"
echo "" >> "$OUT"
printf "\`%s\`\n\n" "pnpm dev -- weather Gent" >> "$OUT"
run_bench "dev weather" pnpm dev -- weather Gent

echo "## Production: hello Prometheus" >> "$OUT"
echo "" >> "$OUT"
printf "\`%s\`\n\n" "node dist/cli.js hello Prometheus" >> "$OUT"
run_bench "prod hello" node dist/cli.js hello Prometheus

echo "## Production: weather Gent" >> "$OUT"
echo "" >> "$OUT"
printf "\`%s\`\n\n" "node --env-file=.env dist/cli.js weather Gent" >> "$OUT"
run_bench "prod weather" node --env-file=.env dist/cli.js weather Gent

printf "\nDone → %s\n" "$OUT"
