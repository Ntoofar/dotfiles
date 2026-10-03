# dotfiles

Personal Linux dotfiles managed by [chezmoi](https://www.chezmoi.io/).

The repository contains user-level configuration only. Machine secrets,
VPN/proxy credentials, downloaded subscription files, caches, binaries, and
system-wide files under `/etc` do not belong here.

## Install on a new machine

Install `chezmoi`, then initialize and review the changes before applying:

```sh
chezmoi init git@github.com:Ntoofar/dotfiles.git
chezmoi diff
chezmoi apply --verbose
```

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
- Guarded desktop launchers and optional development-tool paths

Intentionally not migrated from the old environment repository:

- The plaintext `GITLAB_TOKEN`
- The `pw` alias that printed a password file to the terminal
- Obsolete `GO111MODULE=on`
- `http.sslVerify=false` and `credential.helper=store`
