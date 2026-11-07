/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the actual TypeScript modules without adding a test framework.
function loadModule(filename, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, filename), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const context = { exports: {}, ...globals };
  vm.runInNewContext(outputText, context, { filename });
  return context.exports;
}

const draftHelpers = loadModule("trip-creation-draft.ts");

test("minimum calendar date uses local date parts near UTC midnight", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Asia/Bangkok";
    assert.equal(draftHelpers.localCalendarDate(new Date("2026-09-09T18:00:00Z")), "2026-09-10");
    process.env.TZ = "America/Los_Angeles";
    assert.equal(draftHelpers.localCalendarDate(new Date("2026-09-09T01:00:00Z")), "2026-09-08");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("draft restores all entered values unchanged after login", () => {
  const draft = { name: "  เที่ยวกับเพื่อน  ", destination: "เชียงใหม่", startDate: "2026-10-01" };
  const restored = draftHelpers.readTripDraft({
    getItem(key) {
      assert.equal(key, draftHelpers.TRIP_DRAFT_KEY);
      return JSON.stringify(draft);
    },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), draft);
});

test("missing, malformed, or inaccessible storage does not break a new form", () => {
  for (const value of [null, "{", "{}", '{"name":123}']) {
    assert.equal(draftHelpers.readTripDraft({ getItem: () => value }), null);
  }
  assert.equal(draftHelpers.readTripDraft({ getItem() { throw new Error("Denied"); } }), null);
});

test("central API makes one creation POST and returns 401 without redirecting", async () => {
  const calls = [];
  let status = 200;
  const api = loadModule("api.ts", {
    require: (specifier) => {
      if (specifier === "@/lib/demo-trip-data") return { handleDemoRequest: () => assert.fail("Unexpected demo request") };
      throw new Error(`Unexpected import: ${specifier}`);
    },
    process: { env: {} },
    window: { location: { replace() { assert.fail("Unexpected login redirect"); } } },
    localStorage: {
      getItem: () => null,
      removeItem() { assert.fail("Unexpected token removal"); },
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: status === 200, status, json: async () => status === 200
        ? { data: { id: "trip-123" } }
        : { error: { message: "Session expired" } } };
    },
  });
  const body = { name: "Weekend", destination: "ไม่ระบุ", duration_days: 1, currency: "THB", proposed_start_date: "2026-09-10" };
  assert.equal((await api.createTrip(body, { redirectOnUnauthorized: false })).id, "trip-123");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), body);
  status = 401;
  await assert.rejects(api.createTrip(body, { redirectOnUnauthorized: false }), error => error.status === 401);
  assert.equal(calls.length, 2);
  const controller = new AbortController();
  for (const read of [api.getMe, api.getMyTrips]) {
    await assert.rejects(read({ redirectOnUnauthorized: false, signal: controller.signal }), error => error.status === 401);
    assert.equal(calls.at(-1).options.signal, controller.signal);
  }
});
