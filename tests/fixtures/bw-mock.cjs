#!/usr/bin/env node
// Fabricated data only. Never contacts a real vault.
if (process.argv.slice(2).join(' ') !== 'get item proxy:sing-box') process.exit(1);
const fields = ['UUID-8001', 'UUID-8003', 'UUID-8004', 'UUID-8005'].map(name => ({name, value:'00000000-0000-4000-8000-000000000001'}));
fields.push({name:'SERVER', value:process.env.MOCK_BW_CASE === 'escape' ? 'a"b\\c' : 'example.invalid'}, {name:'PUBLIC_KEY', value:Buffer.alloc(32, 1).toString('base64url')});
if (process.env.MOCK_BW_CASE === 'missing') fields.pop();
if (process.env.MOCK_BW_CASE === 'duplicate') fields.push(fields[0]);
console.log(JSON.stringify({name:'proxy:sing-box', fields}));
