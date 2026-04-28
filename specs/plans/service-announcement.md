# Service Announcement — Manifest & Framework

## Status

- Phase 1 (Document Model): DONE
- Phase 2 (Editor): DONE
- Phase 3 (Spec Types & Manifest Codegen): DONE
- Phase 4 (Framework ServiceAnnouncer): DONE
- Phase 5 (Integration & Verification): DONE — all builds pass, coverage below threshold (deferred)

---

## Phase 3: Spec Types & Codegen — Manifest File

### 3a. Extend `ClintProjectSpec` (STARTED)

File: `packages/ph-clint-cli/ph-clint-cli/src/spec/types.ts`

Already done:
- Added `agentDescription: z.string().nullable().default(null)` to `mastraFeatureSchema`
- Added `agentImage: z.string().nullable().default(null)` to `mastraFeatureSchema`

Still needed:
- Add `deployment` section to `clintProjectSpecSchema`:
```ts
deployment: z.object({
  serviceAnnouncement: z.boolean().default(false),
  supportedResources: z.array(z.string()).default([]),
}).default({ serviceAnnouncement: false, supportedResources: [] }),
```
- Update `DEFAULT_MASTRA` to include the two new null fields.

### 3b. Update `specFromDocumentState`

File: `packages/ph-clint-cli/ph-clint-cli/src/spec/from-document.ts`

Map new state fields into the spec object passed to `clintProjectSpecSchema.safeParse()`:
- `agentDescription` and `agentImage` are already inside `{ ...state.features.mastra }` spread — they'll flow through automatically since the spread copies all fields.
- Add `deployment` mapping:
```ts
deployment: {
  serviceAnnouncement: state.deployment.serviceAnnouncement,
  supportedResources: [...state.deployment.supportedResources],
},
```

### 3c. Create manifest builder

New file: `packages/ph-clint-cli/ph-clint-cli/src/codegen/builders/manifest-json.ts`

```ts
export function buildManifestJson(spec: ClintProjectSpec): string
```

Output structure (`powerhouse.manifest.json`):
```json
{
  "type": "clint-project",
  "features": {
    "agent": {
      "id": "<agentId>",
      "name": "<agentName>",
      "description": "<agentDescription>",
      "image": "<agentImage>",
      "models": [{ "id": "...", "default": true }]
    },
    "powerhouse": {
      "support": "Reactor|Switchboard|Connect",
      "package": "@scope/name-app"
    }
  },
  "serviceCommand": "<bin name>",
  "serviceAnnouncement": true,
  "supportedResources": ["vetra-agent-s", ...]
}
```

Rules:
- `features.agent` = `false` if `!mastra.enabled`; otherwise populate from spec fields
- `features.powerhouse` = `false` if powerhouse is `Disabled`; otherwise `support` = the level, `package` = `getAppPackageName(spec)`
- `serviceCommand` = `getBinName(spec)`
- `serviceAnnouncement` = `spec.deployment.serviceAnnouncement`
- `supportedResources` = `spec.deployment.supportedResources`
- Models map: `{ id: m.id, default: m.isDefault }`
- Return `JSON.stringify(manifest, null, 2) + '\n'`

### 3d. Register manifest builder

File: `packages/ph-clint-cli/ph-clint-cli/src/codegen/builders/index.ts`

Add to `CLI_FILE_BUILDERS` array:
```ts
{ relativePath: 'powerhouse.manifest.json', build: buildManifestJson },
```

Add import:
```ts
import { buildManifestJson } from './manifest-json.js';
```

Add to re-exports at bottom.

For split layout: manifest sits next to `package.json` in the CLI folder.
For flat layout: at project root (same as other CLI builders).

### 3e. Tests

New file: `packages/ph-clint-cli/ph-clint-cli/tests/codegen/manifest-json.test.ts`

Test cases:
1. **Mastra disabled** — `features.agent` is `false`
2. **Mastra enabled with full config** — agent section populated with id, name, description, image, models
3. **Powerhouse Disabled** — `features.powerhouse` is `false`
4. **Powerhouse at each level** (Reactor, Switchboard, Connect) — correct `support` value and `package` name
5. **serviceCommand** — uses `getBinName(spec)` (custom bin vs default name)
6. **supportedResources** — pass-through from spec
7. **serviceAnnouncement** — boolean pass-through
8. **Null agent fields** — `agentDescription` and `agentImage` can be null

