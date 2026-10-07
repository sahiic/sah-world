'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useJourneyStore } from '@/store/useJourneyStore';
import type { SukurEntry } from '@/types';

/** Resolve the linked record with the current identity, not the unscoped legacy store. */
export function useJournalGratitude(date: string) {
  const owner = useAuthStore(state => state.user?.id ?? state.session?.user.id ?? 'local');
  const mock = useAuthStore(state => state.session?.access_token === 'mock-token');
  const local = useJourneyStore(state => state.sukurList);
  const authenticated = !mock && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(owner);
  const key = `${owner}:${date}`;
  const [state, setState] = useState<{ key: string; entry?: SukurEntry; ready: boolean; error: boolean }>({ key, ready: !authenticated, error: false });
  const remembered = useRef<{ key: string; entry: SukurEntry } | null>(null);
  const load = useCallback(async (signal: AbortSignal) => {
    if (!authenticated) return;
    try {
      const { data, error } = await supabase.from('sukur_entries').select('*').eq('user_id', owner).eq('date', date).order('created_at').limit(1).abortSignal(signal).maybeSingle();
      const activeOwner = useAuthStore.getState().user?.id ?? useAuthStore.getState().session?.user.id ?? 'local';
      if (signal.aborted || activeOwner !== owner) return;
      if (error) { setState(previous => ({ key, entry: previous.key === key ? previous.entry : undefined, error: true, ready: previous.key === key && previous.ready })); return; }
      const entry: SukurEntry | undefined = data ? { id: data.id, date: data.date, text: data.text, nimets: [data.nimet1 ?? '', data.nimet2 ?? '', data.nimet3 ?? ''], createdAt: data.created_at } : undefined;
      setState({ key, entry: remembered.current?.key === key ? remembered.current.entry : entry, ready: true, error: false });
    } catch {
      const activeOwner = useAuthStore.getState().user?.id ?? useAuthStore.getState().session?.user.id ?? 'local';
      if (!signal.aborted && activeOwner === owner) setState(previous => ({ key, entry: previous.key === key ? previous.entry : undefined, ready: previous.key === key && previous.ready, error: true }));
    }
  }, [authenticated, date, key, owner]);
  useEffect(() => {
    const controller = new AbortController();
    const retry = () => { void load(controller.signal); };
    retry(); window.addEventListener('online', retry);
    return () => { controller.abort(); window.removeEventListener('online', retry); };
  }, [load]);
  const remember = (entry: SukurEntry) => {
    remembered.current = { key, entry }; setState({ key, entry, ready: true, error: false });
  };
  return { entry: authenticated ? state.key === key ? state.entry : undefined : local.find(item => item.date === date), ready: !authenticated || state.key === key && state.ready, error: authenticated && state.key === key && state.error, remember };
}
