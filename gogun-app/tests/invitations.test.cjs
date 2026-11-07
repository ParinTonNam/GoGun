const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, f);
function mock(file, value) { const f = path.resolve(__dirname, '../../gogun-api/src', file), m = new Module(f); m.loaded = true; m.exports = value; require.cache[f] = m; }
let duplicate = false, selectedGuest = true, tripExists = true, memberExists = true, accountIsGuest = false;
const writes = [], users = [];
const trip = { id: 'trip-id', name: 'ทริป', members: [] };
const db = {
  trip: { findUnique: async () => tripExists ? trip : null },
  tripMember: {
    findFirst: async q => q.where.user ? duplicate ? { id: 'taken' } : null : memberExists ? { id: 'guest-member', user_id: 'guest-user', user: { is_guest: selectedGuest } } : null,
    create: async q => { writes.push(q.data); return q.data; },
    upsert: async q => { writes.push(q); return q.create; },
  },
  user: { findUnique: async () => ({ id: 'account', is_guest: accountIsGuest }), create: async q => { users.push(q.data); return { id: 'new-user', ...q.data }; } },
  $queryRaw: async () => [],
  $transaction: async fn => fn(db),
};
mock('lib/prisma.ts', db);
mock('lib/jwt.ts', { signGuestToken: id => `guest:${id}`, verifyToken: token => ({ sub: 'account', guest: token === 'guest-session' }) });
const express = require('../../gogun-api/node_modules/express');
const invitations = require('../../gogun-api/src/routes/invitations.ts').default;
const members = require('../../gogun-api/src/routes/members.ts').default;
test('invitation flow', async t => {
  const app = express(); app.use(express.json()); app.use('/trips', invitations); app.use('/members', members);
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (suffix, body, token) => fetch(base + '/trips/join/code' + suffix, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  await t.test('opening link is read-only', async () => { assert.equal((await fetch(base + '/trips/join/code')).status, 200); assert.equal(users.length, 0); assert.equal(writes.length, 0); });
  await t.test('all join modes require confirmation', async () => { for (const suffix of ['', '/guest', '/claim/guest-member']) assert.equal((await post(suffix, {}, suffix ? undefined : 'account-session')).status, 400); assert.equal(writes.length, 0); });
  await t.test('new guest joins immediately with trimmed name', async () => { const res = await post('/guest', { display_name: '  เมย์  ', confirmed: true }); assert.equal(res.status, 201); assert.equal((await res.json()).data.token, 'guest:new-user'); assert.equal(users[0].display_name, 'เมย์'); assert.equal(users[0].is_guest, true); assert.equal(writes[0].status, 'joined'); assert.ok(writes[0].joined_at); });
  await t.test('empty, invalid and duplicate names do not create users', async () => { for (const display_name of ['', ' ', 'a'.repeat(51), 123, 'a\nb']) assert.equal((await post('/guest', { display_name, confirmed: true })).status, 400); duplicate = true; assert.equal((await post('/guest', { display_name: 'เมย์', confirmed: true })).status, 409); duplicate = false; assert.equal(users.length, 1); });
  await t.test('guest is open to link holders but linked name is not', async () => { assert.equal((await post('/claim/guest-member', { confirmed: true })).status, 200); selectedGuest = false; assert.equal((await post('/claim/guest-member', { confirmed: true })).status, 403); selectedGuest = true; memberExists = false; assert.equal((await post('/claim/guest-member', { confirmed: true })).status, 404); memberExists = true; });
  await t.test('account mode requires a real authenticated account and upserts only that identity', async () => { assert.equal((await post('', { confirmed: true })).status, 401); accountIsGuest = true; assert.equal((await post('', { confirmed: true }, 'guest-session')).status, 403); accountIsGuest = false; assert.equal((await post('', { confirmed: true, user_id: 'another-user' }, 'account-session')).status, 200); assert.equal(writes.at(-1).where.trip_id_user_id.user_id, 'account'); assert.equal(writes.at(-1).create.status, 'joined'); });
  await t.test('old guest session stops working after account is linked', async () => { assert.equal((await post('', { confirmed: true }, 'guest-session')).status, 401); });
  await t.test('invalid invite cannot create a guest', async () => { tripExists = false; assert.equal((await post('/guest', { display_name: 'new', confirmed: true })).status, 404); tripExists = true; assert.equal(users.length, 1); });
  await t.test('pre-added members and legacy merging are retired', async () => { assert.equal((await fetch(base + '/members/add', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ display_name: 'เพื่อน' }) })).status, 410); assert.equal((await post('/merge/old', {})).status, 410); });
});
