# Optional tools. Missing installations must not make shell startup noisy.

for go_root in /opt/manual/go /usr/local/go; do
    if [[ -x "$go_root/bin/go" ]]; then
        export GOROOT="$go_root"
        path_prepend "$GOROOT/bin"
        break
    fi
done
unset go_root

export GOPATH="${GOPATH:-$HOME/.go}"
export GOPROXY="${GOPROXY:-https://goproxy.cn,direct}"
path_prepend "$GOPATH/bin"

[[ -d /opt/manual/uv ]] && export UV_HOME=/opt/manual/uv
[[ -d /opt/manual/node ]] && export NODE_HOME=/opt/manual/node
[[ -d /opt/manual/k8s ]] && export K8S_HOME=/opt/manual/k8s
[[ -d /opt/manual/VSCode-linux-x64 ]] && export VSCODE_HOME=/opt/manual/VSCode-linux-x64
[[ -d /opt/manual/zed.app ]] && export ZED_HOME=/opt/manual/zed.app
[[ -d /opt/apache-maven-3.6.3 ]] && export M2_HOME=/opt/apache-maven-3.6.3
[[ -d /opt/scala-2.11.12 ]] && export SCALA_HOME=/opt/scala-2.11.12
[[ -d /opt/manual/openresty ]] && export OPENRESTY_HOME=/opt/manual/openresty

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
    export CLASS_PATH=".:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tool.jar:$JAVA_HOME/lib"
    path_prepend "$JAVA_HOME/bin"
    [[ -n ${JRE_HOME:-} ]] && path_prepend "$JRE_HOME/bin"
    export PATH
fi

if command -v uv >/dev/null 2>&1; then
    export UV_DEFAULT_INDEX="${UV_DEFAULT_INDEX:-https://mirrors.aliyun.com/pypi/simple/}"
    eval "$(uv generate-shell-completion bash)"
fi

if command -v uvx >/dev/null 2>&1; then
    eval "$(uvx --generate-shell-completion bash)"
fi

if command -v starship >/dev/null 2>&1; then
    eval "$(starship init bash)"
fi
