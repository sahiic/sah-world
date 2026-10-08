const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    f,
  );
const social = require("../src/lib/quranSocial.ts");
test("weekly calendar uses the Istanbul day at UTC week boundaries", () => {
  const days = social.quranWeek(new Date("2026-10-04T22:30:00Z"));
  assert.equal(social.istanbulDay(days[0]), "2026-10-05");
  assert.equal(social.istanbulDay(days[6]), "2026-10-11");
});
test("Istanbul chat date separators cross midnight correctly", () => {
  const now = new Date("2026-10-07T22:00:00Z");
  assert.equal(social.chatDateLabel("2026-10-07T21:30:00Z", now), "Bugün");
  assert.equal(social.chatDateLabel("2026-10-07T20:30:00Z", now), "Dün");
  assert.equal(
    social.chatDateLabel("2026-10-01T12:00:00Z", now),
    "1 Ekim 2026",
  );
});
test("realtime merge preserves receipts and deduplicates concurrent send/snapshot", () => {
  const m = {
    id: "a",
    created_at: "2026-10-07T10:00:00Z",
    content: "hello",
    is_read: true,
  };
  const rows = social.mergeChatMessages(
    [m],
    [
      { ...m, is_read: false },
      { ...m, id: "b" },
    ],
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[0].is_read, true);
});
test("unread badges classify contexts instead of counting every pair message twice", () => {
  assert.deepEqual(
    social.quranUnreadCounts([
      { kind: "peer", unread_count: 2 },
      { kind: "appointment", unread_count: 3 },
    ]),
    { peers: 2, appointments: 3 },
  );
});
test("calendar contains UTC times and no private lesson notes", () => {
  const ics = social.appointmentCalendar({
    id: "fixture",
    hoca_name: "Name, Person",
    scheduled_start: "2026-10-07T12:00:00+03:00",
    scheduled_end: "2026-10-07T12:30:00+03:00",
    topic_notes: "PRIVATE",
  });
  assert.ok(ics.includes("DTSTART:20261007T090000Z"));
  assert.ok(ics.includes("Name\\, Person"));
  assert.ok(!ics.includes("PRIVATE"));
});
