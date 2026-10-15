'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useJourneyStore } from '@/store/useJourneyStore';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { startJournalSync } from '@/lib/journalOutbox';

// ============================================================
// Context
// ============================================================
const AuthContext = createContext<null>(null);
export const useAuthContext = () => useContext(AuthContext);

// ============================================================
// AuthProvider — server-verified identity + browser auth event bridge
// ============================================================
export function AuthProvider({ children, initialUser, initialProfile }: { children: React.ReactNode; initialUser: User | null; initialProfile: Profile | null }) {
  const { setSession, setUser, setProfile, setIsAuthLoading, reset } = useAuthStore();
  const initialized = useRef(false);
  const userId = useAuthStore(state => state.user?.id);

  // Veri senkronizasyonu (Supabase'den çekme + migrasyon)
  useSupabaseSync();
  useEffect(() => startJournalSync(), [userId]);

  useEffect(() => {
    // Seed server identity once, but always restore the subscription after effect
    // cleanup (Strict Mode, refresh, or updated server props).
    if (!initialized.current) {
      initialized.current = true;
      setUser(initialUser);
      setProfile(initialProfile);
      setIsAuthLoading(false);
    }
    let active = true;
    let receivedAuthEvent = false;

    // Cookie tabanlı ilk durum sunucuda doğrulanır; bu çağrı yalnızca browser
    // session nesnesini eşler. Keyfi timeout, geçerli oturumu login ekranına düşürmez.
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        // A late bootstrap response must never undo a newer SIGNED_OUT event.
        if (!active || receivedAuthEvent) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) setProfile(null);
      })
      .catch((err) => {
        console.error('[SAH Auth] Browser session eşleme hatası', { name: err instanceof Error ? err.name : 'UnknownError' });
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });

    // 2. Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        receivedAuthEvent = true;
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) setProfile(null);
        setIsAuthLoading(false);

        if (event === 'SIGNED_OUT') {
          reset();
          useJourneyStore.getState().resetStore();
          if (typeof window !== 'undefined') {
            try { localStorage.removeItem('sah-world-store'); } catch { /* Storage may be blocked. */ }
          }
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [initialProfile, initialUser, reset, setIsAuthLoading, setProfile, setSession, setUser]);

  return (
    <AuthContext.Provider value={null}>
      {children}
    </AuthContext.Provider>
  );
}
