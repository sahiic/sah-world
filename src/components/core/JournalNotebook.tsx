'use client';

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/AppIcon';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useJournalGratitude } from '@/hooks/useJournalGratitude';
import { buildActivityFeed, dayKey } from '@/lib/activity';
import { recordXpEvent } from '@/lib/xp';
import { ensureUUID, useJourneyStore } from '@/store/useJourneyStore';
import { useAuthStore } from '@/store/useAuthStore';
import { DebouncedDrafts } from '@/lib/debouncedDrafts';
import { flushJournalOutbox, JOURNAL_STATUS_EVENT, journalOwner, journalWritesAfter, type JournalWriteStatus } from '@/lib/journalOutbox';
import { journalDateLabel, journalPreview, JOURNAL_MOODS, validJournalDate, type JournalRitual } from '@/lib/journalPresentation';
import type { IntegratedActivity, JournalEntry, SukurEntry } from '@/types';

type EntryMode = 'quick' | 'full';
type Draft = { mood: number; energy: number; stress: number; sleep: number; content: string; moments: string[]; gratitude: string[]; selfNote: string; intention: string; challenge: string };
type DraftStatus = 'idle' | 'writing' | 'stored' | 'error';
const emptyDraft = (): Draft => ({ mood: 3, energy: 7, stress: 3, sleep: 7, content: '', moments: ['', '', ''], gratitude: ['', '', ''], selfNote: '', intention: '', challenge: '' });
const initialRitual = (): JournalRitual => new Date().getHours() < 12 ? 'sabah' : 'aksam';
function rememberedMode(): EntryMode { try { return typeof window !== 'undefined' && window.localStorage.getItem('sah-journal-last-mode') === 'full' ? 'full' : 'quick'; } catch { return 'quick'; } }
function moveDate(value: string, amount: number) { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + amount); return dayKey(date); }
function awardFor(ritual: JournalRitual, mode: EntryMode) { return ritual === 'sabah' ? mode === 'quick' ? 15 : 20 : mode === 'quick' ? 20 : 50; }
function validDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return ['content', 'selfNote', 'intention', 'challenge'].every(key => typeof row[key] === 'string')
    && ['mood', 'energy', 'stress', 'sleep'].every(key => typeof row[key] === 'number' && Number.isFinite(row[key]))
    && ['moments', 'gratitude'].every(key => Array.isArray(row[key]) && (row[key] as unknown[]).every(item => typeof item === 'string'));
}

