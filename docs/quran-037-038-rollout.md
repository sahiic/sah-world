# Quran migrations 037 and 038 — production verification

Applied 2026-10-08 in the authenticated production SQL editor, in order **037 → 038**, inside one transaction. Migration history contains both versions. No credentials or service URLs are recorded here.

## Safety fixes included

- 037 expands both browsing and request eligibility to `helper` / `fluent`; existing self-request, quota and cooldown protections remain.
- 038 allows only a sender's own undeleted message within 15 minutes to be edited or soft-deleted. The receiver can only mark it read, not forge edit/delete metadata.
- Message identity/routing fields are immutable. Null, empty and oversized edits are rejected. Anonymous callers cannot execute the new RPCs.

## Preservation

Transaction-local snapshots compared every pre-existing message and appointment by ID and content checksum before commit. All comparisons passed. The short transaction held write locks with a five-second lock timeout; a failed comparison would have rolled the entire migration back.

- Messages: **12 → 12**, unchanged (new metadata fields remain null).
- Appointments: **5 → 5**, unchanged.
- No live message was edited/deleted for testing. Behavioral tests used an isolated synthetic PostgreSQL fixture instead.

## Three production checks

1. `browse_quran_helpers` and `send_quran_peer_request`: both include fluent readers, both security-definer, authenticated execution allowed, anonymous execution denied. **2 rows returned.**
2. `chat_messages.edited_at` and `deleted_at`: both nullable `timestamp with time zone`. **2 rows returned.**
3. Edit/delete RPCs: sender and 15-minute constraints present, authenticated-only access; guard trigger enabled; migration versions registered; preservation counts and null metadata confirmed. **7 rows returned; all boolean checks true.**

The SQL stored in the migration registry matches the applied definitions. The only later file change is replacing the obsolete "not yet applied" comment with this verification reference.

## Release follow-up — 2026-10-09

Production migration versions, columns, RPC signatures and preservation counts were rechecked successfully. The combined release also includes PR #67's visual commits and fixes a pre-existing guest/demo loading state that prevented secondary Quran tabs from rendering. Regression tests follow the accessible `tab` roles and dated calendar filenames; no assertions about data ownership, privacy or learning outcomes were removed.
