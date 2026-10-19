#!/usr/bin/env node
// Fabricated data only. Never contacts a real vault.
const [command, type, name, extra] = process.argv.slice(2);
if (command !== 'get' || type !== 'item' || extra || !['proxy:sing-box', 'oxylabs:residential-ip'].includes(name)) process.exit(1);
if (name === 'oxylabs:residential-ip') {
  const item = {name, fields:[{name:'SERVER', value:'socks.example.invalid'}],
    login:{username:'mock-oxylabs-username', password:'mock-oxylabs-password'}};
  if (process.env.MOCK_BW_CASE === 'escape') {
    item.login = {username:'user"\\name\n', password:'pass"\\word\n'};
    item.fields[0].value = 'host"\\name\n';
  }
  if (['missing', 'empty', 'invalid'].includes(process.env.MOCK_BW_CASE)) {
    const key = process.env.MOCK_BW_FIELD;
    if (key === 'SERVER') {
      if (process.env.MOCK_BW_CASE === 'missing') item.fields = [];
      else item.fields[0].value = process.env.MOCK_BW_CASE === 'empty' ? '' : 42;
    } else if (process.env.MOCK_BW_CASE === 'missing') delete item.login[key];
    else item.login[key] = process.env.MOCK_BW_CASE === 'empty' ? '' : 42;
  }
  if (process.env.MOCK_BW_CASE === 'duplicate') item.fields.push({...item.fields[0]});
  if (process.env.MOCK_BW_CASE === 'no-fields') delete item.fields;
  if (process.env.MOCK_BW_CASE === 'no-login') delete item.login;
  if (process.env.MOCK_BW_CASE === 'wrong') item.name = 'wrong-item';
  if (process.env.MOCK_BW_CASE === 'deleted') item.deletedDate = '2026-01-01';
  console.log(JSON.stringify(item));
  process.exit(0);
}
const ports = [8001, 8003, 8004, 8005];
const fields = ports.map((port, i) => ({name:'UUID-' + port,
  value:'00000000-0000-4000-8000-' + String(process.env.MOCK_BW_SERVER ? i + 1 : 1).padStart(12, '0')}));
if (process.env.MOCK_BW_SERVER) {
  fields.push({name:'PRIVATE_KEY', value:Buffer.alloc(32, 2).toString('base64url')});
  const index = fields.findIndex(x => x.name === process.env.MOCK_BW_FIELD);
  if (index >= 0 && process.env.MOCK_BW_CASE === 'missing') fields.splice(index, 1);
  if (index >= 0 && process.env.MOCK_BW_CASE === 'empty') fields[index].value = '';
  if (process.env.MOCK_BW_CASE === 'missing-all-server') {
    for (let i = fields.length - 1; i >= 0; i--) {
      if (fields[i].name === 'PRIVATE_KEY') fields.splice(i, 1);
    }
  }
}
fields.push({name:'SERVER', value:process.env.MOCK_BW_CASE === 'escape' ? 'a"b\\c' : 'example.invalid'}, {name:'PUBLIC_KEY', value:Buffer.alloc(32, 1).toString('base64url')});
if (process.env.MOCK_BW_CASE === 'missing' && !process.env.MOCK_BW_SERVER) fields.pop();
if (process.env.MOCK_BW_CASE === 'duplicate') fields.push(fields[0]);
const item = {name:process.env.MOCK_BW_CASE === 'wrong' ? 'wrong-item' : 'proxy:sing-box', fields};
if (process.env.MOCK_BW_CASE === 'deleted') item.deletedDate = '2026-01-01';
console.log(JSON.stringify(item));
