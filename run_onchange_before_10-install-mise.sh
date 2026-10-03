#!/bin/sh
set -eu

mise_version=2026.9.17
mise_bin="$HOME/.local/bin/mise"

if [ -x "$mise_bin" ] && "$mise_bin" --version 2>/dev/null | grep -q "^$mise_version "; then
    exit 0
fi

if ! command -v curl >/dev/null 2>&1; then
    printf '%s\n' 'curl is required to install mise' >&2
    exit 1
fi

install_script=$(mktemp "${TMPDIR:-/tmp}/mise-install.XXXXXX")
trap 'rm -f "$install_script"' EXIT HUP INT TERM

curl --proto '=https' --tlsv1.2 -fsSL https://mise.run -o "$install_script"
mkdir -p "$(dirname "$mise_bin")"
MISE_VERSION="$mise_version" MISE_INSTALL_PATH="$mise_bin" sh "$install_script"

installed_version=$("$mise_bin" --version | awk '{print $1}')
if [ "$installed_version" != "$mise_version" ]; then
    printf 'expected mise %s, installed %s\n' "$mise_version" "$installed_version" >&2
    exit 1
fi
