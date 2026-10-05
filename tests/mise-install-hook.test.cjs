// Native nonsecret hook rendering, fake mise; no installs, vault or networking.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const source=process.argv[2]||path.resolve(__dirname,'..');
const chezmoi=process.env.CHEZMOI_BIN||path.join(os.homedir(),'.local/bin/chezmoi');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mise-install-hook-'));
try {
  const config=path.join(dir,'chezmoi.toml');
  fs.writeFileSync(config,'',{mode:0o600});
  const template=fs.readFileSync(path.join(source,'run_onchange_after_20-install-mise-tools.sh.tmpl'),'utf8');
  const rendered=spawnSync(chezmoi,['--config',config,'--source',source,
    '--cache',path.join(dir,'cache'),'--persistent-state',path.join(dir,'state'),
    'execute-template'],{input:template,encoding:'utf8',timeout:15000});
  assert.equal(rendered.status,0,'nonsecret hook render failed');
  const hook=path.join(dir,'hook.sh');
  fs.writeFileSync(hook,rendered.stdout);
  assert.equal(spawnSync('/bin/sh',['-n',hook]).status,0);
  const home=path.join(dir,'home');
  fs.mkdirSync(path.join(home,'.local/bin'),{recursive:true});
  const fake=path.join(home,'.local/bin/mise');
  fs.writeFileSync(fake,`#!/bin/sh
set -eu
[ "$1" = install ] && [ "$#" = 1 ]
[ -z "\${GITLAB_TOKEN+x}" ] && [ -z "\${MISE_GITLAB_TOKEN+x}" ]
printf 'public-install\\n' >> "$TEST_LOG"
exit "$TEST_EXIT"
`,{mode:0o755});
  const log=path.join(dir,'calls');
  for(const code of ['0','41']) {
    const r=spawnSync('/bin/sh',['-c',
      'sh "$1"; result=$?; [ "$GITLAB_TOKEN" = FAKE_PRIVATE_PAT ] && [ "$MISE_GITLAB_TOKEN" = FAKE_MISE_PAT ] || exit 90; exit "$result"',
      'test',hook],{encoding:'utf8',env:{...process.env,HOME:home,
        GITLAB_TOKEN:'FAKE_PRIVATE_PAT',MISE_GITLAB_TOKEN:'FAKE_MISE_PAT',TEST_EXIT:code,TEST_LOG:log}});
    assert.equal(r.status,Number(code),'installer status/parent environment must be preserved');
    assert.ok(!r.stdout.includes('FAKE_PRIVATE_PAT')&&!r.stderr.includes('FAKE_MISE_PAT'));
  }
  assert.equal(fs.readFileSync(log,'utf8'),'public-install\npublic-install\n');
  fs.unlinkSync(fake);
  const missing=spawnSync('/bin/sh',[hook],{env:{...process.env,HOME:home}});
  assert.equal(missing.status,0,'missing mise remains a no-op');
  console.log('Mise hook tests passed (token isolation, parent preservation, failure propagation).');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
