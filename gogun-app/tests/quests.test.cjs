const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, f);
const { questDraft, validCompleted } = require('../../gogun-api/src/lib/quest-validation.ts');
test('validates quest targets and progress boundaries', () => {
  assert.deepEqual(questDraft({ title: ' Color Hunter ', description: ' ค้นหาสี ', targets: [' แดง ', 'เขียว'] }), { title: 'Color Hunter', description: 'ค้นหาสี', targets: ['แดง', 'เขียว'] });
  for (const targets of [[], [''], ['แดง', 'แดง'], ['Red', 'red'], Array(13).fill('สี'), ['a'.repeat(81)]]) assert.equal(questDraft({ title: 'Quest', description: '', targets }), null);
  for (const completed of [[-1], [2], [0, 0], ['0'], [0.5], null]) assert.equal(validCompleted(completed, 2), false);
  assert.equal(validCompleted([], 2), true); assert.equal(validCompleted([1, 0], 2), true);
});
let role = 'member', membership = 'joined', questClosed = false, questMissing = false;
const progress = new Map(); let created = 0, readQuery;
const db = {
  trip: { findUnique: async () => ({ allow_member_quests: false }) },
  quest: {
    findMany: async q => { readQuery = q; return []; },
    create: async q => { created++; assert.equal(q.data.trip_id, 'trip'); return { id: 'quest', ...q.data, progress: [] }; },
    findFirst: async q => { assert.equal(q.where.trip_id, 'trip'); return questMissing ? null : { id: 'quest', targets: ['แดง', 'เขียว'], closed: questClosed }; },
    updateMany: async q => { assert.equal(q.where.trip_id, 'trip'); return { count: questMissing ? 0 : 1 }; },
    deleteMany: async q => { assert.equal(q.where.trip_id, 'trip'); return { count: questMissing ? 0 : 1 }; },
  },
  questProgress: { upsert: async q => { progress.set(q.where.quest_id_user_id.user_id, q.update.completed); return q.create; } },
  $queryRaw: async () => [], $transaction: async fn => fn(db),
};
const prismaFile = path.resolve(__dirname, '../../gogun-api/src/lib/prisma.ts'), m = new Module(prismaFile); m.loaded = true; m.exports = db; require.cache[prismaFile] = m;
const express = require('../../gogun-api/node_modules/express');
const router = require('../../gogun-api/src/routes/quests.ts').default;
test('quest permissions and member progress', async t => {
  const app = express(); app.use(express.json()); app.use((req, res, next) => { req.user = { id: req.headers['x-test-user'] || 'me' }; req.tripMember = { role, status: membership }; next(); }); app.use('/trips/:tripId/quests', router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r)); t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/trips/trip/quests`;
  const request = (suffix, method = 'GET', body, user = 'me') => fetch(base + suffix, { method, headers: { 'content-type': 'application/json', 'x-test-user': user }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const draft = { title: 'Color Hunter', description: 'หาสี', targets: ['แดง', 'เขียว'] };
  await t.test('only joined members may read or participate', async () => { for (membership of ['invited', 'declined']) assert.equal((await request('')).status, 403); membership = 'joined'; assert.equal((await request('')).status, 200); assert.equal(readQuery.where.trip_id, 'trip'); assert.equal(readQuery.include.progress.where.user.trip_memberships.some.status, 'joined'); });
  await t.test('members cannot create, close or delete quests', async () => { assert.equal((await request('', 'POST', draft)).status, 403); assert.equal((await request('/quest', 'PATCH', { closed: true })).status, 403); assert.equal((await request('/quest', 'DELETE')).status, 403); assert.equal(created, 0); });
  await t.test('organizer can create and manage quests but not cross-trip IDs', async () => { role = 'organizer'; assert.equal((await request('', 'POST', draft)).status, 201); assert.equal((await request('/quest', 'PATCH', { closed: true })).status, 200); assert.equal((await request('/quest', 'PATCH', { closed: 'true' })).status, 400); questMissing = true; assert.equal((await request('/other', 'DELETE')).status, 404); questMissing = false; role = 'member'; });
  await t.test('members update only their own progress, repeat saves are idempotent and undo works', async () => { assert.equal((await request('/quest/progress', 'PUT', { completed: [0], user_id: 'friend' })).status, 200); assert.equal((await request('/quest/progress', 'PUT', { completed: [0] })).status, 200); assert.deepEqual(progress.get('me'), [0]); assert.equal(progress.has('friend'), false); await request('/quest/progress', 'PUT', { completed: [1] }, 'friend'); await request('/quest/progress', 'PUT', { completed: [] }); assert.deepEqual(progress.get('me'), []); assert.deepEqual(progress.get('friend'), [1]); });
  await t.test('closed quests, another trip and invalid targets cannot be changed', async () => { questClosed = true; assert.equal((await request('/quest/progress', 'PUT', { completed: [0] })).status, 409); questClosed = false; questMissing = true; assert.equal((await request('/other/progress', 'PUT', { completed: [0] })).status, 404); questMissing = false; assert.equal((await request('/quest/progress', 'PUT', { completed: [2] })).status, 400); assert.deepEqual(progress.get('me'), []); });
});
