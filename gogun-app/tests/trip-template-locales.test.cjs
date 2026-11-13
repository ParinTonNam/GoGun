const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  module._compile(output, filename);
};

const { TRIP_TEMPLATES, getTemplate } = require("../src/lib/trip-templates.ts");
const { localizeTemplate } = require("../src/lib/trip-template-locales.ts");

test("every editorial trip has complete English copy and leaves Thai source unchanged", () => {
  for (const source of [...TRIP_TEMPLATES, getTemplate("bangsaen"), getTemplate("ayutthaya")]) {
    assert.ok(source);
    const before = structuredClone(source);
    const translated = localizeTemplate(source, "en");
    assert.notStrictEqual(translated, source, source.id);
    assert.deepEqual(source, before, `source changed: ${source.id}`);
    assert.deepEqual(translated.tags, source.tags, `filter tags changed: ${source.id}`);
    assert.equal(translated.days.length, source.days.length, source.id);
    for (const text of [translated.name, translated.destination, translated.meta]) {
      assert.doesNotMatch(text, /[\u0e00-\u0e7f]/, `${source.id}: ${text}`);
    }
    translated.days.forEach((day, dayIndex) => {
      assert.equal(day.activities.length, source.days[dayIndex].activities.length, source.id);
      for (const text of [day.label, ...day.activities.flatMap(({ title, description }) => [title, description])]) {
        assert.ok(text);
        assert.doesNotMatch(text, /[\u0e00-\u0e7f]/, `${source.id}: ${text}`);
      }
    });
    assert.strictEqual(localizeTemplate(source, "th"), source);
  }
});
