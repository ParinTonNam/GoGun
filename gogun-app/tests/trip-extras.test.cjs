const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (m, file) => m._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, file);
const { daysUntil, tripCountdown, expenseInsights } = require('../src/lib/trip-insights.ts');
const { outstandingTransfers } = require('../../gogun-api/src/lib/outstanding.ts');
const bill = (currency = 'THB') => ({ paid_by_user_id: 'a', total_amount: '1000', currency, category: 'อาหาร', splits: [{ user_id: 'a', amount: '200' }, { user_id: 'b', amount: '800' }] });
test('calendar countdown uses local dates across month and year boundaries', () => {
  assert.equal(daysUntil('2027-01-01', new Date(2026, 11, 31, 23, 59)), 1);
  assert.equal(daysUntil('2026-09-10', new Date(2026, 8, 10, 0, 1)), 0);
  assert.equal(daysUntil('2026-09-09', new Date(2026, 8, 10)), -1);
  assert.equal(tripCountdown({ archived_at: '2026-09-10' }), 'เก็บประวัติแล้ว');
});
test('budget is the actual personal split, not total divided equally; currencies never mix', () => {
  const stats = expenseInsights([bill(), bill('JPY')], { currency: 'THB', budget_per_person: '1000' }, 'b');
  assert.equal(stats.total, 1000); assert.equal(stats.share, 800); assert.equal(stats.ratio, .8);
  assert.equal(stats.mixedCurrency, true); assert.deepEqual(stats.categories, [['อาหาร', 1000]]);
  assert.equal(expenseInsights([], { currency: 'THB', budget_per_person: null }, 'b').ratio, 0);
});
test('confirmed repayment reduces or clears debt without changing expense total', () => {
  const paid = { from_user_id: 'b', to_user_id: 'a', amount: 300, currency: 'THB' };
  assert.deepEqual(outstandingTransfers([bill()], [paid]), [{ from_user_id: 'b', to_user_id: 'a', amount: 500, currency: 'THB' }]);
  assert.deepEqual(outstandingTransfers([bill()], [{ ...paid, amount: 800 }]), []);
});
test('settlement keeps different currencies separate', () => {
  const results = outstandingTransfers([bill(), bill('JPY')], [{ from_user_id: 'b', to_user_id: 'a', amount: 800, currency: 'THB' }]);
  assert.deepEqual(results, [{ from_user_id: 'b', to_user_id: 'a', amount: 800, currency: 'JPY' }]);
});
