# Kur’an kardeşliği V2

## Changes

The existing peer entry point now delegates to ten focused components in
`src/components/quran/peer`. Existing chat, presence and study rooms are reused.
Profiles are optional for old conversations, but required for smart discovery
and automatic matching. Discovery requires an explicit visibility opt-in.

Compatibility is a score, not a success probability: level 40/25/15 points,
same goal 15, same surah 10, overlapping availability 20, activity in the last
seven days 10, new partner 5. Weekly availability is compared in each person's
IANA timezone. Discovery displays up to 60 candidates; automatic matching
searches the complete opted-in queue. A transaction advisory lock and trigger
prevent a second active relation. Historical matches are not overwritten.

Shared sessions start only after both participants are ready. Completion is
checked against database time. Shared totals include a session only after both
participants finish. Page counts are self-reported, not verified reading.
The current implementation polls visible pages (15 seconds for discovery,
10 seconds for workspace); presence/chat retain their existing realtime code.
Reading reminders are in-app, not push notifications. No voice calling added.

## Deployment order

Apply only these reviewed migrations, in order, before deploying the UI:

1. `2026101700_quran_peer_pairing_queue.sql` (idempotent queue prerequisite)
2. `2026101701_quran_peer_profiles.sql`
3. `2026101702_smart_peer_matching.sql`
4. `2026101703_peer_study_sessions.sql`
5. `2026101704_peer_progress_tracking.sql`

Do not run a blanket database push against an unknown migration history.
Use the authenticated production administrator workflow; never paste keys or
connection strings into source, logs or PR descriptions. No existing user rows
or historical matches need to be deleted, backfilled, or overwritten.

Verify the five new tables have RLS enabled, the new functions exist, anonymous
execution is denied, and two dedicated test accounts can opt in and match.
Do not use real users as test partners. Check an existing conversation still
opens before making the deployment public. If SQL has not been applied, old
chat/rooms remain available but the new profile UI shows a recoverable error.

Rollback the UI deployment if required; retain the new tables and records.
Do not drop tables containing user data as a rollback shortcut.

## Validation

- `npm run test:unit`
- `node scripts/test-quran-social-database.cjs` (isolated PGlite, never production)
- `npx playwright test --config=playwright.social.config.ts`
- `npx eslint src/components/quran/peer src/components/quran/PeerMatching.tsx`
- `npm run build`

SQL checks cover profile validation, scoring, opt-in, one-partner guard,
two-party ready/completion gates, progress and outsider/anonymous access.
Browser fixtures cover onboarding, discovery, queue, existing chat and request
flows at desktop and mobile widths. Fixtures are loopback-only synthetic data;
they do not prove production migration or realtime delivery. Distributed
production load has not been tested.
