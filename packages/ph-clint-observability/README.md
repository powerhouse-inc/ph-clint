# @powerhousedao/ph-clint-observability

OpenTelemetry + Sentry observability plugin for ph-clint CLIs.

## Install

```sh
pnpm add @powerhousedao/ph-clint-observability
```

Then in your CLI's `defineCli` call:

```ts
import { defineCli } from '@powerhousedao/ph-clint';
import { observability } from '@powerhousedao/ph-clint-observability';

defineCli({
  // ...
  lifecycle: [observability()],
});
```

## Configuration

Two env vars (auto-derived from the framework's `{CLINAME}_{FIELD_NAME}` convention):

- `{CLINAME}_SENTRY_DSN` — Sentry DSN. If unset, Sentry is not initialized.
- `{CLINAME}_OTEL_EXPORTER_OTLP_ENDPOINT` — OTLP HTTP base endpoint for traces and metrics. If unset, OTel is not initialized.

When neither is set, the plugin contributes identity wraps (zero overhead) and writes one log line on startup.

## Runtime opt-in

When at least one destination is configured, the plugin prompts the end-user on first run for telemetry consent. Consent is persisted to `~/.ph/<cliname>/observability-consent.json`. Non-interactive runs default to denied.

To revoke or re-prompt, delete or edit that file:

```jsonc
{ "consent": "denied", "promptedAt": "..." }
```

## Local development receiver

```sh
pnpm telemetry:dev
```

Runs a small OTLP + Sentry-envelope receiver on `127.0.0.1:4318` and announces the env vars to set so your CLI sends telemetry there. Three routes on one server:

- `POST /v1/traces` — OTLP traces (OTel)
- `POST /v1/metrics` — OTLP metrics (OTel)
- `POST /api/<projectId>/envelope/` — Sentry envelope (errors, transactions, sessions)

The receiver prints two env vars to export — one for OTel, one for Sentry — both pointing at the same local server. Incoming traces, metrics, and Sentry events are pretty-printed to stdout. Sentry envelope items are parsed and `event` / `transaction` payloads are decoded as JSON; other item types (attachments, sessions) show their type only.

## What's instrumented

- `framework.bootstrap` — retroactive span covering the pre-config boot window (using `LifecycleInitContext.bootTimings`).
- `command.execute` — span + `clint.command.executions` counter (result: success|error).
- `agent.stream` + child `llm.call` — span + token-usage attributes + `clint.agent.stream.duration` histogram.
- `tool.execute` — span + `clint.tool.executions` counter.
- `routine.iteration` — span + `clint.routine.iterations` counter.

No auto-instrumentation; no monkey-patching of Node stdlib. The framework's own seams provide all visibility.
