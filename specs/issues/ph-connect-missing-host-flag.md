# `ph connect` missing `--host` flag

## Problem

`ph connect` (backed by Vite's dev server) supports `--port` but not `--host`. The hostname/IP binding is not configurable — it always binds to localhost.

Vite itself supports `--host` (e.g. `--host 0.0.0.0` to expose on all interfaces, or a specific IP). The `ph connect` command should pass this through.

## Current behavior

```
ph connect --port 3000 --host 0.0.0.0
# error: found 1 error
#   connect studio --port 3000 --host 0.0.0.0
#                                     ^ Unknown arguments
```

## Expected

```
ph connect --port 3000 --host 0.0.0.0
#   ➜  Local:   http://localhost:3000/
#   ➜  Network: http://192.168.1.5:3000/
```

## Use case

CLI tools that start Connect as a managed child process (via ph-clint's ServiceManager) need to control the bind address — for example to expose Connect on a LAN for mobile testing, or to bind to a specific interface in multi-homed environments.

ph-clint's `SwitchboardConfig` already has a `host` field for this purpose. `ConnectConfig` is ready to add one once `ph connect` supports it.

## Workaround

None — Connect always binds to localhost. The only option is to use a reverse proxy.