export default function JournalNotebook({ onNavigate, entries, requestedDate, requestedRitual, onToday, loading = false, recordsReady = true }: {
  onNavigate: (view: string) => void; entries?: JournalEntry[]; requestedDate?: string; requestedRitual?: JournalRitual; onToday?: () => void; loading?: boolean; recordsReady?: boolean;
}) {
  const store = useJourneyStore();
  const today = dayKey(new Date());
  const journal = entries ?? store.journal;
  const [selectedDate, setSelectedDate] = useState(requestedDate ?? today);
  const [ritual, setRitual] = useState<JournalRitual>(requestedRitual ?? initialRitual);
  const [mode, setMode] = useState<EntryMode>(rememberedMode);
  const [draft, setDraftState] = useState<Draft>(emptyDraft);
  const [notice, setNotice] = useState('');
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [writeStatus, setWriteStatus] = useState<JournalWriteStatus>('local');
  const owner = useAuthStore(state => state.user?.id ?? state.session?.user.id ?? 'local');
  const draftRef = useRef(draft);
  const dirty = useRef(false);
  const loadedPage = useRef<string | null>(null);
  const submittedPage = useRef<string | null>(null);
  const corruptDraft = useRef<{ key: string; raw: string } | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const helper = useRef<HTMLDetailsElement>(null);
  const [helpQuestion, setHelpQuestion] = useState('');
  const draftKey = `sah-journal-draft-v1:${owner}:${selectedDate}:${ritual}`;
  const isToday = selectedDate === today;
  const cache = useMemo(() => new DebouncedDrafts<Draft>({
    getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value),
  }, () => { setDraftStatus('error'); setNotice('Cihaz depolamasına yazılamadı. Metnini kopyalayarak koru; kaydedildi olarak işaretlenmedi.'); }, 600,
  // eslint-disable-next-line react-hooks/refs -- invoked after storage writes, never during render
  key => { if (loadedPage.current === key) setDraftStatus('stored'); }), []);
  const dayEntries = useMemo(() => journal.filter(item => item.date === selectedDate), [journal, selectedDate]);
  const entry = dayEntries.find(item => item.ritualType === ritual) ?? (ritual === 'aksam' ? dayEntries.find(item => !item.ritualType) : undefined);
  const gratitudeLink = useJournalGratitude(selectedDate);
  const gratitudeEntry = gratitudeLink.entry;
  const activity = useActivityLog(selectedDate, selectedDate);
  const localActivities = useMemo<IntegratedActivity[]>(() => buildActivityFeed(store).filter(item => dayKey(item.createdAt) === selectedDate).map(item => ({ id: item.id, category: item.category, label: item.label, detail: item.detail, xp: item.xp, occurredAt: item.createdAt, sourceView: item.category === 'profession' ? 'profession-school' : item.category })), [selectedDate, store]);
  const guest = useAuthStore(state => state.session?.access_token === 'mock-token' || !state.user);
  const trail = (activity.items.length || !guest ? activity.items : localActivities).filter(item => item.category !== 'journal' && dayKey(item.occurredAt) === selectedDate);
  const memories = useMemo(() => {
    const dates = [7, 30, 90, 180, 365].map(days => ({ days, date: moveDate(today, -days) }));
    return dates.flatMap(target => journal.filter(item => item.date === target.date).map(item => ({ days: target.days, entry: item })));
  }, [journal, today]);

  const setDraft: React.Dispatch<React.SetStateAction<Draft>> = next => {
    if (!isToday) return;
    const value = typeof next === 'function' ? next(draftRef.current) : next;
    draftRef.current = value; dirty.current = true; setDraftState(value); setWriteStatus('local');
    if (corruptDraft.current?.key === draftKey) { setDraftStatus('error'); return; }
    setDraftStatus('writing'); cache.stage(draftKey, value);
  };

  // Synchronize navigation and account-scoped storage before exposing inputs.
  // Do not rehydrate a dirty draft when a late server response/store update arrives.
  /* eslint-disable react-hooks/set-state-in-effect -- external account-scoped draft hydration must finish before paint */
  useLayoutEffect(() => {
    setSelectedDate(requestedDate ?? today);
    if (requestedRitual) setRitual(requestedRitual);
  }, [requestedDate, requestedRitual, today]);
  useLayoutEffect(() => {
    if (loadedPage.current === draftKey && (dirty.current || submittedPage.current === draftKey)) return;
    const pageChanged = loadedPage.current !== draftKey;
    const fallback: Draft = { ...emptyDraft(), mood: entry?.mood ?? 3, energy: entry?.energy ?? 7, stress: entry?.stress ?? 3, sleep: entry?.sleep ?? 7,
      content: entry?.content ?? '', moments: entry?.moments?.length ? entry.moments : ['', '', ''],
      gratitude: entry?.gratitudeText ? entry.gratitudeText.split(' · ') : gratitudeEntry?.nimets?.length ? gratitudeEntry.nimets : ['', '', ''],
      selfNote: entry?.selfNote ?? '', intention: entry?.intentionText ?? '', challenge: entry?.expectedChallengeText ?? '',
    };
    let restored: Draft | null = null;
    if (pageChanged) { corruptDraft.current = null; setNotice(''); setHelpQuestion(''); }
    // Past entries are authoritative, read-only records, never unsaved local drafts.
    if (isToday) {
      try {
        const value = cache.load(draftKey);
        if (value !== null && !validDraft(value)) throw new Error('invalid_draft');
        restored = value;
      } catch {
        try { const raw = window.localStorage.getItem(draftKey); if (raw) corruptDraft.current = { key: draftKey, raw }; } catch { /* storage may be unavailable */ }
        setDraftStatus('error'); setNotice('Yerel taslak okunamadı; eski taslak silinmedi. Metnini kopyalayabilir veya korumayı yeniden deneyebilirsin.');
      }
    }
    const values = restored ?? fallback;
    draftRef.current = { ...values, moments: Array.from({ length: Math.max(3, values.moments.length) }, (_, i) => values.moments[i] ?? ''), gratitude: Array.from({ length: Math.max(3, values.gratitude.length) }, (_, i) => values.gratitude[i] ?? '') };
    dirty.current = Boolean(restored && JSON.stringify(restored) !== JSON.stringify(fallback));
    loadedPage.current = draftKey;
    if (pageChanged) { submittedPage.current = null; setWriteStatus('local'); }
    if (!corruptDraft.current) setDraftStatus(restored ? 'stored' : 'idle');
    setDraftState(draftRef.current);
    if (pageChanged || entry && !dirty.current) setMode(entry?.entryMode ?? rememberedMode());
  }, [cache, draftKey, entry, gratitudeEntry, isToday]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const flush = () => { cache.flush(); };
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ value: JournalWriteStatus; owner: string }>).detail;
      if (detail?.owner !== journalOwner()) return;
      if (detail.value === 'storage-error' || !dirty.current && submittedPage.current === loadedPage.current) setWriteStatus(detail.value);
    };
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', flush); window.addEventListener(JOURNAL_STATUS_EVENT, update);
    return () => { flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); window.removeEventListener(JOURNAL_STATUS_EVENT, update); };
  }, [cache]);
  useEffect(() => { return () => { cache.flush(); }; }, [cache, draftKey]);
  useEffect(() => {
    if (isToday || dayEntries.some(item => item.ritualType === ritual || !item.ritualType && ritual === 'aksam')) return;
    const first = dayEntries[0]; if (!first) return;
    const timer = window.setTimeout(() => setRitual(first.ritualType === 'sabah' ? 'sabah' : 'aksam'), 0);
    return () => window.clearTimeout(timer);
  }, [dayEntries, isToday, ritual]);
  useEffect(() => {
    try {
      const date = window.localStorage.getItem('sah-journal-open-date');
      if (!validJournalDate(date, today)) return;
      window.localStorage.removeItem('sah-journal-open-date');
      const timer = window.setTimeout(() => setSelectedDate(date), 0);
      return () => window.clearTimeout(timer);
    } catch { /* date navigation must not depend on device storage */ }
  }, [today]);

  const chooseMode = (value: EntryMode) => {
    setMode(value);
    try { window.localStorage.setItem('sah-journal-last-mode', value); } catch { setNotice('Yazma biçimi bu cihazda hatırlanamadı; metnin değişmedi.'); }
  };
  const persistCurrentDraft = () => {
    if (corruptDraft.current?.key === draftKey) {
      try {
        // Preserve the unreadable original BEFORE allowing this page to replace it.
        window.localStorage.setItem(`${draftKey}:recovery:${Date.now()}`, corruptDraft.current.raw);
        corruptDraft.current = null;
      } catch { setDraftStatus('error'); setNotice('Eski taslak güvenle korunamadı. Yazını kopyala; eski veri değiştirilmedi.'); return false; }
    }
    cache.stage(draftKey, draftRef.current);
    return cache.flush();
  };
  const save = () => {
    if (!isToday || loadedPage.current !== draftKey) return;
    const value = draftRef.current;
    if (mode === 'quick' && !value.content.trim() || mode === 'full' && ritual === 'sabah' && !value.intention.trim() || mode === 'full' && ritual === 'aksam' && !value.content.trim() && !value.moments.some(item => item.trim())) {
      setNotice(mode === 'full' && ritual === 'sabah' ? 'Bugünün niyetini bir cümleyle yaz.' : 'Kaydetmek için bugünden bir cümle bırak.'); editor.current?.focus(); return;
    }
    if (!persistCurrentDraft()) return;
    // Resolve existing IDs before creating a new row or calculating its reward.
    if (!recordsReady) { setNotice('Mevcut kayıtların doğrulanıyor. Taslağın cihazda korundu; bağlantıyı kontrol edip birazdan yeniden Kaydet.'); return; }
    if (ritual === 'aksam' && value.gratitude.some(item => item.trim()) && !gratitudeLink.ready) {
      setNotice(gratitudeLink.error ? 'Şükür bağlantısı doğrulanamadı. Taslağın cihazda korundu; bağlantı gelince yeniden Kaydet.' : 'Şükür bağlantısı kontrol ediliyor. Taslağın cihazda korundu; birazdan yeniden Kaydet.'); return;
    }
    // Read fresh store state: two rapid clicks cannot mint two IDs or rewards.
    const current = useJourneyStore.getState();
    const authenticated = useAuthStore.getState().session?.access_token !== 'mock-token' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(owner);
    const candidates = authenticated ? [...journalWritesAfter(owner, 0), ...journal] : current.journal;
    const existing = candidates.find(item => item.date === today && item.ritualType === ritual) ?? (ritual === 'aksam' ? candidates.find(item => item.date === today && !item.ritualType) : undefined) ?? entry;
    const now = new Date().toISOString();
    const id = existing?.id ?? ensureUUID();
    const targetAward = awardFor(ritual, mode);
    const previousAward = existing?.xpAwarded ?? 0;
    const delta = Math.max(0, targetAward - previousAward);
    const record: JournalEntry = { id, date: today, mood: value.mood, energy: value.energy, stress: value.stress, sleep: value.sleep,
      content: value.content.trim(), moments: value.moments.map(item => item.trim()).filter(Boolean), selfNote: value.selfNote.trim(), tags: existing?.tags ?? [],
      ritualType: ritual, entryMode: mode, intentionText: value.intention.trim(), expectedChallengeText: value.challenge.trim(),
      gratitudeText: value.gratitude.map(item => item.trim()).filter(Boolean).join(' · '), xpAwarded: Math.max(previousAward, targetAward), createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    dirty.current = false; submittedPage.current = draftKey;
    const status = current.saveJournal(record); setWriteStatus(status);
    if (status === 'storage-error') { dirty.current = true; setNotice('Kayıt kuyruğa alınamadı. Metnini kopyalayarak koru.'); return; }
    if (delta > 0) { current.addXP(delta); current.updateStreak(); void recordXpEvent({ sourceType: previousAward ? 'journal_detail' : 'journal', sourceId: id, label: mode === 'quick' ? '⚡ Hızlı günlük kaydı' : ritual === 'sabah' ? '🌅 Sabah Niyeti' : '🌙 Akşam Muhasebesi', amount: delta }); }
    if (ritual === 'aksam') {
      const gratitude = value.gratitude.map(item => item.trim()).filter(Boolean);
      if (gratitude.length) {
        const existingGratitude = authenticated ? gratitudeLink.entry : useJourneyStore.getState().sukurList.find(item => item.date === today);
        const gratitudeId = existingGratitude?.id ?? ensureUUID();
        const linked: SukurEntry = { id: gratitudeId, date: today, text: 'Akşam muhasebesinden eklenen şükürler', nimets: [gratitude[0] ?? '', gratitude[1] ?? '', gratitude[2] ?? ''], createdAt: existingGratitude?.createdAt ?? now };
        current.upsertSukur(linked); gratitudeLink.remember(linked);
        if (!existingGratitude) { current.addXP(20); void recordXpEvent({ sourceType: 'sukur', sourceId: gratitudeId, label: 'Günlükten şükür kaydı', amount: 20 }); }
      }
    }
    current.checkBadges(); setNotice(status === 'local' ? 'Kayıt bu cihazda saklandı. Bulut kaydı için giriş yap.' : 'Kayıt gönderime alındı; durumunu aşağıdan takip edebilirsin.');
  };
  const updateList = (key: 'moments' | 'gratitude', index: number, value: string) => setDraft(current => ({ ...current, [key]: current[key].map((item, i) => i === index ? value : item) }));
  const goToday = () => { cache.flush(); setSelectedDate(today); setRitual(initialRitual()); onToday?.(); };
  const statusText = writeStatus === 'saved' ? 'Sunucuya kaydedildi' : writeStatus === 'saving' ? 'Kaydediliyor…' : writeStatus === 'pending' ? 'Cihazda saklandı · bağlantı bekleniyor' : writeStatus === 'storage-error' || draftStatus === 'error' ? 'Depolama hatası · metnini kopyala' : draftStatus === 'writing' ? 'Taslak korunuyor…' : draftStatus === 'stored' ? 'Taslak bu cihazda saklandı' : 'Taslak cihazda korunur · bulut için Kaydet';
  const mainIsIntention = mode === 'full' && ritual === 'sabah';
  const mainLabel = mainIsIntention ? 'Bugünkü niyetim' : ritual === 'sabah' ? 'Bugüne bir not' : 'Bugünden kalanlar';
  const copyText = async () => {
    const value = draftRef.current;
    const text = [value.intention, value.content, value.challenge, ...value.moments, ...value.gratitude, value.selfNote].filter(Boolean).join('\n\n');
    try { await navigator.clipboard.writeText(text); setNotice('Yazın panoya kopyalandı.'); } catch { setNotice('Panoya erişilemedi. Yazı alanındaki metni seçip kopyalayabilirsin.'); editor.current?.focus(); editor.current?.select(); }
  };

  return <div className={`journal-notebook ritual-${ritual}`}>
    <div className="journal-toolbar">
      <div className="journal-date-controls"><button type="button" aria-label="Önceki gün" onClick={() => { cache.flush(); setSelectedDate(moveDate(selectedDate, -1)); }}><AppIcon name="chevron-left" /></button><label><span>{isToday ? 'Bugün' : 'Arşiv'}</span><input type="date" value={selectedDate} max={today} aria-label="Günlük tarihi seç" onChange={event => { if (validJournalDate(event.target.value, today)) { cache.flush(); setSelectedDate(event.target.value); } }} /></label><button type="button" aria-label="Sonraki gün" disabled={isToday} onClick={() => { cache.flush(); setSelectedDate(moveDate(selectedDate, 1)); }}><AppIcon name="chevron-right" /></button></div>
      <div className="journal-ritual-control" role="group" aria-label="Yazma zamanı">{(['sabah', 'aksam'] as const).map(value => <button type="button" key={value} aria-label={value === 'sabah' ? 'Sabah Niyeti' : 'Akşam Muhasebesi'} aria-pressed={ritual === value} disabled={!isToday && !dayEntries.some(item => item.ritualType === value || !item.ritualType && value === 'aksam')} onClick={() => { cache.flush(); setRitual(value); }}><AppIcon name={value === 'sabah' ? 'sun' : 'moon'} /> {value === 'sabah' ? 'Sabah' : 'Akşam'}</button>)}</div>
    </div>
    {!isToday && <div className="journal-readonly-note"><AppIcon name="lock" /><span><strong>Salt okunur</strong> · Geçmiş kayıtlar değiştirilemez.</span><button type="button" className="journal-text-button" onClick={goToday}>Bugün yaz</button></div>}
    {notice && <div className={`journal-notice${draftStatus === 'error' || writeStatus === 'storage-error' ? ' is-error' : ''}`} role={draftStatus === 'error' || writeStatus === 'storage-error' ? 'alert' : 'status'}><AppIcon name={draftStatus === 'error' ? 'alert-circle' : 'info-circle'} /><span>{notice}</span></div>}
    {!isToday && !entry ? <div className="journal-empty"><AppIcon name="notebook" /><h2>{loading ? 'Kayıt yükleniyor…' : 'Bu gün için bir kayıt görünmüyor.'}</h2><p>Başka bir gün seçebilir veya bugüne dönebilirsin.</p><button type="button" className="journal-secondary" onClick={goToday}>Bugün yaz</button></div> : <>
      <section className={`journal-editor${mode === 'quick' ? ' journal-quick-entry' : ''}`} aria-label="Günlük yazı alanı">
        <div className="journal-editor-heading"><span>{isToday ? 'Şu an nasılsın?' : journalDateLabel(selectedDate, true)}</span>{isToday && <div role="group" aria-label="Yazma biçimi" className="journal-mode-control"><button type="button" aria-label="Hızlı Kayıt" aria-pressed={mode === 'quick'} onClick={() => chooseMode('quick')}>Hızlı</button><button type="button" aria-label="Detaylı Yaz" aria-pressed={mode === 'full'} onClick={() => chooseMode('full')}>Detaylı</button></div>}</div>
        <MoodPicker value={draft.mood} editable={isToday} onChange={value => setDraft(current => ({ ...current, mood: value }))} />
        <label className="journal-main-field"><span>{mainLabel}</span><AutoTextarea inputRef={editor} main label={mainLabel} value={mainIsIntention ? draft.intention : draft.content} readOnly={!isToday} placeholder={mainIsIntention ? 'Bugün neye özen göstermek istiyorum?' : ritual === 'sabah' ? 'Bugün niyetim…' : 'Bugünü tek cümleyle anlatırsam…'} onChange={value => setDraft(current => ({ ...current, [mainIsIntention ? 'intention' : 'content']: value }))} /></label>
        {isToday && <details ref={helper} className="journal-writing-help"><summary><AppIcon name="bulb" /> Yazmaya yardımcı ol <AppIcon name="chevron-down" /></summary><div>{['Bugün neye niyet ediyorum?', 'Bugünden aklımda kalan ne?', 'Bugün ne için şükrediyorum?', 'Kendime neyi hatırlatmak isterim?'].map(question => <button type="button" key={question} onClick={() => { setHelpQuestion(question); if (helper.current) helper.current.open = false; editor.current?.focus(); }}>{question}</button>)}</div></details>}
        {helpQuestion && <p className="journal-prompt-note"><AppIcon name="bulb" /> {helpQuestion}<button type="button" aria-label="Yazma sorusunu kaldır" onClick={() => setHelpQuestion('')}><AppIcon name="x" /></button></p>}
        {isToday && <footer className="journal-save-row"><div className="journal-write-status" role="status" aria-live="polite" data-status={draftStatus === 'error' ? 'storage-error' : writeStatus}><AppIcon name={draftStatus === 'error' || writeStatus === 'storage-error' ? 'alert-circle' : writeStatus === 'saved' ? 'cloud-check' : 'device-floppy'} /><span>{statusText}</span></div><button type="button" className="journal-save-button" onClick={save}><AppIcon name="device-floppy" /> Kaydet</button></footer>}
        {isToday && (draftStatus === 'error' || writeStatus === 'storage-error' || writeStatus === 'pending') && <div className="journal-recovery-actions"><button type="button" className="journal-text-button" onClick={() => void copyText()}>Metnimi kopyala</button><button type="button" className="journal-text-button" onClick={() => { if (writeStatus === 'pending') void flushJournalOutbox(); else if (persistCurrentDraft()) setNotice('Taslak bu cihazda korundu. Bulut için Kaydet düğmesini kullan.'); }}>Yeniden dene</button></div>}
      </section>
      {(mode === 'full' || !isToday) && <div className="journal-details">
        {ritual === 'sabah' && <>
          <Fold title="Karşıma çıkabilecek zorluk" icon="route" filled={Boolean(draft.challenge)}><Field label="Zorlukla nasıl karşılaşmak isterim?" value={draft.challenge} editable={isToday} onChange={value => setDraft(current => ({ ...current, challenge: value }))} /></Fold>
          <Fold title="Niyetimi destekleyen not" icon="pencil" filled={Boolean(draft.content)}><Field label="Niyetime eşlik eden not" value={draft.content} editable={isToday} onChange={value => setDraft(current => ({ ...current, content: value }))} /></Fold>
        </>}
        {ritual === 'aksam' && <>
          <Fold title="Bugünün anları" icon="sparkles" filled={draft.moments.some(Boolean)}><NumberedList values={draft.moments} editable={isToday} label="Bugünden bir an" onChange={(index, value) => updateList('moments', index, value)} onAdd={() => setDraft(current => ({ ...current, moments: [...current.moments, ''] }))} /></Fold>
          <Fold title="Şükrettiklerim" icon="heart" filled={draft.gratitude.some(Boolean)}><p className="journal-section-note">Kaydettiğinde Şükür Defterim ile ilişkilendirilir. Tek bir nimet de yeter.</p><NumberedList values={draft.gratitude} editable={isToday} label="Fark ettiğim bir nimet" onChange={(index, value) => updateList('gratitude', index, value)} /></Fold>
          <Fold title="Kendime bir not" icon="message-circle" filled={Boolean(draft.selfNote)}><Field label="Yarınki kendime not" value={draft.selfNote} editable={isToday} onChange={value => setDraft(current => ({ ...current, selfNote: value }))} /></Fold>
          {draft.intention && <Fold title="Bu kayıttaki niyet" icon="sun" filled><Field label="Kaydımın niyeti" value={draft.intention} editable={isToday} onChange={value => setDraft(current => ({ ...current, intention: value }))} /></Fold>}
        </>}
        <Fold title="Günün nabzı" icon="activity"><div className="journal-wellbeing-fields">{([{ key: 'energy', label: 'Enerji', min: 1, max: 10, suffix: '/10' }, { key: 'stress', label: 'Stres', min: 1, max: 10, suffix: '/10' }, { key: 'sleep', label: 'Uyku', min: 0, max: 24, suffix: ' saat' }] as const).map(field => <label key={field.key}><span>{field.label}<strong>{draft[field.key]}{field.suffix}</strong></span><input type="range" min={field.min} max={field.max} step={field.key === 'sleep' ? 0.5 : 1} value={draft[field.key]} disabled={!isToday} onChange={event => setDraft(current => ({ ...current, [field.key]: Number(event.target.value) }))} /></label>)}</div><p className="journal-section-note">Başlangıç değerleri tahmin değildir. İstersen kendi değerlerini seçebilirsin.</p></Fold>
      </div>}
      {mode === 'quick' && isToday && <button type="button" className="journal-text-button journal-deepen" onClick={() => chooseMode('full')}><AppIcon name="plus" /> Biraz daha derinleş</button>}
    </>}
    <Fold title="Günün izi" icon="timeline" caption={trail.length ? `${trail.length} adım` : undefined}>{activity.error && !guest ? <p className="journal-section-note">Günün izi yüklenemedi. <button type="button" className="journal-text-button" onClick={() => void activity.refresh()}>Yeniden dene</button></p> : <ActivityTrail items={trail} loading={activity.loading && !trail.length} onNavigate={onNavigate} />}</Fold>
    {memories.length > 0 && <Fold title="Daha önce bugünlerde…" icon="history" caption={`${memories.length} anı`}><div className="journal-memory-list">{memories.map(memory => <button type="button" key={memory.entry.id} onClick={() => { cache.flush(); setSelectedDate(memory.entry.date); setRitual(memory.entry.ritualType === 'sabah' ? 'sabah' : 'aksam'); }}><small>{memory.days} gün önce · {journalDateLabel(memory.entry.date, true)}</small><span>{journalPreview(memory.entry).slice(0, 140)}</span><AppIcon name="arrow-right" /></button>)}</div></Fold>}
    <p className="journal-footer-note"><AppIcon name="lock" /> Kişisel defterin · Taslak cihazda, bulut kaydı hesabında.</p>
  </div>;
}

