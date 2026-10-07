const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(
    this,
    request.startsWith("@/")
      ? path.join(__dirname, "../src", request.slice(2))
      : request,
    ...args,
  );
};
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    filename,
  );
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const { useFocusStore: store } = require("../src/stores/focusStore.ts");
const {
  focusStorage,
  focusStorageStatus,
} = require("../src/lib/focusStorage.ts");
function reset() {
  store.setState(store.getInitialState(), true);
}
test("quota failure retains latest snapshot for runtime reads and retries honestly", () => {
  const setItem = global.localStorage.setItem;
  global.localStorage.setItem = () => {
    throw new Error("quota");
  };
  focusStorage.setItem("sah-focus-sanctuary-v1", "latest-in-memory");
  assert.equal(
    focusStorage.getItem("sah-focus-sanctuary-v1"),
    "latest-in-memory",
  );
  assert.ok(focusStorageStatus.snapshot().includes("kaydedilemiyor"));
  global.localStorage.setItem = setItem;
  focusStorage.setItem("sah-focus-sanctuary-v1", "retry-success");
  assert.equal(focusStorage.getItem("sah-focus-sanctuary-v1"), "retry-success");
  assert.equal(focusStorageStatus.snapshot(), "");
});
test("clock retains fractional remainder and catches background elapsed time", () => {
  reset();
  store.getState().startTimer();
  const at = store.getState().lastTickAt;
  store.getState().tick(at + 1900);
  assert.equal(store.getState().timeLeft, 1499);
  store.getState().tick(at + 2800);
  assert.equal(store.getState().timeLeft, 1498);
  store.getState().tick(at + 300000);
  assert.equal(store.getState().timeLeft, 1200);
});
test("paused preferences never reset duration; resume excludes paused time", () => {
  reset();
  store.getState().startTimer();
  store.setState({ lastTickAt: Date.now() - 3000 });
  store.getState().pauseTimer();
  const remaining = store.getState().timeLeft;
  store.getState().updateSettings({ autoStartBreak: true, focusDuration: 90 });
  store.getState().setTimerKind("stopwatch");
  store.getState().setMode("longBreak");
  assert.equal(store.getState().timeLeft, remaining);
  assert.equal(store.getState().focusDuration, 25);
  assert.equal(store.getState().mode, "focus");
  store.getState().startTimer();
  store.getState().tick(store.getState().lastTickAt + 1000);
  assert.equal(store.getState().timeLeft, remaining - 1);
});
test("partial session records exact short duration, no fake minute/reward, completion idempotent", () => {
  reset();
  store.getState().startTimer();
  store.getState().tick(store.getState().lastTickAt + 6000);
  const session = store.getState().completeSession({ completed: false });
  assert.equal(session.duration, 0.1);
  assert.equal(session.completed, false);
  assert.equal(store.getState().coins, 0);
  assert.equal(store.getState().completeSession(), null);
  assert.equal(store.getState().sessions.length, 1);
  assert.equal(store.getState().timeLeft,1500);
});
test("elapsed timer completes once and progresses to short/long breaks", () => {
  reset();
  store.getState().startTimer();
  store.getState().tick(store.getState().lastTickAt + 1800000);
  assert.equal(store.getState().timeLeft, 0);
  assert.equal(store.getState().isRunning, false);
  const session = store.getState().completeSession();
  assert.equal(session.duration, 25);
  assert.equal(store.getState().totalSessions, 1);
  store.getState().dismissCompletion();
  assert.equal(store.getState().timeLeft,1500);
  store.getState().skipToNext();
  assert.equal(store.getState().mode, "shortBreak");
  assert.equal(store.getState().timeLeft, 300);
  store.setState({ mode: "focus", currentRound: 4 });
  store.getState().skipToNext();
  assert.equal(store.getState().mode, "longBreak");
});
