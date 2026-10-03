proxy() {
    local address="${PROXY_ADDRESS:-127.0.0.1:17890}"

    case "${1:-status}" in
        on)
            export http_proxy="http://$address"
            export https_proxy="http://$address"
            export all_proxy="socks5h://$address"
            export HTTP_PROXY="$http_proxy"
            export HTTPS_PROXY="$https_proxy"
            export ALL_PROXY="$all_proxy"
            export no_proxy="localhost,127.0.0.1,::1${NO_PROXY_EXTRA:+,$NO_PROXY_EXTRA}"
            export NO_PROXY="$no_proxy"
            printf '\033[32m[ok]\033[0m proxy on (%s)\n' "$address"
            ;;
        off)
            unset http_proxy https_proxy all_proxy no_proxy
            unset HTTP_PROXY HTTPS_PROXY ALL_PROXY NO_PROXY
            printf '\033[31m[off]\033[0m proxy off\n'
            ;;
        status)
            if [[ -n ${http_proxy:-} ]]; then
                printf 'proxy on (%s)\n' "$http_proxy"
            else
                printf 'proxy off\n'
            fi
            ;;
        *)
            printf 'usage: proxy {on|off|status}\n' >&2
            return 2
            ;;
    esac
}
