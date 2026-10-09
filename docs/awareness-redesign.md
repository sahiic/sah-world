# Mazlum Coğrafyalar — editorial redesign

Branch: `feature/awareness-redesign`. Source review: 9 October 2026.

## Experience

- Compact title, geography selector and XH; three keyboard-accessible tabs: Öğren, Harekete Geç, Bilgi Testi.
- Six short chapters per geography. Reading is an explicit action, not a reward triggered by scrolling past invisible content.
- Timeline, sourced human stories and prayer notes are disclosures under Öğren. Weekly missions, the existing 30-day journey and sharing/support actions are disclosures under Harekete Geç.
- Actual personal progress replaces invented community totals. Prayer samples have no invented engagement; newly entered notes are explicitly session-only, not sent to a community.
- Responsive 620px/900px layouts; dark quiz options have distinct borders and text/icon feedback. Motion preferences and existing AnimatePresence are preserved.

## Content and source policy

The 12 chapters, 20 questions and seven timeline events link to individual pages on Dijital Hafıza and its Doğu Türkistan site. Questions have four distinct options, explanations and varied correct-answer positions. Uncertain camp counts are not presented as settled historical quiz facts. Unverified quotations were replaced with attributed summaries.

Key references:

- [Büyük Felaket](https://www.dijitalhafiza.com/video-belgeseller/buyuk-felaket)
- [Filistinli Mülteciler](https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler)
- [Hind Khoudary](https://www.dijitalhafiza.com/biyografiler/hind-khoudary)
- [İdari Tutukluluk](https://www.dijitalhafiza.com/kavramlar-sozlugu/idari-tutukluluk)
- [1759 historical timeline](https://doguturkistan.dijitalhafiza.com/zaman-tuneli/1759-mancularin-ilk-dogu-turkistan-istilasi)
- [Toplama Kampları](https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/toplama-kamplari)
- [First-person account](https://doguturkistan.dijitalhafiza.com/kose-yazilari/bir-dogu-turkistanlinin-yasadiklari)
- [Abdulweli Ayup](https://doguturkistan.dijitalhafiza.com/biyografiler/abdulweli-ayup)

The boycott catalog contains 36 source-reviewed records in eight categories, each with its own Boykot Dedektifi detail link, parent company, attributed reason, status and local option. It is a curated snapshot, not an automatically synchronized copy of the entire source site. Labels are that site's assessments, not independent certification. Source date and this limitation are visible in the UI.

Examples of corrected records: [Ülker](https://boykotdedektifi.com/b/ulker-301), [Nestlé](https://boykotdedektifi.com/b/nestle-23), [Eti alternative](https://boykotdedektifi.com/b/eti-32). The catalog's source URLs are the authoritative per-entry audit trail.

Unverified legacy catalog entries are not displayed. Their saved preference IDs are not removed. Where a verifiable like-for-like Turkish brand could not be established (such as a processor), the UI honestly suggests local repair/second-hand or independent services instead of inventing a manufacturer. Local options are not a guarantee of boycott suitability or product equivalence.

Existing donation and share links remain utility destinations, not sources for historical chapters or quiz claims. No graphic imagery is introduced.

## Data safety and verification

No migration, schema change, production SQL or data cleanup. Existing XP functions and the `sah:boycotts`, `sah:missions`, `sah:journey-days` keys remain. Catalog IDs stay stable; browser hydration validates malformed values without writing over stored preferences. Repeated quiz completion no longer awards again during the same visit.

Tests added:

- Data integrity: chapter/question counts, unique IDs, answer distribution, source origins, brand-detail URLs, local options and corrected classifications.
- Browser: three tabs, arrow-key navigation, geography switching, search, filters, empty results, preference persistence through reload, dark correct/wrong feedback, repeat quiz reward, tablet overflow, mobile and desktop screenshots.

Browser tests use the repository's existing development-only guest mode and synthetic preferences. They do not claim to verify authenticated production RLS or database writes. Production authentication is unchanged.

Local verification: scoped ESLint passed; all 56 unit tests passed; all eight awareness browser cases passed on desktop/mobile projects (including explicit 900px tablet checks). Dark quiz option text, including correct/wrong states, meets the tested 4.5:1 contrast threshold. A mobile clear-search overflow found by the tests was fixed by bounding the grid and input widths.
