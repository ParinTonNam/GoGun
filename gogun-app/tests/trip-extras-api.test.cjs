const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
require.extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, file);
function mock(file, exports) { const name = path.resolve(__dirname, '../../gogun-api/src', file); const m = new Module(name); m.exports = exports; m.loaded = true; require.cache[name] = m; }
let member = true, organizer = false, target = false, guest = false, created;
const db = {
  tripMember: { findUnique: async () => member ? { role: organizer ? 'organizer' : 'member', status: 'joined' } : null },
  expense: { findFirst: async q => { assert.equal(q.where.trip_id, 'trip'); return target ? { id: 'bill' } : null; } },
  itemComment: { create: async q => { created = q.data; return q.data; }, findMany: async () => [] },
  tripTemplate: { findFirst: async q => { assert.equal(q.where.user_id, 'me'); return null; }, create: async q => q.data },
  trip: { findUniqueOrThrow: async () => ({ name: 'เที่ยว', destination: 'เชียงใหม่', icon: '🌿', trip_type: 'overnight', duration_days: 2, currency: 'THB', budget_per_person: 2000,
    itinerary_days: [{ day_number: 1, label: 'วันแรก', activities: [{ title: 'พบกัน', time: '09:00', sort_order: 0, tags: ['จุดนัดพบ'] }] }], packing_items: [{ text: 'ร่ม', category: 'shared', sort_order: 0 }], checklist_items: [] }),
    create: async q => { created = q.data; return { id: 'new', ...q.data }; }, update: async q => q.data },
};
mock('lib/prisma.ts', db);
mock('middleware/auth.ts', { requireAuth: (req, res, next) => { if (!req.headers.authorization) return res.status(401).json({}); req.user = { id: 'me', is_guest: guest }; next(); } });
const express = require('../../gogun-api/node_modules/express');
const router = require('../../gogun-api/src/routes/trip-extras.ts').default;
test('extras enforce membership, ownership and scoped targets; copies reset financial and membership state', async t => {
  const app = express(); app.use(express.json()); app.use('/trips', router); app.use((req,res) => res.status(404).json({}));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/trips`;
  async function request(url, method = 'GET', body) { return fetch(base + url, { method, headers: { authorization: 'test', 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
  await t.test('outsider cannot copy or read comments', async () => { member = false; assert.equal((await request('/trip/copy', 'POST')).status, 403); assert.equal((await request('/trip/comments/expense/bill')).status, 403); member = true; });
  await t.test('cannot comment on a target from another trip', async () => { target = false; assert.equal((await request('/trip/comments/expense/bill', 'POST', { text: 'hello' })).status, 404); });
  await t.test('member can comment, invalid comments fail', async () => { target = true; assert.equal((await request('/trip/comments/expense/bill', 'POST', { text: '  รวมทิปยัง  ' })).status, 201); assert.equal(created.text, 'รวมทิปยัง'); assert.equal(created.user_id, 'me'); assert.equal((await request('/trip/comments/expense/bill', 'POST', { text: ' ' })).status, 400); });
  await t.test('template access is scoped to owner', async () => { assert.equal((await request('/templates/private/use', 'POST')).status, 404); });
  await t.test('only organizer changes deadline; rejects impossible dates', async () => { assert.equal((await request('/trip/planning-settings', 'PATCH', { archived: true })).status, 403); organizer = true; assert.equal((await request('/trip/planning-settings', 'PATCH', { availability_deadline: '2026-02-31' })).status, 400); assert.equal((await request('/trip/planning-settings', 'PATCH', { availability_deadline: '2026-09-20' })).status, 200); });
  await t.test('copy has only caller as organizer and no old dates, expenses or votes', async () => { assert.equal((await request('/trip/copy', 'POST')).status, 201); assert.equal(created.organizer_id, 'me'); assert.equal(created.members.create.user_id, 'me'); assert.equal(created.confirmed_start_date, undefined); assert.equal(created.expenses, undefined); assert.equal(created.polls, undefined); assert.deepEqual(created.itinerary_days.create[0].activities.create[0].tags, ['จุดนัดพบ']); assert.equal(created.packing_items.create[0].assignees, undefined); guest = true; assert.equal((await request('/trip/copy', 'POST')).status, 403); });
  await t.test('public invitation route is not captured by extras authentication', async () => { assert.equal((await fetch(base + '/join/code')).status, 404); });
});
