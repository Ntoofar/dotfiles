const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = process.argv[2] || path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'dot_config/private_glab-cli/private_config.yml.tmpl'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'glab-template-'));
try {
  const config = path.join(dir, 'chezmoi.toml');
  fs.writeFileSync(config, '[bitwarden]\ncommand = ' + JSON.stringify(path.join(root, 'tests/fixtures/bw-glab-mock.cjs')) + '\n', {mode:0o600});
  const binary = process.env.CHEZMOI_BIN || path.join(os.homedir(), '.local/bin/chezmoi');
  function invoke(args, input = '', testCase = '', source = dir) {
    return spawnSync(binary, ['--config', config, '--source', source,
      '--destination', path.join(dir, 'home'), '--cache', path.join(dir, 'cache'),
      '--persistent-state', path.join(dir, 'state.boltdb'), ...args],
      {input, encoding:'utf8', timeout:15000, env:{...process.env, MOCK_GLAB_CASE:testCase}});
  }
  const rendered = invoke(['execute-template'], template);
  assert.equal(rendered.status, 0, 'mock render failed');
  const parsed = invoke(['execute-template', '--with-stdin', '{{ .chezmoi.stdin | fromYaml | toJson }}'], rendered.stdout);
  assert.equal(parsed.status, 0, 'mock YAML parse failed');
  const hosts = JSON.parse(parsed.stdout).hosts;
  assert.deepEqual(Object.keys(hosts).sort(), ['gitblue.transwarp.io', 'gitlab.transwarp.io']);
  assert.equal(hosts['gitlab.transwarp.io'].token, 'fake-gitlab-"token\\value');
  assert.equal(hosts['gitblue.transwarp.io'].token, 'fake-gitblue-token');
  for (const host of Object.values(hosts)) {
    assert.equal(host.api_protocol, 'https');
    assert.equal(host.git_protocol, 'ssh');
    assert.equal(host.use_keyring, false);
  }
  for (const failure of ['missing', 'wrong', 'deleted']) assert.notEqual(invoke(['execute-template'], template, failure).status, 0);
  const source = path.join(dir, 'source');
  fs.mkdirSync(path.join(source, 'dot_config/private_glab-cli'), {recursive:true});
  fs.writeFileSync(path.join(source, 'dot_config/private_glab-cli/private_config.yml.tmpl'), template);
  fs.mkdirSync(path.join(dir, 'home/.config'), {recursive:true});
  const applied = invoke(['apply', path.join(dir, 'home/.config/glab-cli')], '', '', source);
  assert.equal(applied.status, 0, 'mock directory apply failed');
  assert.equal(fs.statSync(path.join(dir, 'home/.config/glab-cli')).mode & 0o777, 0o700);
  assert.equal(fs.statSync(path.join(dir, 'home/.config/glab-cli/config.yml')).mode & 0o777, 0o600);
  assert.equal(fs.readFileSync(path.join(dir, 'home/.config/glab-cli/config.yml'), 'utf8'), rendered.stdout);
  console.log('Two-host glab template tests passed (mock credentials only).');
} finally { fs.rmSync(dir, {recursive:true, force:true}); }
