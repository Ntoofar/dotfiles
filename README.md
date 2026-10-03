# dotfiles

Personal Linux dotfiles managed by [chezmoi](https://www.chezmoi.io/).

The repository contains user-level configuration only. Machine secrets,
VPN/proxy credentials, downloaded subscription files, caches, binaries, and
system-wide files under `/etc` do not belong here.

## Install on a new machine

Install `chezmoi`, then initialize, review, and apply the configuration:

```sh
chezmoi init git@github.com:Ntoofar/dotfiles.git
chezmoi diff
chezmoi apply --verbose
```

Applying installs the pinned standalone `mise` binary and the configured Go,
Node.js, uv, and VS Code versions directly from upstream archives. It never
uses `apt-get`, `pacman`, or `emerge`. The host must already provide `curl`, Git,
CA certificates, and common archive utilities.

The first initialization asks for the local Git author name and email. Those
values are written to the machine-local chezmoi configuration, not committed
to this repository.

## Daily use

```sh
chezmoi edit ~/.bashrc
chezmoi diff
chezmoi apply --verbose
chezmoi cd
git status
```

Use `~/.bashrc.local` and `~/.gitconfig.local` for intentionally unmanaged,
machine-specific overrides. Do not put tokens or passwords in shell startup
files; retrieve them from a password manager when needed.

## Managed files

- Bash startup and portable shell fragments
- Git aliases and local identity template
- tmux and its popup helper
- Alacritty configuration and one pinned upstream theme
- Guarded desktop launchers and optional legacy development-tool paths
- A pinned, distribution-independent mise toolchain

## Toolchain

The global mise configuration is `~/.config/mise/config.toml`. Installed tools,
cache, and runtime state remain machine-local under the standard mise data,
cache, and state directories and are not committed. Project-level `mise.toml`
files can override the global versions. The committed `mise.lock` records the
resolved Linux x86-64 artifacts and checksums.

Ubuntu, Gentoo, and Arch use the same configuration because mise downloads the
user-level upstream artifacts. The VS Code archive supports glibc-based x86-64
and ARM64 Linux hosts; it is not expected to work on a musl-based Gentoo host.
VS Code versions are discovered from Microsoft's stable-release API, so update
it with `mise upgrade http:vscode`. After changing tool versions manually,
refresh the lockfile with `mise lock --global --platform linux-x64`.

Intentionally not migrated from the old environment repository:

- The plaintext `GITLAB_TOKEN`
- The `pw` alias that printed a password file to the terminal
- Obsolete `GO111MODULE=on`
- `http.sslVerify=false` and `credential.helper=store`
