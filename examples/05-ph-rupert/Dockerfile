# syntax=docker/dockerfile:1.7
#
# Build context = ph-clint repo root (so this Dockerfile can see the
# library packages that examples/05-ph-rupert references via file:).
#
# Build with:
#   docker build -f examples/05-ph-rupert/Dockerfile -t rupert:dev .

# ── Build stage ─────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

RUN apk add --no-cache git \
  && corepack enable

# Copy package manifests first so dependency installs can be cached
# independently of source changes.
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY packages/ph-clint/package.json packages/ph-clint/
COPY packages/ph-clint-dev/package.json packages/ph-clint-dev/
COPY examples/05-ph-rupert/package.json examples/05-ph-rupert/

# Now copy sources and run the build.
COPY packages/ph-clint packages/ph-clint
COPY packages/ph-clint-dev packages/ph-clint-dev
COPY examples/05-ph-rupert examples/05-ph-rupert

# Build the framework first, then the example.
RUN pnpm install --frozen-lockfile=false \
  && pnpm --filter @powerhousedao/ph-clint-dev build \
  && pnpm --filter @powerhousedao/ph-clint build \
  && pnpm --filter @powerhousedao/ph-rupert-cli build

# ── Runtime stage ───────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app

RUN corepack enable

# Copy the built workspace. The example references the library packages
# via file:; pnpm symlinks them — we ship the whole tree so symlinks
# resolve at runtime.
COPY --from=build /app /app

WORKDIR /app/examples/05-ph-rupert

# Headless service mode — the routine loop drives work via inbox + WBS
# triggers without prompting for a TTY.
ENV PH_NONINTERACTIVE=1
ENV NODE_ENV=production

# Health endpoint will live on this port once we add one.
EXPOSE 8080

# Run the CLI in routine mode — `--wait` keeps the routine loop alive
# without an interactive REPL. Override CMD if a different entry is
# desired (e.g. one-shot agent invocation for cron).
CMD ["node", "dist/main.js", "--wait"]