Pattern: use `clintProjectSpecSchema.parse({ name: 'foo', ... })` to build spec, call `buildManifestJson(spec)`, parse result as JSON, assert on structure.

### 3f. Update `buildCliTs` for serviceAnnouncement

File: `packages/ph-clint-cli/ph-clint-cli/src/codegen/builders/cli-ts.ts`

When `spec.deployment.serviceAnnouncement` is true, emit `serviceAnnouncement: { enabled: true },` inside the `defineCli()` call. Place it after the `prompts` block, inside a new marker region or inline.

Implementation detail: add after the `events` marker block:
```ts
// Inside defineCli({...}):
serviceAnnouncement: { enabled: true },
```

Only emit when `spec.deployment.serviceAnnouncement === true`.

---

## Phase 4: Service Announcement in ph-clint Framework

### 4a. Add `serviceAnnouncement` option to `CliOptions`

File: `packages/ph-clint/src/core/types.ts`

Add to `CliOptions<TSchema, TSecrets>`:
```ts
serviceAnnouncement?: {
  enabled: boolean;
  excludePowerhouseServices?: string[];  // e.g. ['agent-switchboard-graphql']
  excludeCliServices?: string[];         // e.g. ['fusion-project']
};
```

### 4b. Auto-inject config fields

File: `packages/ph-clint/src/core/cli.ts`

When `serviceAnnouncement.enabled` is true, auto-inject two config fields into the config schema (same pattern as existing agent config injection):
- `serviceAnnounceUrl: z.string().url().optional()` — POST target URL
- `serviceAnnounceToken: z.string().optional()` — Bearer token

These create env vars like `MY_CLI_SERVICE_ANNOUNCE_URL` and `MY_CLI_SERVICE_ANNOUNCE_TOKEN`.

### 4c. Create `ServiceAnnouncer` module

New file: `packages/ph-clint/src/core/service-announcer.ts`

#### Types

```ts
interface AnnouncementPayload {
  node: {
    hostname: string;       // os.hostname()
    type: 'clint';
    clintId: string;        // cli name
  };
  services: AnnouncedService[];
  reportedAt: string;       // ISO 8601
}

interface AnnouncedService {
  id: string;       // e.g. 'service-reactor-project-graphql-api'
  name: string;     // shared name across instances
  type: 'api-graphql' | 'api-mcp' | 'website';
  url: string;
  port: string;
  status: string;   // 'starting' | 'ready' | 'failed' | 'stopped' | 'disabled'
}
```

#### Service extraction logic

1. **From service definitions' readiness capture groups**:
   For each service definition, inspect `readiness.patterns[].captures` (or single `readiness.captures`). For each capture with `type` in `['website', 'api-graphql', 'api-mcp']`:
   - `id`: `service-{serviceId}-{captureName}[-{instanceSuffix}]`
   - `name`: `service-{serviceId}-{captureName}`
   - `type`: from the capture's `type` field
   - `url`: captured value from running instance's `endpoints` record
   - `port`: extracted from URL (`new URL(url).port || (protocol === 'https:' ? '443' : '80')`)
   - `status`: from the service instance status

2. **Powerhouse built-in services** (when powerhouse >= Switchboard and not excluded):
   - `agent-switchboard-graphql` (api-graphql)
   - `agent-switchboard-mcp` (api-mcp)
   - When >= Connect: `agent-studio` (website)
   - URLs from reactor config / service endpoints

3. **Filtering**: skip services listed in `excludePowerhouseServices` or `excludeCliServices`

4. **URL validation**: `new URL(url)` — if invalid, log warning and skip

#### When to announce

- After CLI bootstrap completes (initial announcement with current state)
- On every `service:ready`, `service:failed`, `service:stopped` event (status change)
- Debounced: 2s window to batch rapid status changes

#### HTTP call

- `POST` to `serviceAnnounceUrl` with JSON body
- If `serviceAnnounceToken` set: `Authorization: Bearer ${token}`
- On failure: log warning, don't throw. Retry once after 5s. No retry storm.
- If URL not configured but feature enabled: log info at startup: `"Service announcement enabled but no URL configured — skipping announcements"`

