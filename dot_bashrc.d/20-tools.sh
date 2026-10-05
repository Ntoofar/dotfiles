# Optional tools. Missing installations must not make shell startup noisy.

if [[ -d /opt/jdk1.8.0_211 ]]; then
    export JAVA_HOME=/opt/jdk1.8.0_211
    [[ -d "$JAVA_HOME/jre" ]] && export JRE_HOME="$JAVA_HOME/jre"
    export CLASS_PATH=".:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tool.jar:$JAVA_HOME/lib"
    path_prepend "$JAVA_HOME/bin"
    [[ -n ${JRE_HOME:-} ]] && path_prepend "$JRE_HOME/bin"
    export PATH
fi
