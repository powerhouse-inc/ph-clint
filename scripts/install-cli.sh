#!/usr/bin/env bash
# install-cli.sh — Install @powerhousedao/ph-clint-cli globally.
#
# Handles pnpm 10 → 11 migration issues automatically:
#   - Detects and cleans stale pnpm v10 bin shims that shadow new installs
#   - Updates PATH for the current session
#   - Installs the CLI via npm (avoids pnpm 11's allowBuilds prompt)
#
# Usage:
#   bash scripts/install-cli.sh              # dry-run (default): show what would happen
#   bash scripts/install-cli.sh --run        # actually install and make changes
#   curl -fsSL <hosted-url> -o install-cli.sh && bash install-cli.sh  # one-liner (future)
#
# See: specs/issues/pnpm-11-global-install-allowBuilds-prompt.md

set -euo pipefail

PACKAGE="@powerhousedao/ph-clint-cli"
BIN_NAME="ph-clint"
DRY_RUN=true

# Platform-aware defaults
case "$(uname -s)" in
  Darwin*) DEFAULT_PNPM_HOME="$HOME/Library/pnpm"; SHELL_CONFIG="~/.zshrc" ;;
  *)       DEFAULT_PNPM_HOME="$HOME/.local/share/pnpm"; SHELL_CONFIG="~/.bashrc" ;;
esac

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --run) DRY_RUN=false ;;
    --help|-h)
      echo "Usage: bash $0 [--run]"
      echo ""
      echo "  By default, runs in dry-run mode (no changes)."
      echo "  --run      Actually install and make changes"
      echo "  --dry-run  Show what would happen (default)"
      exit 0
      ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# ── Output helpers ──

info()    { printf '  \033[1;34minfo\033[0m  %s\n' "$*"; }
warn()    { printf '  \033[1;33mwarn\033[0m  %s\n' "$*"; }
ok()      { printf '    \033[1;32mok\033[0m  %s\n' "$*"; }
err()     { printf ' \033[1;31merror\033[0m  %s\n' "$*" >&2; }
step()    { printf '\n\033[1m── %s ──\033[0m\n\n' "$*"; }
dry()     { printf '  \033[1;35m dry\033[0m  %s\n' "$*"; }

confirm() {
  if $DRY_RUN; then return 0; fi
  local prompt="$1"
  printf '\n  \033[1;33m?\033[0m %s [y/N] ' "$prompt"
  read -r answer
  case "$answer" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}

# ── 1. Prerequisites ──

step "Checking prerequisites"

if ! command -v node >/dev/null 2>&1; then
  err "Node.js is not installed."
  err "Install Node.js >= 22.13.0 from https://nodejs.org"
  exit 1
fi

NODE_VER=$(node --version)
info "Node.js $NODE_VER"

if ! command -v npm >/dev/null 2>&1; then
  err "npm is not available. It ships with Node.js — check your installation."
  exit 1
fi

NPM_VER=$(npm --version)
info "npm $NPM_VER"

NPM_GLOBAL_BIN="$(npm prefix -g)/bin"
info "npm global bin: $NPM_GLOBAL_BIN"

# ── 2. Detect pnpm version ──

step "Checking pnpm"

