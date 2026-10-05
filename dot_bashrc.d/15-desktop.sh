# Desktop launchers retained from the previous machine configuration. Each
# launcher is safe to define on every host and reports a useful error when the
# application is not installed there.
_launch_gui() {
    local executable=$1
    shift

    if [[ $executable == */* ]]; then
        if [[ ! -x $executable ]]; then
            printf 'not executable: %s\n' "$executable" >&2
            return 127
        fi
    elif ! command -v "$executable" >/dev/null 2>&1; then
        printf 'command not found: %s\n' "$executable" >&2
        return 127
    fi

    nohup "$executable" "$@" >/dev/null 2>&1 &
    disown
}

em() {
    _launch_gui emacs -mm
}

ideac324() {
    _launch_gui /opt/idea-IC-232.10203.10/bin/idea.sh
}

ideau324() {
    _launch_gui /opt/idea-IU-232.10203.10/bin/idea.sh
}

ardm() {
    _launch_gui /opt/Another-Redis-Desktop-Manager.1.6.1.AppImage
}

dbeaver() {
    _launch_gui /opt/manual/dbeaver-25.2.4/dbeaver
}

wechat() {
    _launch_gui /opt/manual/WeChatLinux_x86_64.AppImage
}

ccs() { _launch_gui cc-switch; }
wem() { _launch_gui wemeet; }
