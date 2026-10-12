# Quran module audit

The request describes an older 2,878-line core view. Main already includes the
PR #82 split: a two-line compatibility entry point, a <200-line orchestrator,
three lazy tabs, and separate controller, teaching, chat and exercise modules.

This follow-up extracts the existing reader tab as `QuranReaderPanel`, the
archive composer as `QuranNoteEditor`, and the study summary as
`QuranProgressPanel`. Existing imports remain compatible. Form names,
validation, callbacks, database queries and storage are unchanged.

There are no independent tafsir reader, bookmark collection, Quran search or
font-settings panels in the current companion. Tafsir is a note field;
search is the global command palette. Creating empty files with those names
would not be a refactor. Those new features are deliberately not fabricated.
