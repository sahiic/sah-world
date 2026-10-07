# Günlük redesign — validation and release notes

Date: 2026-10-07. Production baseline: `7f1f59300c410fc02efee552d1f2adf12fcdbce9`.
Implementation is isolated on `codex/journal-redesign`; the user's separate Quran feature branch and unmerged changes are not included.

## Delivered

- Quiet, single-column writing surface with compact date, ritual, mode and mood controls; one H1 and no promotional hero or decorative notebook.
- Yaz / Geçmiş navigation and keyboard-operable Araçlar menu. Matrix, gratitude and lessons tools and their old URLs remain available.
- Auto-growing plain-text editor, optional field accordions, non-destructive writing questions, read-only past pages and real activity trail.
- Account-scoped paginated archive with Turkish-normalized all-field search, combined date/ritual filters, calendar and truthful incomplete/error states.
- Original account/date/ritual draft keys, last-character flushing, confirmed device-storage status, recoverable corrupt drafts, quota warnings and manual cloud saving.
- Stable record UUIDs/timestamps, separate existing fields, existing rewards and linked gratitude update behavior. Repeated saving does not create new IDs or extra rewards.
- Scoped light/dark styling, measured AA text contrast, keyboard focus, 44px controls and reduced-motion support.

## Validation

- `npm run test:unit`: **36 passed**. Includes account isolation, capped pagination, stale responses, offline outbox ownership, draft-storage failures and linked gratitude fixtures.
- Complete Playwright run using system Chrome: **41 passed, 1 failed**. Every journal test passed on desktop and mobile, including last-character navigation, all fields, modes, archive, readonly history, corrupt draft recovery and storage quota handling.
- The remaining failure is the pre-existing mobile Quran appointment-chat send button being covered by the bottom navigation. Reproduced independently in an untouched baseline worktree and also present in [baseline CI](https://github.com/sahiic/sah-world/actions/runs/37536195966/job/112517621461). The failing test was not weakened or removed; no Quran product code was changed.
- Changed-file lint: **passed**. `npm run build`: **passed**, including TypeScript and production route generation.
- Viewports checked: 375, 390, 768, 1440 and 1920 CSS pixels. The main editor starts within the first 480px at 1440×900 and 390×844, with minimum writing heights of 220px and 170px respectively. No horizontal overflow in the checked layouts. Enlarged text, long Turkish content, dark mode and a reduced-height mobile viewport were exercised.
- Network/identity and cloud acknowledgement checks use explicit test fixtures; these are **not** claims of testing real authenticated Supabase writes. No real private journal content was used in screenshots, logs or test records.

## Before / after

| View | Before | After |
| --- | --- | --- |
| Desktop | [Before](validation/journal/before-desktop.png) | [After](validation/journal/after-desktop.png) |
| Mobile | [Before](validation/journal/before-mobile.png) | [After](validation/journal/after-mobile.png) |

Screenshots show synthetic developer-test data only.

## Publication

Release through the existing repository's `main` branch and existing Vercel project `eyuperenn1/sah-world`, not a duplicate project. No Vercel account, environment variable, Supabase project, policy or schema changes are included. The final handoff records the verified production commit and deployment result separately; a local build alone is not publication proof.

## Deliberately deferred

Tag editing, data export and optional reminders are follow-up work. No inactive buttons promise those features. Media upload, AI analysis, PIN locking, new notifications, mood analytics and new rewards remain out of scope.
