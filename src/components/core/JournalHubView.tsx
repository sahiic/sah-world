'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { JOURNAL_TABS, openAppView, selectedValue } from '@/lib/appLocation';
import { dayKey } from '@/lib/activity';
import { journalRitual, validJournalDate } from '@/lib/journalPresentation';
import { useJournalArchive } from '@/hooks/useJournalArchive';
import { useAuthStore } from '@/store/useAuthStore';
import { AppIcon } from '@/components/ui/AppIcon';
import JournalNotebook from './JournalNotebook';
import JournalHistory from './JournalHistory';
import SectionView from './SectionView';
import type { JournalEntry } from '@/types';

export type JournalHubTab = 'journal' | 'matrix' | 'sukur' | 'lessons';
const tools = [
  { id: 'matrix' as const, label: 'Öncelik Matrisim', icon: 'layout-grid' },
  { id: 'sukur' as const, label: 'Şükür Defterim', icon: 'sparkles' },
  { id: 'lessons' as const, label: 'Hatalar ve Dersler', icon: 'history' },
];

export default function JournalHubView({ onNavigate }: { onNavigate: (view: string) => void }) {
  const owner = useAuthStore(state => state.user?.id ?? state.session?.user.id ?? 'local');
  return <JournalWorkspace key={owner} onNavigate={onNavigate} />;
}

function JournalWorkspace({ onNavigate }: { onNavigate: (view: string) => void }) {
  const params = useSearchParams();
  const tab = selectedValue(params.get('tab'), JOURNAL_TABS, 'journal');
  const history = tab === 'journal' && params.get('journalPanel') === 'history';
  const writing = tab === 'journal' && !history;
  const date = validJournalDate(params.get('journalDate'), dayKey(new Date())) ? params.get('journalDate')! : undefined;
  const ritual = selectedValue(params.get('journalRitual'), ['sabah', 'aksam'] as const, 'aksam');
  const archive = useJournalArchive();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRoot = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = (restore = false) => { setMenuOpen(false); if (restore) menuButton.current?.focus(); };
  useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => { if (!menuRoot.current?.contains(event.target as Node)) setMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    menuRoot.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener('pointerdown', outside);
  }, [menuOpen]);
  const openWriting = (today = false) => openAppView('journal', 'journal', today ? { journalDate: dayKey(new Date()), journalRitual: new Date().getHours() < 12 ? 'sabah' : 'aksam' } : date ? { journalDate: date, journalRitual: ritual } : undefined);
  const openHistory = () => openAppView('journal', 'journal', { journalPanel: 'history' });
  const openEntry = (entry: JournalEntry) => openAppView('journal', 'journal', { journalDate: entry.date, journalRitual: journalRitual(entry) });

  return <div className="view-stack journal-hub journal-workspace" data-journal-version="quiet-notebook-v1">
    <header className="journal-heading"><span className="journal-heading-icon"><AppIcon name="notebook" /></span><div><h1>Günlük</h1><p>Bir cümleyle başla. İstersen derinleş.</p></div></header>
    <nav className="journal-navigation" aria-label="Günlük gezinmesi">
      <div role="tablist" aria-label="Günlük görünümleri" className="journal-hub-tabs" onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const toHistory = event.key === 'End' || event.key !== 'Home' && !history;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        (toHistory ? openHistory : () => openWriting())(); buttons[toHistory ? 1 : 0]?.focus();
      }}>
        <button type="button" id="journal-write-tab" role="tab" aria-controls="journal-write-panel" aria-selected={writing} tabIndex={history ? -1 : 0} className={writing ? 'active' : ''} onClick={() => openWriting()}><AppIcon name="pencil" /> Yaz</button>
        <button type="button" id="journal-history-tab" role="tab" aria-controls="journal-history-panel" aria-selected={history} tabIndex={history ? 0 : -1} className={history ? 'active' : ''} onClick={openHistory}><AppIcon name="history" /> Geçmiş</button>
      </div>
      <div ref={menuRoot} className="journal-tools" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) closeMenu(); }}>
        <button ref={menuButton} type="button" className={`journal-tools-toggle${tab !== 'journal' ? ' active' : ''}`} aria-haspopup="menu" aria-expanded={menuOpen} aria-controls="journal-tools-menu" onClick={() => setMenuOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setMenuOpen(true); } }}><AppIcon name="layout-grid" /> Araçlar <AppIcon name="chevron-down" /></button>
        {menuOpen && <div id="journal-tools-menu" role="menu" aria-label="Günlük araçları" className="journal-tools-menu" onKeyDown={event => {
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
          else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
        }}>{tools.map(tool => <button type="button" role="menuitem" key={tool.id} onClick={() => { closeMenu(true); openAppView('journal', tool.id); }}><AppIcon name={tool.icon} />{tool.label}{tab === tool.id && <AppIcon name="check" />}</button>)}</div>}
      </div>
    </nav>
    <section id="journal-write-panel" className="journal-tab-panel" role="tabpanel" aria-labelledby="journal-write-tab" hidden={!writing}>
      <JournalNotebook onNavigate={onNavigate} entries={archive.entries} requestedDate={date} requestedRitual={date ? ritual : undefined} onToday={() => openWriting(true)} loading={archive.loading} recordsReady={!archive.authenticated || archive.complete} />
    </section>
    {history && <section id="journal-history-panel" className="journal-tab-panel" role="tabpanel" aria-labelledby="journal-history-tab"><JournalHistory {...archive} onRetry={() => void archive.refresh()} onOpen={openEntry} onToday={() => openWriting(true)} /></section>}
    {tab !== 'journal' && <section className="journal-tool-panel" aria-label={tools.find(tool => tool.id === tab)?.label}>
      <header><h2>{tools.find(tool => tool.id === tab)?.label}</h2><button type="button" className="journal-secondary" onClick={() => openWriting(true)}><AppIcon name="arrow-left" /> Günlüğe dön</button></header>
      <SectionView key={tab} section={tab} onNavigate={onNavigate} embedded />
    </section>}
  </div>;
}
