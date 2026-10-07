'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { journalWriteVersion, journalWritesAfter, pendingJournalEntries } from '@/lib/journalOutbox';
import { mapJournalRow, mergeJournalEntries } from '@/lib/journalPresentation';
import { useAuthStore } from '@/store/useAuthStore';
import { useJourneyStore } from '@/store/useJourneyStore';
import type { JournalEntry } from '@/types';

type ArchiveState = { owner: string; rows: JournalEntry[]; loading: boolean; error: boolean; complete: boolean; total: number | null; watermark: number };
const PAGE_SIZE = 250;

/** Read every page, never advertise a truncated Supabase response as the full archive. */
export function useJournalArchive() {
  const owner = useAuthStore(state => state.user?.id ?? state.session?.user.id ?? 'local');
  const mock = useAuthStore(state => state.session?.access_token === 'mock-token');
  const authenticated = !mock && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(owner);
  const localEntries = useJourneyStore(state => state.journal);
  const [state, setState] = useState<ArchiveState>({ owner, rows: [], loading: authenticated, error: false, complete: !authenticated, total: null, watermark: 0 });
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    request.current?.abort();
    if (!authenticated) return;
    const controller = new AbortController(); request.current = controller;
    const currentOwner = () => useAuthStore.getState().user?.id ?? useAuthStore.getState().session?.user.id ?? 'local';
    const active = () => !controller.signal.aborted && currentOwner() === owner;
    const pending = pendingJournalEntries(owner);
    const version = journalWriteVersion();
    setState(previous => ({ owner, rows: mergeJournalEntries(previous.owner === owner ? previous.rows : [], pending), loading: true, error: false, complete: false, total: null, watermark: previous.owner === owner ? previous.watermark : 0 }));
    const rows: JournalEntry[] = [];
    let total: number | null = null;
    try {
      for (let offset = 0; ; offset += PAGE_SIZE) {
        const result = await supabase.from('journal_entries').select('*', { count: 'exact' })
          .eq('user_id', owner).order('date', { ascending: false }).order('created_at', { ascending: false }).order('id')
          .range(offset, offset + PAGE_SIZE - 1).abortSignal(controller.signal);
        if (!active()) return;
        if (result.error) throw new Error('archive_read_failed');
        total = result.count ?? total;
        rows.push(...(result.data ?? []).map(row => mapJournalRow(row as unknown as Record<string, unknown>)));
        // A server may impose a smaller page cap. Advancing by the actual page
        // length avoids skipping records; count exposes any premature empty page.
        const fetched = result.data?.length ?? 0;
        const complete = total !== null ? rows.length >= total : fetched === 0;
        if (!fetched && !complete) throw new Error('archive_incomplete');
        setState(previous => ({ owner, rows: mergeJournalEntries(rows, pending), total, loading: !complete, complete, error: false, watermark: complete ? version : previous.watermark }));
        if (complete) break;
        offset += fetched - PAGE_SIZE;
      }
    } catch {
      if (active()) setState(previous => ({ owner, rows: mergeJournalEntries(rows.length ? rows : previous.owner === owner ? previous.rows : [], pending), total, loading: false, complete: false, error: true, watermark: previous.owner === owner ? previous.watermark : 0 }));
    }
  }, [authenticated, owner]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener('online', refresh);
    window.addEventListener('sah:activity-changed', refresh);
    return () => { window.clearTimeout(timer); request.current?.abort(); window.removeEventListener('online', refresh); window.removeEventListener('sah:activity-changed', refresh); };
  }, [load]);

  const entries = useMemo(() => {
    if (!authenticated) return localEntries;
    if (state.owner !== owner) return [];
    // Never read the unscoped legacy store as another account's archive.
    return mergeJournalEntries(state.rows, journalWritesAfter(owner, state.watermark));
  }, [authenticated, localEntries, owner, state]);
  return { entries, loading: state.owner !== owner || state.loading, error: state.owner === owner && state.error, complete: !authenticated || state.owner === owner && state.complete, total: state.total, refresh: load, authenticated };
}