if command -v pnpm >/dev/null 2>&1; then
  PNPM_VER=$(pnpm --version 2>/dev/null || echo "unknown")
  PNPM_MAJOR=${PNPM_VER%%.*}
  info "pnpm $PNPM_VER"

  if [ "$PNPM_MAJOR" -lt 11 ] 2>/dev/null; then
    warn "pnpm $PNPM_VER is outdated. Version 11+ is required for ph-clint projects."
    echo ""
    warn "pnpm 11 introduced a new global store layout. Upgrading now will prevent"
    warn "issues when you scaffold a project and run 'pnpm install' inside it."

    # Determine the right upgrade command based on how pnpm was installed.
    # pnpm self-update only exists in 9.12+. Corepack-managed installs reject
    # self-update entirely. Fall back to npm install -g as the universal option.
    PNPM_UPGRADE_CMD=""
    PNPM_UPGRADE_NOTE=""
    if command -v corepack >/dev/null 2>&1 && corepack --version >/dev/null 2>&1; then
      # Check if pnpm is managed by corepack (lives inside the corepack shims dir)
      PNPM_PATH=$(command -v pnpm)
      if echo "$PNPM_PATH" | grep -q "corepack\|nvm.*bin/pnpm"; then
        PNPM_UPGRADE_CMD="corepack install --global pnpm@latest"
        PNPM_UPGRADE_NOTE="pnpm appears to be managed by corepack"
      fi
    fi
    if [ -z "$PNPM_UPGRADE_CMD" ]; then
      # pnpm self-update exists in 9.12+; parse minor version
      PNPM_MINOR=$(echo "$PNPM_VER" | cut -d. -f2)
      if [ "$PNPM_MAJOR" -gt 9 ] 2>/dev/null || { [ "$PNPM_MAJOR" -eq 9 ] && [ "$PNPM_MINOR" -ge 12 ]; } 2>/dev/null; then
        PNPM_UPGRADE_CMD="pnpm self-update"
      else
        PNPM_UPGRADE_CMD="npm install -g pnpm@latest"
        PNPM_UPGRADE_NOTE="pnpm self-update is not available before v9.12"
      fi
    fi

    if [ -n "$PNPM_UPGRADE_NOTE" ]; then
      info "$PNPM_UPGRADE_NOTE"
    fi
    info "Upgrade command: $PNPM_UPGRADE_CMD"

    if $DRY_RUN; then
      echo ""
      dry "Would run: $PNPM_UPGRADE_CMD"
      dry "Would run: pnpm setup"
    elif confirm "Upgrade pnpm to v11 and update shell config?"; then
      info "Running: $PNPM_UPGRADE_CMD"
      eval "$PNPM_UPGRADE_CMD" 2>&1 | tail -5
      PNPM_VER=$(pnpm --version 2>/dev/null || echo "unknown")
      ok "pnpm upgraded to $PNPM_VER"

      info "Running pnpm setup..."
      pnpm setup 2>&1 | tail -3
      ok "Shell config updated"
    else
      warn "Skipped. You'll need pnpm 11+ to work with scaffolded projects."
      warn "Upgrade later with: $PNPM_UPGRADE_CMD && pnpm setup"
    fi
  else
    ok "pnpm $PNPM_VER (v11+)"

    # Even on v11, pnpm setup may not have been run after the upgrade
    if [ ! -d "$DEFAULT_PNPM_HOME/bin" ]; then
      warn "pnpm v11 bin directory not found at $DEFAULT_PNPM_HOME/bin"
      warn "This usually means 'pnpm setup' was not run after upgrading."

      if $DRY_RUN; then
        dry "Would run: pnpm setup"
      elif confirm "Run 'pnpm setup' to configure the v11 layout?"; then
        pnpm setup 2>&1 | tail -3
        ok "Shell config updated"
      fi
    fi
  fi
else
  info "pnpm is not installed"
  info "You'll need pnpm 11+ to work with scaffolded projects."
  info "Install later: https://pnpm.io/installation"
fi

# ── 3. Detect and clean stale v10 shims ──

step "Checking for stale pnpm v10 shims"

PNPM_HOME="${PNPM_HOME:-$DEFAULT_PNPM_HOME}"
STALE_SHIMS=()

