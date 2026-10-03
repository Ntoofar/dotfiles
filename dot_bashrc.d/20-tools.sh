# Optional tools. Missing installations must not make shell startup noisy.

for go_root in /opt/manual/go /usr/local/go; do
    if [[ -x "$go_root/bin/go" ]]; then
        export GOROOT="$go_root"
        path_prepend "$GOROOT/bin"
        break
    fi
done
unset go_root

export GOPATH="${GOPATH:-$HOME/.local/share/go}"
path_prepend "$GOPATH/bin"

for tool_bin in \
    /opt/manual/uv/bin \
    /opt/manual/node/bin \
    /opt/manual/k8s/bin \
    /opt/manual/VSCode-linux-x64/bin \
    /opt/manual/zed.app/bin \
    /opt/rust-1.74.1/usr/local/bin \
    /opt/apache-maven-3.6.3/bin \
    /opt/scala-2.11.12/bin; do
    path_prepend "$tool_bin"
done
unset tool_bin

path_append /opt/manual/openresty/nginx/sbin
export PATH

if [[ -d /opt/jdk1.8.0_211 ]]; then
    export JAVA_HOME=/opt/jdk1.8.0_211
    [[ -d "$JAVA_HOME/jre" ]] && export JRE_HOME="$JAVA_HOME/jre"
    path_prepend "$JAVA_HOME/bin"
    [[ -n ${JRE_HOME:-} ]] && path_prepend "$JRE_HOME/bin"
    export PATH
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
