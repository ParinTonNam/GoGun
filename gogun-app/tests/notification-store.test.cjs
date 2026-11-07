const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../src/lib/notification-store.ts"), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});
const context = { exports: {} };
vm.runInNewContext(outputText, context, { filename: "notification-store.ts" });
const { addTestNotification, readNotifications, markNotificationRead, markAllNotificationsRead, parseNotifications } = context.exports;

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("test notification persists and unread state updates without mixing users", () => {
  const storage = memoryStorage();
  addTestNotification(storage, "user-a", "first", "2026-11-03T10:00:00.000Z");
  addTestNotification(storage, "user-a", "second", "2026-11-03T10:01:00.000Z");
  assert.equal(readNotifications(storage, "user-b").length, 0);
  assert.equal(readNotifications(storage, "user-a").map((item) => item.id).join(","), "second,first");
  assert.equal(readNotifications(storage, "user-a").filter((item) => !item.readAt).length, 2);

  markNotificationRead(storage, "user-a", "second", "2026-11-03T10:02:00.000Z");
  assert.equal(readNotifications(storage, "user-a").filter((item) => !item.readAt).length, 1);
  markAllNotificationsRead(storage, "user-a", "2026-11-03T10:03:00.000Z");
  assert.equal(readNotifications(storage, "user-a").filter((item) => !item.readAt).length, 0);
});

test("invalid saved notification data is ignored", () => {
  assert.equal(parseNotifications("not json").length, 0);
  assert.equal(parseNotifications('{"bad":true}').length, 0);
});
