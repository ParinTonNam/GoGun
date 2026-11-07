// Local app, mocked API only. Run after starting the frontend.
// Set PLAYWRIGHT_MODULE_PATH to an installed playwright module when not local.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const origin = process.env.GOGUN_TEST_URL || 'http://localhost:3000';
const output = path.resolve(__dirname, '../test-results/structure');
const host = { id: 'host', display_name: 'เมย์', username: 'may', avatar_color: '#c0613e', email: 'may@example.test', is_guest: false, phone: null, created_at: '2026-09-01' };
const friend = { ...host, id: 'friend', username: 'friend', display_name: 'เพื่อนร่วมทริป', email: 'friend@example.test' };
const trip = { id: 'structure-check', name: 'เขาใหญ่กับเพื่อน ทริปทดสอบโครงสร้าง', destination: 'เขาใหญ่', icon: '⛰️', trip_type: 'overnight', duration_days: 2,
  proposed_start_date: '2026-10-17', confirmed_start_date: null, date_status: 'proposed', currency: 'THB', invite_code: 'fixture-invite', organizer_id: host.id,
  budget_per_person: 2500, allow_member_expenses: false, allow_member_itinerary_edit: false, allow_member_invite: false, created_at: '2026-09-01', organizer: host,
  members: [host, friend].map((user, index) => ({ id: `member-${index}`, trip_id: 'structure-check', user_id: user.id, role: index ? 'member' : 'organizer', status: 'joined', joined_at: '2026-09-01', user })),
};
const days = [{ id: 'day-one', trip_id: trip.id, day_number: 1, date: '2026-10-17', label: 'ออกเดินทาง', activities: [{ id: 'act-one', day_id: 'day-one', time: '09:00', title: 'เจอกันที่จุดนัดหมายและออกเดินทางไปเขาใหญ่', sort_order: 0 }] }];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const role of ['host', 'friend']) {
      const page = await browser.newPage();
      const me = role === 'host' ? host : friend;
      page.on('pageerror', (error) => errors.push(`${role}: ${error.message}`));
      let created = 0;
      let answers = [];
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== new URL(origin).origin) { await route.abort(); return; }
        if (!url.pathname.startsWith('/api/v1/')) { await route.continue(); return; }
        const resource = url.pathname.slice('/api/v1'.length);
        let data;
        if (resource === '/auth/me') data = me;
        else if (resource === '/trips') { data = route.request().method() === 'POST' ? trip : [trip]; if (route.request().method() === 'POST') created++; }
        else if (resource === `/trips/${trip.id}`) data = trip;
        else if (resource.endsWith('/itinerary')) data = days;
        else if (resource.endsWith('/availability/me')) data = answers;
        else if (resource.endsWith('/availability') && route.request().method() === 'PUT') { answers = route.request().postDataJSON(); data = {}; }
        else if (resource.endsWith('/balance')) data = { total_amount: 0, currency: 'THB', member_count: 2, balances: [host, friend].map(user => ({ user_id: user.id, display_name: user.display_name, avatar_color: user.avatar_color, paid: 0, share: 0, net: 0 })) };
        else if (resource.endsWith('/members')) data = trip.members;
        else data = [];
        await route.fulfill({ status: resource === '/trips' && route.request().method() === 'POST' ? 201 : 200, contentType: 'application/json', body: JSON.stringify({ data }) });
      });
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const suffix of ['', '/plan', '/group', '/expenses', '/availability', '/availability/compare', '/itinerary', '/tools/checklist', '/tools/packing', '/tools/vote', '/tools/wheel', ...(role === 'host' ? ['/share', '/settings', '/members', '/expenses/add'] : [])]) {
          await page.goto(`${origin}/trips/${trip.id}${suffix}`, { waitUntil: 'networkidle' });
          await page.locator('.trip-workspace').waitFor();
          assert.equal(await page.getByText('Application error', { exact: false }).count(), 0, suffix);
          const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
          assert.ok(sizes.document <= sizes.viewport + 1, `${role} ${width} ${suffix}: horizontal overflow ${JSON.stringify(sizes)}`);
          const nav = page.locator(width >= 1024 ? '.workspace-sidebar nav' : '.workspace-mobile-nav');
          assert.equal(await nav.isVisible(), true);
          assert.equal(await nav.locator('a').count(), 4);
          if (suffix === '' || suffix === '/plan') await page.screenshot({ path: path.join(output, `${role}-${width}-${suffix ? 'plan' : 'overview'}.png`), fullPage: true });
        }
      }
      for (const [old, canonical] of [['/member', ''], ['/member/availability', '/availability'], ['/member/wallet', '/expenses'], ['/member/wallet/add', '/expenses/add'], ['/tools', '/group']]) {
        await page.goto(`${origin}/trips/${trip.id}${old}?edit=old-bill`, { waitUntil: 'networkidle' });
        assert.equal(new URL(page.url()).pathname, `/trips/${trip.id}${canonical}`);
        assert.equal(new URL(page.url()).searchParams.get('edit'), 'old-bill');
      }
      if (role === 'friend') {
        await page.goto(`${origin}/trips/${trip.id}/settings`, { waitUntil: 'networkidle' });
        assert.equal(await page.getByText('หน้านี้ต้องได้รับสิทธิ์จากคนจัดทริป').count(), 1);
      } else {
        await page.goto(`${origin}/trips/new`, { waitUntil: 'networkidle' });
        await page.getByLabel('ชื่อทริป (จำเป็น)').fill('ทริปใหม่จากแบบฟอร์ม');
        await page.getByRole('button', { name: 'สร้างทริปและชวนเพื่อน' }).click();
        await page.waitForURL(`**/trips/${trip.id}/share`);
        assert.equal(created, 1);
        assert.ok(await page.getByLabel('ลิงก์เชิญ').inputValue());
      }
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log('Responsive routes, legacy links, role gates and creation passed with mock API.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
