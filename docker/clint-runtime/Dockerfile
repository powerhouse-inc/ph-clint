# syntax=docker/dockerfile:1.7
#
# Generic clint runtime image.
#
# Installs an arbitrary clint-project package globally at startup, then
# exec's its service command. The image itself contains no clint code —
# everything is fetched at runtime from the configured registry, so a
# single image version serves every clint-project deployment in the
# fleet.
#
# Required runtime env (set by the platform / k8s manifest):
#   CLINT_PACKAGE         npm-style name, e.g. @powerhousedao/ph-rupert
#   CLINT_VERSION         version or dist-tag, e.g. 1.2.3 or dev
#   CLINT_REGISTRY        registry URL, e.g. https://registry.dev.vetra.io/
#   SERVICE_COMMAND       shell command to start the agent (from manifest;
#                         user override allowed)
#
# Optional runtime env (passed through to the agent):
#   SERVICE_ANNOUNCE_URL  set by the processor when the package's manifest
#                         declares serviceAnnouncement: true; the agent
#                         posts its endpoint inventory to this URL once
#                         running.
#
# Build:
#   docker build -t clint-runtime:dev docker/clint-runtime
#
# Run (manual smoke):
#   docker run --rm -it \
#     -e CLINT_PACKAGE=@powerhousedao/ph-rupert \
#     -e CLINT_VERSION=dev \
#     -e CLINT_REGISTRY=https://registry.dev.vetra.io/ \
#     -e SERVICE_COMMAND="ph-rupert --stand-alone --mode one-shot" \
#     clint-runtime:dev

FROM node:22-bookworm-slim

# git + curl for tooling many clints depend on (tarball fetches, repo
# bootstrapping); ca-certificates so HTTPS to the registry / announce
# URL works out of the box.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
       git \
       curl \
       ca-certificates \
       tini \
  && rm -rf /var/lib/apt/lists/*

# pnpm via corepack — pinned in the user's home so global installs land
# under HOME without needing root.
RUN corepack enable && corepack prepare pnpm@latest --activate

# Non-root runtime user.
RUN useradd -m -u 1001 -s /bin/bash clint
USER clint
WORKDIR /home/clint

ENV PNPM_HOME=/home/clint/.local/share/pnpm \
    PATH=/home/clint/.local/share/pnpm:$PATH \
    NODE_ENV=production

COPY --chown=clint:clint entrypoint.sh /home/clint/entrypoint.sh
RUN chmod +x /home/clint/entrypoint.sh

# tini handles PID 1 / signal forwarding so the agent gets SIGTERM
# cleanly when k8s tells the pod to stop.
ENTRYPOINT ["/usr/bin/tini", "--", "/home/clint/entrypoint.sh"]
