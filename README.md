# dotfiles

Personal Linux dotfiles managed by [chezmoi](https://www.chezmoi.io/).

The repository contains user-level configuration only. Machine secrets,
VPN/proxy credentials, downloaded subscription files, caches, binaries, and
system-wide files under `/etc` do not belong here.

## Install on a new machine

### Through knowl

When this repository is knowl's `dotfiles/` submodule, run from the knowl root:

```sh
bash toolkits/env.sh setup
bash toolkits/env.sh apply --secrets  # Optional credential rendering
```

`setup --secrets` combines both steps. For daily changes use
`bash toolkits/env.sh diff` and `bash toolkits/env.sh apply`. These commands
apply from the submodule, not the independent default chezmoi clone.
System links are a separate optional `bash toolkits/env.sh links` command
requiring sudo; they are not part of dotfiles apply.
For a fresh Ubuntu/Arch systemd or Gentoo OpenRC service, run
`bash toolkits/env.sh service-setup` from knowl after rendering secrets. It installs
without starting/enabling, and refuses existing installations. Activate explicitly
with `bash toolkits/env.sh service-update`; use the same update command after a
reviewed upgrade. No sudo/restart postinstall hook is added to mise configuration.
Knowl's secret apply validates a private scratch copy without privileged runtime
log/dashboard paths. Standalone native checks below may need root access because
the preserved runtime profile uses `/var/log` and `/var/lib`; applying alone
does not provision those paths or a service. See knowl's service setup guides.

### Standalone chezmoi

Install `chezmoi`, then initialize and bootstrap without rendering secrets:

```sh
chezmoi init git@github.com:Ntoofar/dotfiles.git
chezmoi diff --skip-secrets
chezmoi apply --skip-secrets
export PATH="$HOME/.local/bin:$PATH"
mise exec -- bw login --quiet
export BW_SESSION="$(mise exec -- bw unlock --raw)"
mise exec -- bw sync
mise exec -- chezmoi apply ~/.config/sing-box ~/.config/glab-cli
mise exec -- sing-box check -c ~/.config/sing-box/config.json
mise exec -- bw lock
unset BW_SESSION
```

Applying installs the pinned standalone `mise` binary and the configured Go,
Node.js, uv, VS Code, Claude Code, Codex, and Antigravity CLI versions from
upstream archives or official npm packages. It never
uses `apt-get`, `pacman`, or `emerge`. The host must already provide `curl`, Git,
CA certificates, and common archive utilities.
The first `--skip-secrets` apply installs tools without needing a vault session.
The second apply renders sing-box after login/unlock. Avoid ordinary diff output
for secret templates; it can print credential values.

The first initialization asks for the local Git author name and email. Those
values are written to the machine-local chezmoi configuration, not committed
to this repository.

## Daily use

The following commands use chezmoi's default source. When editing another
checkout, explicitly select it with `chezmoi --source "$PWD"` from that checkout
or use knowl's workflow above.

```sh
chezmoi edit ~/.bashrc
chezmoi diff --skip-secrets
chezmoi apply --skip-secrets
chezmoi cd
git status
```

Use `~/.bashrc.local` and `~/.gitconfig.local` for intentionally unmanaged,
machine-specific overrides. Do not put tokens or passwords in shell startup
files; retrieve them from a password manager when needed.
For sing-box changes, follow the unlocked-session apply workflow below instead
of `--skip-secrets`.

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

## AI command-line tools

- `claude`: `npm:@anthropic-ai/claude-code`
- `codex`: `npm:@openai/codex`
- `agy`: `http:antigravity`, downloaded from Google's official release manifest

These tools use `latest` selectors, with resolved versions recorded in the
lockfile. Antigravity displays the standard release version in mise. The managed
`~/.local/bin/mise-antigravity-url` resolver keeps Google's build ID in the
archive URL, reading the global lockfile first and the official manifest for
new releases. If an unlocked older version is no longer in the manifest, it
fails instead of installing a different release under that version. The Linux archive
configuration supports glibc x86-64 and ARM64 hosts, not musl hosts.
Claude Code and Antigravity self-updates are disabled so mise owns upgrades.
Authentication, tokens, sessions, and each CLI's local settings are unmanaged.
Run each CLI interactively after installation to sign in.

```sh
mise upgrade 'npm:@anthropic-ai/claude-code' 'npm:@openai/codex' http:antigravity
mise lock --global --platform linux-x64
```

After upgrading, copy the global config/lockfile back into the chezmoi source
with `chezmoi add ~/.config/mise/config.toml ~/.config/mise/mise.lock`, then
commit them in the dotfiles repository.

Intentionally not migrated from the old environment repository:

- The plaintext `GITLAB_TOKEN`
- The `pw` alias that printed a password file to the terminal
- Obsolete `GO111MODULE=on`
- `http.sslVerify=false` and `credential.helper=store`

## Credential management

Bitwarden CLI (`bw`) is installed by mise from `npm:@bitwarden/cli`, with an
explicit version pin and a committed dependency lockfile. Dependency lifecycle
scripts are not approved. Review release/security notes before upgrading this
credential-handling tool; do not automatically follow `latest`.

The vault database, exports, master password, API credentials, and `BW_SESSION`
are machine-local and must never be added to chezmoi, Git, or shell startup
files. Installation does not log in, unlock, fetch secrets, or upload anything.
Use Bitwarden's interactive prompts, not passwords on the command line.

```sh
bw login
export BW_SESSION="$(bw unlock --raw)"
bw sync
# Use the unlocked session only for the commands that need credentials.
bw lock
unset BW_SESSION
```

Do not run session/secret commands with shell tracing (`set -x`). The session
token remains sensitive even though the unlock command itself can be kept in
shell history. To remove local account state, use `bw logout`.

For proxy age-key backup, store `~/.config/chezmoi/proxy-age-key.txt` in your vault
manually, then restore it securely with mode 0600 on new machines. This key is
not uploaded automatically. Bitwarden recovery and the vault master password
must not depend on being able to decrypt the proxy configuration.

Reference: https://bitwarden.com/help/cli/

### Direct Bitwarden references

No separate credential-reference JSON file is needed. The sing-box source
template directly calls `bitwarden "item" "proxy:sing-box"`. Custom fields are
looked up by name and encoded with `toJson`, so JSON escaping is safe.
For a login password, native syntax is
`{{ (bitwarden "item" "token:gitlab-pat").login.password }}`.
Do not use that expression to persist a PAT in Git config. No custom Git
credential helper is managed here; Git authentication remains machine-local.

- `proxy:sing-box`: `UUID-8001`, `UUID-8003`, `UUID-8004`, `UUID-8005`, `SERVER`,
  and `PUBLIC_KEY` custom fields. The server and public key are shared by those four
  REALITY VLESS outbounds. Existing ports, TLS server names, and routing remain
  unchanged. A changed server/key can require corresponding TLS server-name or
  port changes; engine validation does not prove remote connectivity.

`chezmoi apply` now needs an unlocked Bitwarden session to render sing-box.
The generated `~/.config/sing-box/config.json` contains plaintext secrets
and is mode 0600. Missing/duplicate custom fields fail. Sing-box uses this
already-rendered file and does not access the vault. Rotate/update vault values,
then apply again to refresh them.
IMPORTANT: `chezmoi diff`, `cat`, `execute-template`, and dry-run output can
display secrets. Do not paste their output into logs, tickets, or chat. Never
re-add the rendered home config to chezmoi; edit the source template instead.

```sh
export BW_SESSION="$(bw unlock --raw)"
bw sync
mise exec -- chezmoi apply ~/.config/sing-box
mise exec -- sing-box check -c ~/.config/sing-box/config.json
# mise exec -- sing-box run -c ~/.config/sing-box/config.json
bw lock
unset BW_SESSION
```

## Two GitLab hosts (glab)

The secret-free source `dot_config/private_glab-cli/private_config.yml.tmpl`
renders to `~/.config/glab-cli/config.yml`. Directory mode is 0700 and file mode
is 0600. Native chezmoi Bitwarden calls read `login.password` from:

- `token:gitlab-pat` for `gitlab.transwarp.io`
- `token:gitblue-pat` for `gitblue.transwarp.io`

Both hosts use HTTPS API access and SSH Git transport. Each host has its own
token; no global token is written to shell startup files. The template deliberately
uses file-backed credentials (`use_keyring: false`), not an OS keyring.
Glab itself is not currently managed by the mise config; install it before using
the glab commands below.

```sh
export BW_SESSION="$(mise exec -- bw unlock --raw)"
mise exec -- bw sync
mise exec -- chezmoi apply ~/.config/glab-cli
mise exec -- bw lock
unset BW_SESSION
glab auth status --hostname gitlab.transwarp.io
glab auth status --hostname gitblue.transwarp.io
```

Apply the directory, not the config file, on a new machine so its parent is
created. Inside a GitLab repository, glab selects the host from the remote.
Outside a repository, use an explicit nonsecret host:
`GITLAB_HOST=gitblue.transwarp.io glab issue list -R group/project`.
Avoid globally exported `GITLAB_TOKEN`, `GITLAB_ACCESS_TOKEN`, and `OAUTH_TOKEN`:
they override per-host stored tokens and can select the wrong credential.

The rendered YAML contains plaintext PATs. Never commit/re-add it or share
ordinary chezmoi diff/cat output. Edit the source template and update tokens in
Bitwarden, then apply again. Glab auth/config commands can change the local file;
a later chezmoi apply overwrites those changes. Git push/pull over SSH remains
separate and uses SSH keys, not these API tokens.

Reference: https://docs.gitlab.com/cli/authentication/

## Workstation proxies

mise installs pinned sing-box directly
from upstream. Upgrade the proxy pins deliberately and validate their config
schemas before using a new version. Ubuntu, Gentoo, and Arch need no distro
package-manager commands. Age is no longer installed or managed: no active
configuration uses it. The old encrypted rollback backups and identity are
preserved; temporarily reinstall age only if you need to recover those backups.

chezmoi manages `~/.config/sing-box/` (mode 0700). Sing-box uses readable
`dot_config/private_sing-box/private_config.json.tmpl` in the source repo: edit routing, DNS, ports, and
TLS settings directly; keep UUID/server/public-key template expressions.
Use native `sing-box check` to validate the rendered configuration before running.
Review source changes before applying; never add passwords or tokens to Git.
Clash/mihomo migration was reverted. The original configuration remains in
`knowl/proxy/clash/conf`, with `toolkits/env.sh links` linking it to
`/etc/clash`. Dotfiles no longer manages its binary, configuration, or launcher.
The retired sing-box ciphertext is backed up locally at
`~/.local/state/proxy-client/migration-backup/sing-box.json.age`; it contains old
credentials and still requires the original age identity. It is not managed by Git.

On a new machine, bootstrap with `chezmoi apply --skip-secrets` to install mise
and Bitwarden CLI, then login/unlock before applying the sing-box template
(template evaluation happens before install hooks).
Use `mise exec -- chezmoi apply ~/.config/sing-box` so chezmoi can find mise-managed
`bw` and create the directory and config together. On a new machine, do not target
`~/.config/sing-box/config.json` before its parent exists: chezmoi fails with a
missing-directory error. Directory-targeted apply sets mode 0700 on the directory
and mode 0600 on the generated config.
Sing-box needs an explicitly unlocked session during apply, not an age identity.
Keep the existing age identity securely backed up only if you need to recover
retired encrypted snapshots. No proxy starts on apply.

```sh
mise exec -- sing-box check -c ~/.config/sing-box/config.json
mise exec -- sing-box run -c ~/.config/sing-box/config.json
proxy on                      # in another shell, while the engine is running
```

There is no custom launcher or renderer. Sing-box reads the chezmoi-generated
JSON directly; file logging is preserved at `/var/log/sing-box.log`.
Any caches, downloaded providers, logs, and rendered secrets must stay outside Git.
The template preserves knowl's `proxy/sing-box/config-v1.14.0.json`, including
its JSONC comments and formatting. Only active credential values become
Bitwarden expressions. Its runtime settings include TUN
`utun9527` with automatic/strict routing and route exclusions, the mixed
listener at `127.0.0.1:17890`, and the Clash API/dashboard at `0.0.0.0:9529`.
It requires privileges for TUN, `/var/log/sing-box.log`, and dashboard state
under `/var/lib/sing-box/dashboard`; unprivileged foreground runs may fail.
The API has no configured authentication secret and is not localhost-only:
restrict access with host/network policy. Applying does not activate any of this.
DNS, routing, and server deployment ownership remain unchanged.
Validation checks syntax/engine compatibility, not live upstream connectivity.

To edit sing-box configuration:

```sh
chezmoi edit ~/.config/sing-box/config.json
export BW_SESSION="$(bw unlock --raw)"
bw sync
mise exec -- chezmoi apply ~/.config/sing-box
mise exec -- sing-box check -c ~/.config/sing-box/config.json
bw lock
unset BW_SESSION
```

Edit the template in the dotfiles repo instead if preferred, then apply from that
source. Home JSON is generated; changes there will be overwritten. Do not
`chezmoi add` the rendered home file. For ordinary nonsecret reviews, use
`chezmoi diff --skip-secrets` or Git diff of the source template.

Never use a public subscription conversion service with private subscription
URLs. Keep systemd/OpenRC/TUN provisioning separate.
