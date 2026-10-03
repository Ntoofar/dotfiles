# Optional tools. Missing installations must not make shell startup noisy.

[[ -d /opt/manual/k8s ]] && export K8S_HOME=/opt/manual/k8s
[[ -d /opt/manual/zed.app ]] && export ZED_HOME=/opt/manual/zed.app
[[ -d /opt/apache-maven-3.6.3 ]] && export M2_HOME=/opt/apache-maven-3.6.3
[[ -d /opt/scala-2.11.12 ]] && export SCALA_HOME=/opt/scala-2.11.12
[[ -d /opt/manual/openresty ]] && export OPENRESTY_HOME=/opt/manual/openresty

for tool_bin in \
    /opt/manual/k8s/bin \
    /opt/manual/zed.app/bin \
    /opt/rust-1.74.1/usr/local/bin \
    /opt/apache-maven-3.6.3/bin \
    /opt/scala-2.11.12/bin; do
    path_append "$tool_bin"
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
