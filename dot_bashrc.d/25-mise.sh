# Activate the mise-managed global and per-project tool environments.
# Chezmoi's bootstrap installs the standalone binary in ~/.local/bin.
if [[ -x "$HOME/.local/bin/mise" ]]; then
    eval "$("$HOME/.local/bin/mise" activate bash)"
fi

# Manual tools take precedence over any stale mise shims.
path_prepend /opt/manual/VSCode-linux-x64/bin
path_prepend /opt/manual/sing-box
export PATH
