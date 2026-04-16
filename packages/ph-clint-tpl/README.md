# ph-clint-tpl

Source template tree consumed by `ph-clint-cli` to scaffold and maintain ph-clint
implementation projects.

Two sibling sub-folders, mirroring the final split layout so a generator never
has to rename folders:

- [`cli/`](./cli) — the ph-clint CLI side (package name `ph-clint-tpl-cli`,
  private). Every optional feature is present but togglable via
  `@clint:begin` / `@clint:end` comment markers that `ts-morph` can
  locate and rewrite.
- [`app/`](./app) — the optional Powerhouse reactor-package side. Starts
  near-empty; at generation time, `ph init` is run inside the user project's
  `{name}-app/` to materialize the standard Powerhouse layout, and any files
  in `app/patches/` are layered on top.

Neither package is published. `cli/` is typechecked as a regular package so
the templates it contains stay valid TypeScript even before the generator
rewrites them.

## Feature toggles

The `cli/` template covers three independently togglable features:

| Toggle       | Effect                                                                 |
|--------------|------------------------------------------------------------------------|
| `powerhouse` | Enables Reactor / Switchboard / Connect. Flips the layout from flat to split (`{name}-cli/` + `{name}-app/`) on first enablement. |
| `mastra`     | Enables the Mastra AI agent stack (agent, memory, Studio entry).       |
| `routine`    | Enables the tick-based routine loop and triggers.                      |

See [`cli/README.md`](./cli/README.md) for details on what each toggle adds
and where the codegen anchors live.