if [ -d "$PNPM_HOME" ]; then
  info "PNPM_HOME: $PNPM_HOME"

  # pnpm 10 put bin shims directly in $PNPM_HOME/.
  # pnpm 11 moved them to $PNPM_HOME/bin/.
  # Old shims shadow both new pnpm shims and npm global installs
  # if $PNPM_HOME (without /bin) is still in PATH.

  for f in "$PNPM_HOME"/*; do
    [ -f "$f" ] || continue
    name=$(basename "$f")

    # Keep pnpm's own bootstrapper and config files
    case "$name" in
      pnpm|pnpm.cmd|pnpm.ps1|pnpx|pnpx.cmd) continue ;;
      package.json|*.yaml|*.yml|*.lock) continue ;;
    esac

    # Check if it's a shell shim (v10 generated these as #!/bin/sh scripts)
    if head -1 "$f" 2>/dev/null | grep -q '^#!/bin/sh'; then
      STALE_SHIMS+=("$f")
    fi
  done

  if [ ${#STALE_SHIMS[@]} -gt 0 ]; then
    warn "Found ${#STALE_SHIMS[@]} stale pnpm v10 shim(s) in \$PNPM_HOME root."
    echo ""
    warn "When pnpm upgraded from v10 to v11, it moved global bin shims from"
    warn "  \$PNPM_HOME/         (v10 — old location)"
    warn "to"
    warn "  \$PNPM_HOME/bin/     (v11 — new location)"
    warn ""
    warn "But the old shims were not cleaned up. If \$PNPM_HOME is still in"
    warn "your PATH (e.g. from an older terminal session), these stale shims"
    warn "shadow any newly installed binaries — including npm global installs."
    echo ""
    info "Stale shims:"
    for f in "${STALE_SHIMS[@]}"; do
      # Extract the version from the shim's target path (e.g. @pkg@1.2.3)
      target=$(grep -oE '@[^@/]+@[0-9][^ "/$]*' "$f" 2>/dev/null | head -1 || true)
      printf '         %-20s %s\n' "$(basename "$f")" "${target:-(unversioned)}"
    done

    if $DRY_RUN; then
      echo ""
      dry "Would delete ${#STALE_SHIMS[@]} stale shim(s)"
    elif confirm "Delete these ${#STALE_SHIMS[@]} stale shims?"; then
      for f in "${STALE_SHIMS[@]}"; do
        rm "$f"
      done
      ok "Removed ${#STALE_SHIMS[@]} stale shim(s)"
    else
      warn "Skipped. Stale shims may shadow the new install."
      warn "You can re-run this script later to clean them up."
    fi
  else
    ok "No stale v10 shims found"
  fi

  # Check if the old v10 global store still has packages
  if [ -d "$PNPM_HOME/global/5" ]; then
    V10_PKGS=$(cat "$PNPM_HOME/global/5/package.json" 2>/dev/null | grep -c '"@\|"ph-' || echo 0)
    if [ "$V10_PKGS" -gt 0 ]; then
      echo ""
      warn "Old pnpm v10 global store still has packages at:"
      warn "  $PNPM_HOME/global/5/"
      info "These are no longer used by pnpm v11. You can review and"
      info "remove this directory manually to reclaim disk space."
    fi
  fi
else
  ok "No pnpm installation found (nothing to clean)"
fi

# ── 4. Update PATH for this session ──

step "Updating PATH"

PATH_UPDATED=false

# Ensure npm global bin is in PATH
case ":$PATH:" in
  *":$NPM_GLOBAL_BIN:"*) ok "npm global bin already in PATH" ;;
  *)
    info "Adding $NPM_GLOBAL_BIN to PATH for this session"
    export PATH="$NPM_GLOBAL_BIN:$PATH"
    PATH_UPDATED=true
    ;;
esac

# Ensure pnpm v11 bin is in PATH (and takes precedence if user also uses pnpm)
if [ -d "$PNPM_HOME/bin" ]; then
  case ":$PATH:" in
    *":$PNPM_HOME/bin:"*) ok "pnpm v11 bin already in PATH" ;;
    *)
      info "Adding $PNPM_HOME/bin to PATH for this session"
      export PATH="$PNPM_HOME/bin:$PATH"
      PATH_UPDATED=true
      ;;
  esac
fi

# ── 5. Install ──

step "Installing $PACKAGE"

info "Using npm to install globally (avoids pnpm 11 allowBuilds prompt)"

EXISTING_VER=""
if command -v "$BIN_NAME" >/dev/null 2>&1; then
  EXISTING_VER=$("$BIN_NAME" --version 2>&1 | head -1 || echo "unknown")
  info "Currently installed: $BIN_NAME $EXISTING_VER"
fi

if $DRY_RUN; then
  dry "Would run: npm install -g $PACKAGE"
else
  echo ""
  npm install -g "$PACKAGE"
  echo ""
  ok "npm install completed"
fi

# ── 6. Verify ──

step "Verifying installation"

if $DRY_RUN; then
  dry "Would verify $BIN_NAME binary and version"
  dry "Would run: $BIN_NAME --help"
else
  # Check binary exists and resolves to the right location
  if ! command -v "$BIN_NAME" >/dev/null 2>&1; then
    err "$BIN_NAME not found in PATH after install"
    err ""
    err "This usually means your shell PATH doesn't include npm's global bin."
    err "Add this to your shell config ($SHELL_CONFIG):"
    err "  export PATH=\"$NPM_GLOBAL_BIN:\$PATH\""
    err "Then restart your terminal."
    exit 1
  fi

  BIN_PATH=$(command -v "$BIN_NAME")
  info "Binary location: $BIN_PATH"

  # Warn if the binary resolves to a pnpm location (stale shim still winning)
  case "$BIN_PATH" in
    */.local/share/pnpm/"$BIN_NAME")
      warn "Binary still resolves to a pnpm v10 shim!"
      warn "Close this terminal and open a new one, then run:"
      warn "  $BIN_NAME --version"
      ;;
    */.local/share/pnpm/bin/"$BIN_NAME")
      info "Resolves to pnpm v11 bin (ok)"
      ;;
    *)
      info "Resolves to npm global bin (ok)"
      ;;
  esac

  # Check version
  INSTALLED_VER=$("$BIN_NAME" --version 2>&1 | head -1 || echo "")
  if [ -n "$INSTALLED_VER" ]; then
    ok "$BIN_NAME $INSTALLED_VER"
  else
    warn "Could not determine version. Try: $BIN_NAME --version"
  fi

  # Quick smoke test
  if "$BIN_NAME" --help >/dev/null 2>&1; then
    ok "$BIN_NAME --help works"
  else
    warn "$BIN_NAME --help returned an error"
  fi
fi

# ── Done ──

step "Done"

if $DRY_RUN; then
  info "Dry run complete. No changes were made."
  info "If everything looks good, run the install for real:"
  echo ""
  info "  bash $0 --run"
else
  ok "$BIN_NAME is installed and working."
  echo ""
  info "Get started:"
  info "  $BIN_NAME --help              Show available commands"
  info "  $BIN_NAME init my-project     Scaffold a new project"
  echo ""
  if $PATH_UPDATED; then
    warn "PATH was updated for this session only."
    warn "If $BIN_NAME is not found in a new terminal, add this to"
    warn "your shell config ($SHELL_CONFIG):"
    warn "  export PATH=\"$NPM_GLOBAL_BIN:\$PATH\""
  fi
fi
