'use client';

import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/AppIcon';
import { dayKey } from '@/lib/activity';
import { filterJournalEntries, journalCalendar, journalDateLabel, journalPreview, journalRitual, JOURNAL_MOODS } from '@/lib/journalPresentation';
import type { JournalRitual } from '@/lib/journalPresentation';
import type { JournalEntry } from '@/types';

export default function JournalHistory({ entries, loading, error, complete, total, onRetry, onOpen, onToday }: {
  entries: JournalEntry[]; loading: boolean; error: boolean; complete: boolean; total: number | null;
  onRetry: () => void; onOpen: (entry: JournalEntry) => void; onToday: () => void;
}) {
  const today = dayKey(new Date());
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ritual, setRitual] = useState<'all' | JournalRitual>('all');
  const [month, setMonth] = useState(today.slice(0, 7));
  const [limit, setLimit] = useState(30);
  const results = useMemo(() => filterJournalEntries(entries, { query, from, to, ritual }), [entries, from, query, ritual, to]);
  const marked = useMemo(() => new Set(entries.map(entry => entry.date)), [entries]);
  const cells = useMemo(() => journalCalendar(month), [month]);
  const filtered = Boolean(query || from || to || ritual !== 'all');
  const invalidRange = Boolean(from && to && from > to);
  const clear = () => { setQuery(''); setFrom(''); setTo(''); setRitual('all'); setLimit(30); };
  const moveMonth = (amount: number) => {
    const date = new Date(`${month}-01T12:00:00`); date.setMonth(date.getMonth() + amount);
    setMonth(dayKey(date).slice(0, 7));
  };
  const groups = useMemo(() => {
    const result = new Map<string, JournalEntry[]>();
    for (const entry of results.slice(0, limit)) result.set(entry.date, [...(result.get(entry.date) ?? []), entry]);
    return [...result];
  }, [limit, results]);

  return <div className="journal-history">
    <header className="journal-history-heading">
      <div><h2>Geçmişine küçük bir dönüş.</h2><p>Niyetlerin, günün izleri ve kendine bıraktığın notlar.</p></div>
      <button type="button" className="journal-secondary" onClick={onToday}><AppIcon name="pencil" /> Bugün yaz</button>
    </header>
    <div className="journal-history-filters">
      <label className="journal-search"><AppIcon name="search" /><span className="journal-sr-only">Günlük kayıtlarında ara</span><input type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }} placeholder="Bir kelime, niyet veya anı ara…" /></label>
      <div className="journal-filter-row">
        <label>Başlangıç<input type="date" value={from} max={today} onChange={event => { setFrom(event.target.value); setLimit(30); }} /></label>
        <label>Bitiş<input type="date" value={to} max={today} onChange={event => { setTo(event.target.value); setLimit(30); }} /></label>
        <label>Yazma zamanı<select value={ritual} onChange={event => { setRitual(event.target.value as typeof ritual); setLimit(30); }}><option value="all">Tümü</option><option value="sabah">Sabah</option><option value="aksam">Akşam</option></select></label>
      </div>
      {filtered && <button type="button" className="journal-text-button" onClick={clear}><AppIcon name="x" /> Filtreleri temizle</button>}
      {invalidRange && <p className="journal-error-text" role="alert">Başlangıç tarihi bitiş tarihinden sonra olamaz.</p>}
    </div>
    <details className="journal-fold journal-calendar-fold">
      <summary><span><AppIcon name="calendar" /> Takvimden bir gün seç</span><AppIcon name="chevron-down" /></summary>
      <div className="journal-calendar">
        <header><button type="button" aria-label="Önceki ay" onClick={() => moveMonth(-1)}><AppIcon name="chevron-left" /></button><strong>{new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T12:00:00`))}</strong><button type="button" aria-label="Sonraki ay" disabled={month >= today.slice(0, 7)} onClick={() => moveMonth(1)}><AppIcon name="chevron-right" /></button></header>
        <div className="journal-calendar-grid">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => <span key={day} className="journal-calendar-weekday">{day}</span>)}
          {cells.map(cell => <button key={cell.date} type="button" disabled={cell.date > today || !marked.has(cell.date)} className={`${cell.currentMonth ? '' : 'outside'} ${marked.has(cell.date) ? 'has-entry' : ''}`} aria-label={`${journalDateLabel(cell.date)}${marked.has(cell.date) ? ' · kayıt var' : ' · kayıt yok'}`} aria-pressed={from === cell.date && to === cell.date} onClick={() => { setFrom(cell.date); setTo(cell.date); setLimit(30); }}>{Number(cell.date.slice(-2))}{marked.has(cell.date) && <i aria-hidden="true" />}</button>)}
        </div>
        <p>İşaretli günlerde kayıt var. Bir gün seçerek listeyi daraltabilirsin.</p>
      </div>
    </details>
    <div className="journal-history-state" role="status" aria-live="polite">
      {loading ? <span>Geçmiş yükleniyor… {entries.length > 0 && `${entries.length}${total !== null ? ` / ${total}` : ''} kayıt`}</span> : complete ? <span>{results.length} kayıt{filtered ? ' bulundu' : ' · kişisel defterinde'}</span> : <span>Yalnızca yüklenen {entries.length} kayıt gösteriliyor; tüm geçmiş henüz doğrulanmadı.</span>}
      {error && <span className="journal-error-text">Geçmişin tamamı yüklenemedi. <button type="button" className="journal-text-button" onClick={onRetry}>Yeniden dene</button></span>}
    </div>
    {loading && !entries.length ? <div className="journal-history-loading" aria-label="Kayıtlar yükleniyor"><i /><i /><i /></div> : !results.length ? <div className="journal-empty">
      <span className="journal-empty-icon"><AppIcon name={filtered ? 'search' : 'notebook'} /></span>
      <h3>{error ? 'Kayıtlarına şu an ulaşılamıyor.' : filtered ? 'Yüklenen kayıtlarda eşleşme yok.' : 'Defterinde yeni bir sayfaya yer var.'}</h3>
      <p>{error ? 'Metinlerin silinmedi. Bağlantını kontrol edip yeniden deneyebilirsin.' : filtered ? 'Başka bir kelime deneyebilir veya filtreleri temizleyebilirsin.' : 'Bugünden tek bir cümle bırak; burada yeniden bulabilirsin.'}</p>
      <button type="button" className="journal-secondary" onClick={error ? onRetry : filtered ? clear : onToday}>{error ? 'Yeniden dene' : filtered ? 'Filtreleri temizle' : 'Bugün yaz'}</button>
    </div> : <div className="journal-history-list">
      {groups.map(([date, rows]) => <section key={date} className="journal-history-day"><h3>{date === today ? 'Bugün' : journalDateLabel(date)}</h3>{rows.map(entry => {
        const mood = JOURNAL_MOODS.find(item => item.value === entry.mood);
        return <button type="button" key={entry.id} className="journal-history-entry" onClick={() => onOpen(entry)} aria-label={`${journalRitual(entry) === 'sabah' ? 'Sabah' : 'Akşam'} kaydını aç · ${journalDateLabel(date)}`}>
          <span className="journal-entry-symbol"><AppIcon name={journalRitual(entry) === 'sabah' ? 'sun' : 'moon'} /></span>
          <span className="journal-entry-body"><span className="journal-entry-meta"><strong>{journalRitual(entry) === 'sabah' ? 'Sabah Niyeti' : 'Akşam Muhasebesi'}</strong><small>{entry.entryMode === 'quick' ? 'Hızlı kayıt' : 'Detaylı kayıt'}</small></span><span className="journal-entry-preview">{journalPreview(entry).slice(0, 240)}</span><span className="journal-entry-bottom">{mood && <span>{mood.emoji} {mood.label}</span>}<span>{date === today ? 'Bugünkü kayıt' : 'Salt okunur'}</span></span></span>
          <AppIcon name="chevron-right" />
        </button>;
      })}</section>)}
      {results.length > limit && <button type="button" className="journal-secondary journal-load-more" onClick={() => setLimit(value => value + 30)}>Daha fazla kayıt göster ({results.length - limit})</button>}
    </div>}
  </div>;
}