function MoodPicker({ value, editable, onChange }: { value: number; editable: boolean; onChange: (value: number) => void }) {
  return <fieldset className="journal-mood-picker"><legend className="journal-sr-only">Ruh hali</legend><div role="group" aria-label="Ruh hali">{JOURNAL_MOODS.map(mood => <button type="button" key={mood.value} disabled={!editable} aria-pressed={value === mood.value} onClick={() => onChange(mood.value)}><span aria-hidden="true">{mood.emoji}</span>{mood.label}</button>)}</div></fieldset>;
}
function AutoTextarea({ value, onChange, label, placeholder = '', readOnly, main = false, inputRef }: { value: string; onChange: (value: string) => void; label: string; placeholder?: string; readOnly: boolean; main?: boolean; inputRef?: React.RefObject<HTMLTextAreaElement | null> }) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const ref = inputRef ?? localRef;
  useLayoutEffect(() => { const element = ref.current; if (!element) return; element.style.height = 'auto'; element.style.height = `${element.scrollHeight}px`; }, [ref, value]);
  return <textarea ref={ref} className={`journal-textarea${main ? ' journal-main-textarea' : ''}`} value={value} aria-label={label} onChange={event => onChange(event.target.value)} placeholder={placeholder} readOnly={readOnly} />;
}
function Field({ label, value, editable, onChange }: { label: string; value: string; editable: boolean; onChange: (value: string) => void }) {
  return <label className="journal-field"><span>{label}</span><AutoTextarea value={value} onChange={onChange} label={label} readOnly={!editable} /></label>;
}
function Fold({ title, icon, filled = false, caption, children }: { title: string; icon: string; filled?: boolean; caption?: string; children: React.ReactNode }) {
  const id = useId();
  return <details className="journal-fold"><summary aria-controls={id}><span><AppIcon name={icon} />{title}</span><span>{filled && <small>Dolu</small>}{caption && <small>{caption}</small>}<AppIcon name="chevron-down" /></span></summary><div id={id} className="journal-fold-body">{children}</div></details>;
}
function NumberedList({ values, editable, label, onChange, onAdd }: { values: string[]; editable: boolean; label: string; onChange: (index: number, value: string) => void; onAdd?: () => void }) {
  return <div className="journal-numbered-list">{(values.length ? values : ['', '', '']).map((value, index) => <label key={index}><span>{index + 1}</span><AutoTextarea value={value} onChange={next => onChange(index, next)} label={`${label} ${index + 1}`} placeholder={label + '…'} readOnly={!editable} /></label>)}{editable && onAdd && <button type="button" className="journal-text-button" onClick={onAdd}><AppIcon name="plus" /> Bir an daha ekle</button>}</div>;
}
function ActivityTrail({ items, loading, onNavigate }: { items: IntegratedActivity[]; loading: boolean; onNavigate: (view: string) => void }) {
  return loading ? <p className="journal-section-note" role="status">Günün izi yükleniyor…</p> : !items.length ? <p className="journal-section-note">Bugüne ait başka bir hareket görünmüyor. Kur’an, odak ve ders kayıtların burada yer alır.</p> : <ol className="journal-activity-list">{items.map(item => <li key={`${item.category}-${item.id}`}><button type="button" onClick={() => onNavigate(item.sourceView)}><AppIcon name="circle-check" /><span><strong>{item.label}</strong><small>{item.detail}</small></span><time dateTime={item.occurredAt}>{new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.occurredAt))}</time><AppIcon name="chevron-right" /></button></li>)}</ol>;
}