#### Constructor / API

```ts
interface ServiceAnnouncerOptions {
  cliName: string;
  url: string | undefined;
  token: string | undefined;
  serviceDefinitions: ServiceDefinition[];
  serviceManager: ServiceManager;
  excludePowerhouseServices?: string[];
  excludeCliServices?: string[];
  logger: Logger;
  // For Powerhouse built-ins
  reactorConfig?: { switchboard?: { enabled: boolean }; connect?: { enabled: boolean } };
  powerhouseEndpoints?: Record<string, string>;
}

class ServiceAnnouncer {
  constructor(opts: ServiceAnnouncerOptions);
  announce(): Promise<void>;  // build payload + POST
  scheduleAnnounce(): void;   // debounced version
  dispose(): void;            // clear timers
}
```

### 4d. Wire into CLI bootstrap

File: `packages/ph-clint/src/core/cli.ts`

After `bootstrap()` completes (in the startup sequence area):
1. If `serviceAnnouncement.enabled` and `config.serviceAnnounceUrl` is set:
   - Create `ServiceAnnouncer` instance
   - Do initial announcement
2. Subscribe to service lifecycle events on the event bus:
   - `service:ready` → `announcer.scheduleAnnounce()`
   - `service:failed` → `announcer.scheduleAnnounce()`
   - `service:stopped` → `announcer.scheduleAnnounce()`
3. On REPL exit / CLI shutdown: `announcer.dispose()`

If URL not configured: log info line, skip announcer creation.

### 4e. Tests

File: `packages/ph-clint/tests/service-announcer.test.ts`

Unit tests:
1. **Payload construction** — correct `node`, `services`, `reportedAt` structure
2. **Service extraction from readiness captures** — maps captures with announceable types correctly
3. **URL validation** — invalid URLs logged and skipped
4. **Port extraction** — explicit port, default 80, default 443
5. **Filtering** — `excludePowerhouseServices` and `excludeCliServices` applied
6. **Debounce** — multiple rapid calls result in single HTTP POST
7. **HTTP failure** — logs warning, retries once after 5s, no throw
8. **No URL configured** — no HTTP calls made, info logged

Integration test:
- Mock HTTP endpoint (use `http.createServer`), verify announcement arrives on service status change

### 4f. Exports

File: `packages/ph-clint/src/index.ts` — export `ServiceAnnouncer` type (not the class itself, framework-internal).

---

## Phase 5: Integration & Verification

### 5a. Build & install chain
1. `pnpm build` in `packages/ph-clint/`
2. `pnpm build` in `packages/ph-clint-cli/ph-clint-app/`
3. `pnpm build` in `packages/ph-clint-cli/ph-clint-cli/`
4. `pnpm install` in `examples/05-ph-rupert/` (picks up new dist files)

### 5b. Verify codegen
- Run codegen on example 05 spec -> confirm `powerhouse.manifest.json` is generated with correct structure

### 5c. Run tests
- `pnpm test` in `packages/ph-clint/`
- `pnpm test` in `packages/ph-clint-cli/ph-clint-app/`
- `pnpm test` in `packages/ph-clint-cli/ph-clint-cli/`

---

## Key files

### Phase 3
- `packages/ph-clint-cli/ph-clint-cli/src/spec/types.ts` (STARTED)
- `packages/ph-clint-cli/ph-clint-cli/src/spec/from-document.ts`
- `packages/ph-clint-cli/ph-clint-cli/src/codegen/builders/manifest-json.ts` (NEW)
- `packages/ph-clint-cli/ph-clint-cli/src/codegen/builders/index.ts`
- `packages/ph-clint-cli/ph-clint-cli/src/codegen/builders/cli-ts.ts`
- `packages/ph-clint-cli/ph-clint-cli/tests/codegen/manifest-json.test.ts` (NEW)

### Phase 4
- `packages/ph-clint/src/core/types.ts`
- `packages/ph-clint/src/core/cli.ts`
- `packages/ph-clint/src/core/service-announcer.ts` (NEW)
- `packages/ph-clint/tests/service-announcer.test.ts` (NEW)
