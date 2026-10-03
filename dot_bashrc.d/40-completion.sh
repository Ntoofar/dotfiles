if [[ -r /usr/share/bash-completion/bash_completion ]]; then
    source /usr/share/bash-completion/bash_completion
fi

if command -v uv >/dev/null 2>&1; then
    eval "$(uv generate-shell-completion bash)"
fi

if command -v uvx >/dev/null 2>&1; then
    eval "$(uvx --generate-shell-completion bash)"
fi

if command -v starship >/dev/null 2>&1; then
    eval "$(starship init bash)"
fi
