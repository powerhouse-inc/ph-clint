# syntax=docker/dockerfile:1.7

# Build stage — install deps + run the build pipeline (skills + tsc).
FROM node:24-alpine AS build
WORKDIR /app

RUN apk add --no-cache git \
  && corepack enable

# Copy the workspace pieces we need. ph-clint examples reference the
# library via file: protocol — we need the package source available at
# install time. The actual deployment target is the example dir; we
# include the sibling library packages so pnpm can resolve them.
COPY ../../packages/ph-clint /app/packages/ph-clint
COPY ../../packages/ph-clint-dev /app/packages/ph-clint-dev
COPY package.json pnpm-lock.yaml* /app/examples/05-ph-rupert/
COPY . /app/examples/05-ph-rupert/

WORKDIR /app/examples/05-ph-rupert
RUN pnpm install --frozen-lockfile=false \
  && pnpm build

# Runtime stage — minimal image with just the built dist + node_modules.
FROM node:24-alpine AS runtime
WORKDIR /app

RUN corepack enable

COPY --from=build /app/packages/ph-clint /app/packages/ph-clint
COPY --from=build /app/packages/ph-clint-dev /app/packages/ph-clint-dev
COPY --from=build /app/examples/05-ph-rupert /app/examples/05-ph-rupert

WORKDIR /app/examples/05-ph-rupert

# Headless service mode: drop straight into agent prompt with no TTY.
# The triggers (inbox/WBS) drive work — the entrypoint just keeps the
# process alive while the routine loop polls.
ENV PH_NONINTERACTIVE=1
ENV NODE_ENV=production

# Health endpoint will live on this port once we add one.
EXPOSE 8080

# Run the CLI in routine mode — `--wait` keeps the routine loop alive
# without an interactive REPL. Override CMD if a different entry is
# desired (e.g. one-shot agent invocation for cron).
CMD ["node", "dist/main.js", "--wait"]
