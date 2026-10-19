// Isolated native chezmoi rendering and engine validation; fabricated vault values only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {parse} = require('./fixtures/jsonc.cjs');
const root = process.argv[2] || path.resolve(__dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sing-box-server-template-'));
const ports = [8001, 8003, 8004, 8005];
const definitions = [
  ['private_config.json.tmpl', 'config.json', 'sing-box-server.mock.jsonc'],
  ['private_conf/private_VLESS-REALITY-9528.json.tmpl', 'conf/VLESS-REALITY-9528.json', 'sing-box-server-inbound.mock.jsonc'],
];
try {
  const config = path.join(dir, 'chezmoi.toml');
  fs.writeFileSync(config, '[bitwarden]\ncommand = ' + JSON.stringify(path.join(root, 'tests/fixtures/bw-mock.cjs')) + '\n', {mode:0o600});
  const source = path.join(dir, 'source');
  const home = path.join(dir, 'home');
  const serverSource = path.join(source, 'dot_config/private_sing-box/private_server');
  const target = path.join(home, '.config/sing-box/server');
  fs.mkdirSync(path.join(serverSource, 'private_conf'), {recursive:true});
  fs.mkdirSync(path.join(home, '.config'), {recursive:true});
  function invoke(args, input = '', testCase = '', field = '') {
    return spawnSync(process.env.CHEZMOI_BIN || path.join(os.homedir(), '.local/bin/chezmoi'),
      ['--config', config, '--source', source, '--destination', home,
        '--cache', path.join(dir, 'cache'), '--persistent-state', path.join(dir, 'state.boltdb'), ...args],
      {input, encoding:'utf8', timeout:15000,
        env:{...process.env, MOCK_BW_SERVER:'1', MOCK_BW_CASE:testCase, MOCK_BW_FIELD:field}});
  }
  for (const [file, , fixture] of definitions) {
    const template = fs.readFileSync(path.join(root, 'dot_config/private_sing-box/private_server', file), 'utf8');
    fs.writeFileSync(path.join(serverSource, file), template);
    const rendered = invoke(['execute-template'], template);
    assert.equal(rendered.status, 0, 'mock server rendering failed: ' + (rendered.error?.code || rendered.stderr));
    assert.equal(rendered.stdout, fs.readFileSync(path.join(root, 'tests/fixtures', fixture), 'utf8'),
      'preserve server settings and exact formatting with mock credentials');
    const isMain = file === 'private_config.json.tmpl';
    assert.ok(!template.includes('SOCKS-'), 'do not require invented per-port Bitwarden fields');
    const fields = isMain ? ['SERVER', 'username', 'password'] : [...ports.map(port => `UUID-${port}`), 'PRIVATE_KEY'];
    for (const field of fields) {
      for (const failure of isMain ? ['missing', 'empty', 'invalid'] : ['missing', 'empty']) {
        const failed = invoke(['execute-template'], template, failure, field);
        assert.notEqual(failed.status, 0, `${failure} ${field} must fail`);
        assert.ok(failed.stderr.includes(isMain
          ? `Missing or empty ${field === 'SERVER' ? 'SERVER custom field' : 'login.' + field} in Bitwarden item oxylabs:residential-ip`
          : 'Missing or empty custom fields in Bitwarden item proxy:sing-box: ' + field));
        assert.equal(failed.stdout, '', 'validation must fail before rendering credential values');
        assert.ok(!failed.stderr.includes('mock-oxylabs-'), 'diagnostics must not expose credential values');
      }
    }
    if (!isMain) {
      const missingAll = invoke(['execute-template'], template, 'missing-all-server');
      assert.notEqual(missingAll.status, 0);
      assert.ok(missingAll.stderr.includes('proxy:sing-box: PRIVATE_KEY'));
      assert.equal(missingAll.stdout, '');
    }
    for (const failure of isMain ? ['no-fields', 'duplicate', 'no-login', 'wrong', 'deleted'] : ['duplicate', 'wrong', 'deleted']) {
      assert.notEqual(invoke(['execute-template'], template, failure).status, 0, `${failure} item must fail`);
    }
    const escaped = invoke(['execute-template'], template, 'escape');
    assert.equal(escaped.status, 0);
    if (file === 'private_config.json.tmpl') {
      for (const outbound of parse(escaped.stdout).outbounds.filter(x => x.type === 'socks')) {
        assert.equal(outbound.server, 'host"\\name\n', 'escape the Oxylabs SERVER field as JSON');
        assert.equal(outbound.username, 'user"\\name\n', 'escape the shared Oxylabs username as JSON');
        assert.equal(outbound.password, 'pass"\\word\n', 'escape the shared Oxylabs password as JSON');
      }
    }
  }
  const skipped = invoke(['apply', '--skip-secrets']);
  assert.equal(skipped.status, 0, 'bootstrap must skip server secrets');
  assert.equal(fs.existsSync(path.join(target, 'config.json')), false);
  const applied = invoke(['apply', path.join(home, '.config/sing-box')]);
  assert.equal(applied.status, 0, 'mock directory apply failed');
  for (const directory of ['.config/sing-box', '.config/sing-box/server', '.config/sing-box/server/conf']) {
    assert.equal(fs.statSync(path.join(home, directory)).mode & 0o777, 0o700);
  }
  for (const [, file, fixture] of definitions) {
    assert.equal(fs.statSync(path.join(target, file)).mode & 0o777, 0o600);
    assert.equal(fs.readFileSync(path.join(target, file), 'utf8'), fs.readFileSync(path.join(root, 'tests/fixtures', fixture), 'utf8'));
  }
  // Re-apply must restore private permissions if they were relaxed locally.
  fs.chmodSync(target, 0o755);
  fs.chmodSync(path.join(target, 'conf'), 0o755);
  fs.chmodSync(path.join(target, 'config.json'), 0o644);
  fs.chmodSync(path.join(target, 'conf/VLESS-REALITY-9528.json'), 0o644);
  assert.equal(invoke(['apply', '--force', path.join(home, '.config/sing-box')]).status, 0,
    'explicitly accept repairing locally modified permissions in the temporary home');
  for (const file of ['config.json', 'conf/VLESS-REALITY-9528.json']) {
    assert.equal(fs.statSync(path.join(target, file)).mode & 0o777, 0o600);
  }
  for (const directory of [target, path.join(target, 'conf')]) {
    assert.equal(fs.statSync(directory).mode & 0o777, 0o700);
  }
  const configText = fs.readFileSync(path.join(target, 'config.json'), 'utf8');
  const main = parse(configText);
  const inbound = parse(fs.readFileSync(path.join(target, 'conf/VLESS-REALITY-9528.json'), 'utf8')).inbounds[0];
  assert.equal(inbound.listen_port, 9528);
  for (const [i, port] of ports.entries()) {
    const outbound = main.outbounds.find(x => x.tag === `res-${port}`);
    assert.equal(outbound.server, 'socks.example.invalid', 'read the host from the Oxylabs item, independently of the client SERVER field');
    assert.equal(outbound.server_port, port);
    assert.equal(outbound.username, 'mock-oxylabs-username');
    assert.equal(outbound.password, 'mock-oxylabs-password');
    assert.equal(inbound.users[i].uuid, `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`);
    assert.ok(main.route.rules.some(x => x.auth_user?.includes(inbound.users[i].name) && x.outbound === outbound.tag));
  }
  const check = path.join(dir, 'check.json');
  fs.writeFileSync(check, configText.replace(JSON.stringify(main.log.output), JSON.stringify(path.join(dir, 'check.log'))), {mode:0o600});
  const checked = spawnSync(process.env.SING_BOX_BIN || '/opt/manual/sing-box/sing-box',
    ['check', '-c', check, '-C', path.join(target, 'conf')], {encoding:'utf8', timeout:15000});
  assert.equal(checked.status, 0, 'native server validation failed (output suppressed)');
  console.log('Sing-box server templates passed (mock vault, exact text, failures, permissions, skip-secrets, native combined check).');
} finally { fs.rmSync(dir, {recursive:true, force:true}); }
