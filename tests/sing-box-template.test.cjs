const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {parse, inspect} = require('./fixtures/jsonc.cjs');
const root = process.argv[2] || path.resolve(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'dot_config/private_sing-box/private_config.json.tmpl'), 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sing-box-template-'));
try {
  const config = path.join(dir, 'chezmoi.toml');
  fs.writeFileSync(config, '[bitwarden]\ncommand = ' + JSON.stringify(path.join(root, 'tests/fixtures/bw-mock.cjs')) + '\n', {mode:0o600});
  function run(testCase = '') {
    return spawnSync(process.env.CHEZMOI_BIN || path.join(os.homedir(), '.local/bin/chezmoi'),
      ['--config', config, '--source', dir, '--cache', path.join(dir, 'cache'),
        '--persistent-state', path.join(dir, 'state.boltdb'), 'execute-template'], {input:template, encoding:'utf8', timeout:15000,
        env:{...process.env, MOCK_BW_CASE:testCase}, maxBuffer:1024*1024});
  }
  const result = run();
  assert.equal(result.status, 0, 'mock template render failed: ' + result.stderr);
  const rendered = parse(result.stdout);
  const baselineText = fs.readFileSync(path.join(root, 'tests/fixtures/sing-box-v1.14.0.mock.jsonc'), 'utf8');
  assert.deepEqual(inspect(result.stdout).comments, inspect(baselineText).comments, 'preserve every original comment in order');
  assert.equal(result.stdout, baselineText, 'preserve JSONC formatting; replace credential values only');
  const sourceDir = path.join(dir, 'source');
  const destination = path.join(dir, 'home');
  fs.mkdirSync(path.join(sourceDir, 'dot_config/private_sing-box'), {recursive:true});
  fs.mkdirSync(destination);
  // Bootstrap creates ~/.config; sing-box itself must not exist before apply.
  fs.mkdirSync(path.join(destination, '.config'));
  assert.equal(fs.existsSync(path.join(destination, '.config/sing-box')), false);
  fs.writeFileSync(path.join(sourceDir, 'dot_config/private_sing-box/private_config.json.tmpl'), template);
  const applied = spawnSync(process.env.CHEZMOI_BIN || path.join(os.homedir(), '.local/bin/chezmoi'),
    ['--config', config, '--source', sourceDir, '--destination', destination,
      '--cache', path.join(dir, 'cache'), '--persistent-state', path.join(dir, 'state.boltdb'), 'apply', path.join(destination, '.config/sing-box')],
    {encoding:'utf8', timeout:15000, env:{...process.env, MOCK_BW_CASE:''}});
  assert.equal(applied.status, 0, 'mock apply failed: ' + applied.stderr);
  const nativeConfig = path.join(destination, '.config/sing-box/config.json');
  assert.equal(fs.statSync(nativeConfig).mode & 0o777, 0o600);
  assert.equal(fs.statSync(path.join(destination, '.config/sing-box')).mode & 0o777, 0o700);
  assert.deepEqual(parse(fs.readFileSync(nativeConfig, 'utf8')), rendered);
  const baseline = parse(baselineText);
  assert.deepEqual(rendered, baseline, 'preserve the v1.14.0 profile with mock vault values');
  assert.equal(rendered.log.output, '/var/log/sing-box.log');
  const tun = rendered.inbounds.find(x => x.type === 'tun');
  assert.equal(tun.auto_route, true, 'auto_redirect requires auto_route');
  assert.equal(tun.auto_redirect, true, 'enable Linux TUN auto redirect');
  assert.equal(rendered.outbounds.filter(x => x.type === 'vless').length, 4);
  for (const x of rendered.outbounds.filter(x => x.type === 'vless')) {
    assert.equal(x.uuid, '00000000-0000-4000-8000-000000000001');
    assert.equal(x.server, 'example.invalid');
    assert.equal(x.server_port, 9528);
  }
  for (const testCase of ['missing', 'duplicate']) assert.notEqual(run(testCase).status, 0);
  const escaped = parse(run('escape').stdout);
  assert.equal(escaped.outbounds.find(x => x.type === 'vless').server, 'a"b\\c');
  // Engine check may initialize logs/state. Keep those paths temporary instead
  // of writing privileged runtime paths from the production-equivalent profile.
  const validationConfig = structuredClone(rendered);
  validationConfig.log.output = path.join(dir, 'check.log');
  validationConfig.experimental.clash_api.external_ui = path.join(dir, 'dashboard');
  const checkConfigPath = path.join(dir, 'check.json');
  // Keep comments/trailing commas in native validation too; isolate runtime paths.
  const checkText = result.stdout
    .replace(JSON.stringify(rendered.log.output), JSON.stringify(validationConfig.log.output))
    .replace(JSON.stringify(rendered.experimental.clash_api.external_ui), JSON.stringify(validationConfig.experimental.clash_api.external_ui));
  fs.writeFileSync(checkConfigPath, checkText, {mode:0o600});
  const checked = spawnSync(process.env.MISE_BIN || path.join(os.homedir(), '.local/bin/mise'),
    ['exec', '--', 'sing-box', 'check', '-c', checkConfigPath], {encoding:'utf8', timeout:15000});
  assert.equal(checked.status, 0, 'native sing-box validation failed (output suppressed)');
  console.log('Native Bitwarden template and sing-box validation passed (mock values only).');
} finally { fs.rmSync(dir, {recursive:true, force:true}); }
