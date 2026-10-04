#!/usr/bin/env node
// Fabricated data only: never invokes bw or contacts a vault.
const [command, type, name, extra] = process.argv.slice(2);
if (command !== 'get' || type !== 'item' || extra || !['token:gitlab-pat', 'token:gitblue-pat'].includes(name)) process.exit(1);
const value = {name, login:{password:name === 'token:gitlab-pat' ? 'fake-gitlab-"token\\value' : 'fake-gitblue-token'}};
if (process.env.MOCK_GLAB_CASE === 'missing') delete value.login.password;
if (process.env.MOCK_GLAB_CASE === 'wrong') value.name = 'wrong-item';
if (process.env.MOCK_GLAB_CASE === 'deleted') value.deletedDate = '2026-01-01';
console.log(JSON.stringify(value));
