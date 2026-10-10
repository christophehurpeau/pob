#!/usr/bin/env sh

# Setup a freshly created git worktree: install dependencies and build
# workspace packages (some tools, like @pob/version, are imported from dist).

# exit on error
set -e

pnpm install --frozen-lockfile
pnpm run build
