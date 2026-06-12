# syntax=docker/dockerfile:1.7
#
# Per-agent prebuilt image. Built by the in-cluster clint-image-builder on
# every clint-project publish. Bakes the agent package + its full dependency
# tree at BUILD time so pod start is pull + exec (no pnpm add). Inherits the
# non-installing run.sh entrypoint from the base.
#
# Build args (set by the Kaniko Job from the registry publish event):
#   CLINT_PACKAGE   e.g. @powerhousedao/ph-pirate-cli
#   CLINT_VERSION   e.g. 0.0.1-dev.1
#   CLINT_REGISTRY  e.g. https://registry.dev.vetra.io
#   BASE_IMAGE      the published clint-runtime base, e.g.
#                   cr.vetra.io/powerhouse-inc-powerhouse/clint-runtime:dev
#
# Build (local smoke):
#   docker build -t clint-agent:local \
#     --build-arg BASE_IMAGE=clint-runtime:local \
#     --build-arg CLINT_PACKAGE=@powerhousedao/ph-pirate-cli \
#     --build-arg CLINT_VERSION=latest \
#     --build-arg CLINT_REGISTRY=https://registry.dev.vetra.io \
#     docker/clint-agent

ARG BASE_IMAGE=cr.vetra.io/powerhouse-inc-powerhouse/clint-runtime:dev
FROM ${BASE_IMAGE}

ARG CLINT_PACKAGE
ARG CLINT_VERSION
ARG CLINT_REGISTRY=https://registry.dev.vetra.io

# Fail the build early if the required args are missing.
RUN test -n "${CLINT_PACKAGE}" || (echo "CLINT_PACKAGE build-arg is required" >&2; exit 1) \
 && test -n "${CLINT_VERSION}" || (echo "CLINT_VERSION build-arg is required" >&2; exit 1)

# --config.blockExoticSubdeps=false: pnpm 11 blocks URL-resolved subdeps by
#   default; agent closures hit this via viem@>=2.51 -> ox (resolved via url).
#   vetra-cli pins viem@2.49.0 through pnpm-workspace.yaml `overrides`, but
#   workspace overrides do NOT apply to a global `pnpm add -g`, so we relax the
#   block here instead. Note: this global install also does not honor
#   `allowBuilds`, so native postinstall scripts are skipped — same behavior as
#   the legacy entrypoint, no regression. Revisit if an agent needs native builds.
RUN pnpm add -g "${CLINT_PACKAGE}@${CLINT_VERSION}" \
      --registry "${CLINT_REGISTRY}" \
      --config.blockExoticSubdeps=false
      --config.minimumReleaseAge=0

# Record what was baked, for debuggability / dedup sanity.
LABEL io.vetra.clint.package="${CLINT_PACKAGE}" \
      io.vetra.clint.version="${CLINT_VERSION}"

# Entrypoint (run.sh) and tini are inherited from the base image.
