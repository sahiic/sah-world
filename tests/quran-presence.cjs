const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript"),
  Module = require("node:module");
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
test("actual presence hook is private, deduplicated, throttled, visibility-aware and cleans stale subscriptions", async () => {
  const effects = [],
    registry = [],
    created = [],
    removed = [],
    events = new Map();
  let state;
  const oldLoad = Module._load,
    oldWindow = global.window,
    oldDocument = global.document;
  global.window = { setInterval: () => 1, clearInterval: () => {} };
  global.document = {
    visibilityState: "visible",
    addEventListener: (k, f) => events.set(k, f),
    removeEventListener: (k) => events.delete(k),
  };
  function channel(topic, options) {
    const c = {
      topic: "realtime:" + topic,
      options,
      tracks: [],
      untracks: 0,
      sync: null,
      presenceState: () => ({
        partner: [{ userId: "partner", typing: true, typingAt: Date.now() }],
      }),
      on(_e, _f, cb) {
        c.sync = cb;
        return c;
      },
      subscribe(cb) {
        cb("SUBSCRIBED");
        return c;
      },
      track(p) {
        c.tracks.push(p);
        return Promise.resolve("ok");
      },
      untrack() {
        c.untracks++;
        return Promise.resolve("ok");
      },
    };
    registry.push(c);
    created.push(c);
    return c;
  }
  const client = {
    getChannels: () => registry.slice(),
    channel,
    removeChannel: async (c) => {
      removed.push(c);
      registry.splice(registry.indexOf(c), 1);
    },
  };
  Module._load = function (id, p, m) {
    if (id === "react")
      return {
        useEffect: (f) => effects.push(f),
        useRef: (v) => ({ current: v }),
        useMemo: (f) => f(),
        useState: (v) => [
          v,
          (next) => {
            state = next;
          },
        ],
      };
    if (id === "@/lib/supabase") return { supabase: client };
    return oldLoad.call(this, id, p, m);
  };
  const cleanups = [];
  try {
    const {
      useQuranPresence,
    } = require("../src/components/quran/useQuranPresence.ts");
    const stale = channel("quran:context:one", { config: { private: true } });
    const hook = useQuranPresence(["one", "one", "two"], "viewer", true);
    cleanups.push(...effects.splice(0).map((f) => f()));
    await new Promise(setImmediate);
    assert.ok(removed.includes(stale));
    assert.equal(registry.length, 2);
    assert.equal(created.length, 3);
    for (const c of registry) {
      assert.equal(c.options.config.private, true);
      assert.equal(c.options.config.presence.key, "viewer");
    }
    const one = registry.find((c) => c.topic === "realtime:quran:context:one");
    one.sync();
    assert.equal(state.identity, "viewer");
    assert.ok(state.online.has("partner"));
    assert.ok(state.typing.has("one"));
    hook.setTyping("one", true);
    hook.setTyping("one", true);
    hook.setTyping("one", true);
    assert.equal(
      one.tracks.filter((p) => p.typing).length,
      1,
      "keystrokes do not flood Presence",
    );
    hook.setTyping("one", false);
    assert.equal(one.tracks.at(-1).typing, false);
    global.document.visibilityState = "hidden";
    events.get("visibilitychange")();
    assert.equal(one.untracks, 1);
    global.document.visibilityState = "visible";
    events.get("visibilitychange")();
    assert.equal(one.tracks.at(-1).typing, false);
    cleanups.splice(0).forEach((f) => f());
    assert.equal(registry.length, 0);
    assert.equal(events.size, 0);
    useQuranPresence(["one"], "viewer", false);
    effects.splice(0).forEach((f) => f());
    assert.equal(registry.length, 0, "opt-out publishes no identity");
  } finally {
    cleanups.forEach((f) => f());
    Module._load = oldLoad;
    global.window = oldWindow;
    global.document = oldDocument;
  }
});
