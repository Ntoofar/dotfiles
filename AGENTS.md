# Agent guide for dotfiles

## Scope and source ownership

This is a standalone chezmoi source repository for personal Linux user settings.
Read `README.md` before changing setup, tool management, or secret templates.
It may also be checked out as knowl's `dotfiles/` submodule. When nested, follow
applicable parent instructions too; do not require knowl to use this repository.

Check Git status before editing and preserve unrelated changes. Edit repository
sources, not generated home files. An independent `~/.local/share/chezmoi` clone
may exist: never assume this checkout and the default source are synchronized.
Do not reset, synchronize, commit, or push checkouts without authorization. If
publishing a submodule change is requested, push dotfiles first, then update
knowl's gitlink separately.

## Chezmoi conventions

- `dot_` represents a leading dot, `.tmpl` marks a template, and `executable_`
  produces an executable target. `private_` controls permissions, not encryption.
- Secret directories must render with mode 0700 and files with mode 0600.
- Keep repository-only documentation and tests in `.chezmoiignore`, including
  `AGENTS.md`; do not deploy agent instructions into the user's home.
- Prefer portable shell fragments and guarded optional commands. Keep
  machine-specific nonsecret overrides in unmanaged `~/.bashrc.local` and
  `~/.gitconfig.local`. Never put credentials in shell startup files.
- Keep chezmoi standalone. Install hooks bootstrap pinned standalone mise before
  installing its configured tools; neither hook should unlock the vault.
- Bootstrapping must use `--skip-secrets`: template evaluation occurs before
  install hooks can provide mise-managed Bitwarden CLI.

For an explicitly requested apply from this checkout, run from its root:

```sh
chezmoi --source "$PWD" diff --skip-secrets
chezmoi --source "$PWD" apply --skip-secrets
```

Apply mutates the real home and can download/install tools; it is not a routine
test. When used under knowl, its environment scripts provide setup and daily
apply workflows. Do not start services or run sudo as part of ordinary apply.

## Mise tools

`dot_config/mise/config.toml`, `mise.lock`, and the `locks/` directory are the
managed tool configuration and resolved artifacts/dependencies. Keep version
selectors, lockfiles, resolver helpers, and version-sensitive templates aligned.
Review credential-handling Bitwarden CLI upgrades deliberately; retain its
explicit version pin rather than silently switching to `latest`.

Support Ubuntu, Gentoo, and Arch through upstream archives/official packages,
not apt-get, pacman, or emerge for managed tools. Document required host utilities
and runtime libraries. Do not claim unsupported architectures or musl support.
Do not upgrade installed tools, regenerate home lockfiles, or enable third-party
dependency lifecycle scripts merely to validate a documentation/source change.

## Credentials and proxy boundaries

- Store credential values in Bitwarden. Use native chezmoi `bitwarden` template
  calls and safe JSON/YAML escaping; do not introduce custom renderers or a
  credential-reference file without an explicit design request.
- Sing-box source: `dot_config/private_sing-box/private_config.json.tmpl`.
  Item `proxy:sing-box` supplies fields `UUID-8001`, `UUID-8003`, `UUID-8004`,
  `UUID-8005`, `SERVER`, and `PUBLIC_KEY`. Validate schema compatibility whenever
  its mise pin or template changes together.
- Glab source: `dot_config/private_glab-cli/private_config.yml.tmpl`.
  Items `token:gitlab-pat` and `token:gitblue-pat` supply `login.password` for
  `gitlab.transwarp.io` and `gitblue.transwarp.io`. Keep per-host tokens separate;
  do not export a global GitLab token or confuse API auth with SSH Git auth.
- Never print, log, paste, or commit credentials, `BW_SESSION`, vault exports,
  or rendered secret files. Never reuse chat-pasted sessions or enable shell
  tracing for credential operations. Obtain vault access interactively only
  when requested; locking it can invalidate sessions in other shells.
- Use `--skip-secrets` for routine diff. Secret rendering, dry runs, template
  execution, and validation diagnostics can expose values. Prefer mock data;
  keep any live validation log private and local, not in agent tool output.
- Never `chezmoi add` rendered sing-box/glab files back into source. Apply their
  directories rather than individual files when parent directories are missing.
  Rendered plaintext remains usable after the vault is locked.
- Sing-box reads the generated JSON directly. Do not add a custom launcher,
  start proxies, change routing/TUN/services, or alter server deployment as an
  incidental client-config change. Validation does not prove remote connectivity.
- Clash/mihomo migration was reverted; this repository does not manage them.
  Age is not actively managed. Preserve external rollback backups/identities;
  do not delete them or rewrite credential-bearing history without authorization.

## Validation and handoff

Read the relevant tests first. From this repository's root:

```sh
sh -n run_onchange_before_10-install-mise.sh
mise exec -- node tests/sing-box-template.test.cjs
mise exec -- node tests/glab-config.test.cjs
git diff --check
```

The template tests render/apply into temporary directories with mock vault data;
sing-box tests also call the installed engine. They require Node, standalone
chezmoi, and (for native validation) mise/sing-box. If tools are missing, report
the limitation instead of installing dependencies or unlocking the live vault.
Do not pass unrendered `.tmpl` hook files to shell syntax checks; render with
nonsecret/mock inputs first if testing the templated hook.

Report changed files, performed checks, and limitations. Distinguish mock tests
from live apply and connectivity checks. Never silently deploy edits to home or
copy them to another source clone. For requested cleanup, check references and
prefer recoverable moves for material data; retain unrelated user state.
