'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

/** All explicit exit buttons use the same local-device logout flow. */
export function useSignOut() {
  const router = useRouter();
  const pending = useRef(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const signOut = async () => {
    if (pending.current) return;
    pending.current = true;
    setIsSigningOut(true);
    setSignOutError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      // The SDK can remove the local session even if server revocation fails.
      // Never leave users on an account screen that is already signed out.
      if (error) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) throw error;
      }
      // Hide private UI immediately, even before the new server payload arrives.
      useAuthStore.getState().reset();
      if (error) useAuthStore.getState().setAuthError(
        'Bu cihazdaki oturum kapatıldı. Sunucudaki çıkış doğrulanamadı; bağlantını kontrol et.',
      );
      router.replace('/');
      router.refresh();
    } catch {
      setSignOutError('Oturum kapatılamadı. Bağlantını kontrol edip yeniden dene.');
    } finally {
      pending.current = false;
      setIsSigningOut(false);
    }
  };

  return { signOut, isSigningOut, signOutError };
}
