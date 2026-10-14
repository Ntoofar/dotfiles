# Optional tools. Missing installations must not make shell startup noisy.

if [[ -d /opt/jdk1.8.0_211 ]]; then
    export JAVA_HOME=/opt/jdk1.8.0_211
    [[ -d "$JAVA_HOME/jre" ]] && export JRE_HOME="$JAVA_HOME/jre"
    export CLASS_PATH=".:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tool.jar:$JAVA_HOME/lib"
    path_prepend "$JAVA_HOME/bin"
    [[ -n ${JRE_HOME:-} ]] && path_prepend "$JRE_HOME/bin"
    export PATH
fi

# tssh, logging "<time> <host>" to ~/.ssh/usage.log so idle hosts can be spotted
# later (tssh itself keeps no usage history). Defined unconditionally: mise puts
# tssh on PATH in a later fragment.
ts() {
    local a host="" skip=0
    for a in "$@"; do
        if (( skip )); then skip=0; continue; fi
        case "$a" in
            -[bcDEeFIiJLlmOoPpQRSWw]) skip=1 ;;
            -*) ;;
            *) host="$a"; break ;;
        esac
    done
    [[ -n "$host" ]] && printf '%s %s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$host" >> "$HOME/.ssh/usage.log"
    command tssh "$@"
}
