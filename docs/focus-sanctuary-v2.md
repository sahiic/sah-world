# Focus Sanctuary v2 — 7 October 2026

## Research and decisions

Primary product pages inspected: [Forest](https://www.forestapp.cc/), [Session](https://stayinsession.com/), [Session onboarding](https://stayinsession.com/learn/getting-started-with-session-pomodoro-app), [Focus To-Do](https://www.focustodo.cn/?lang=en_US).

These are advertised product patterns, not evidence of a popularity ranking or a user survey. Forest informs the calm scene/ambience and focus/break distinction; Session informs intention → focus → reflection and date/category review; Focus To-Do informs linking tasks with elapsed sessions and reports. Native OS app blocking and cross-device sync are deliberately not promised by this browser-only implementation.

## Delivered

- One centered timer, one task pill, three duration presets; main action and reset/finish stay together. Duration/sound/scene are three consistent setting cards. Fullscreen and timeline are top-right.
- Session/history tabs; searchable, date-filtered, paginated history. The vertical native meter causing overflow is replaced with bounded SVG bars. Partial sessions are labeled and do not earn completion rewards or fabricated minutes.
- Four licensed, real sacred-location photos, three existing landscapes and a plain option. Al-Aqsa is the actual Qibli mosque, not a mislabeled Dome of the Rock. See the public photo credits and selector attribution.
- Fifteen locally synthesized ambience layers, individual/master volume, mute and saved mixtures. No missing MP3 requests, fabricated recitation, or dependence on a third-party audio host. These are synthesized textures, not field recordings.
- A root-owned clock and small timer shared by `/focus` and the embedded focus view; survives navigation, reload, paused time, background throttling and storage updates from another tab. Web Locks serialize clock/completion writes where supported. Older legacy widget/history are retained for backward compatibility.
- Modal keyboard containment, focus restoration, Escape, reduced-motion behavior, accessible timer and visible button labels.
- Storage-denied/quota failures retain the latest in-memory clock, display an honest warning, and retry persistence; reconciliation never overwrites the unsaved clock with an older disk value.

## Persistence and boundaries

The current sanctuary store retains its existing `sah-focus-sanctuary-v1` storage key. Records/preferences live in this browser; they are not silently uploaded to a database and are not cross-device synced. A closed browser cannot play sound or deliver a running-page notification: elapsed time is reconciled on return. Browser policies may require a user gesture to resume audio. Private accounts, database schema, historical journey records and unrelated awareness edits are untouched.

## Verification

Unit tests exercise fractional tick accuracy, long background gaps, pause/resume, preference safety, partial durations, idempotent completion and breaks. Browser tests cover desktop/mobile, both entrypoints, all scenes loading, 15 actual nonzero audio signals, mute, mini timer, reload, two tabs, bounded large charts, filtering and completion. Build and changed-file lint are release gates. Whole-repository lint currently has unrelated existing Quran/tests errors; do not hide these by weakening lint rules.
