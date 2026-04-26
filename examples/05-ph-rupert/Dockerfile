# syntax=docker/dockerfile:1.7
#
# Build context = ph-clint repo root (so this Dockerfile can see the
# library packages that examples/05-ph-rupert references via file:).
#
# Build with:
#   docker build -f examples/05-ph-rupert/Dockerfile -t rupert:dev .
#
# Note: ph-clint is intentionally NOT a pnpm workspace (per its
# CLAUDE.md). Each package has its own node_modules. We install +
# build the framework packages first, then the example.

# ── Build stage ─────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

RUN apk add --no-cache git \
  && corepack enable

# Copy + build ph-clint-dev (built tools used by ph-clint).
COPY packages/ph-clint-dev packages/ph-clint-dev
RUN cd packages/ph-clint-dev \
  && pnpm install --frozen-lockfile=false \
  && pnpm build

# Copy + build ph-clint (the library).
COPY packages/ph-clint packages/ph-clint
RUN cd packages/ph-clint \
  && pnpm install --frozen-lockfile=false \
  && pnpm build

# Copy + build the example. Its `file:` deps resolve via pnpm's symlink
# to the locally built packages above.
COPY examples/05-ph-rupert examples/05-ph-rupert
RUN cd examples/05-ph-rupert \
  && pnpm install --frozen-lockfile=false \
  && pnpm build

# ── Runtime stage ───────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app

RUN corepack enable

# Ship the entire built tree — the example's pnpm-installed symlinks
# point into the sibling library packages, so we need them all present.
COPY --from=build /app /app

WORKDIR /app/examples/05-ph-rupert

ENV PH_NONINTERACTIVE=1
ENV NODE_ENV=production

EXPOSE 8080

# Run the CLI in routine mode — `--wait` keeps the routine loop alive
# without an interactive REPL.
CMD ["node", "dist/main.js", "--wait"]
