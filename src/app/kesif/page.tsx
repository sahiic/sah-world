import type { Metadata } from 'next';
import ExploreClient from '@/components/legacy/ExploreClient';
import { AuthProvider } from '@/providers/AuthProvider';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Keşif Modu | SAHİ', robots: { index: false, follow: false } };

export default async function ExplorePage() {
  // A direct visit has no auth provider from the home page. Use the same
  // server-verified identity and client bridge instead of an endless loader.
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    : { data: null };
  return <AuthProvider initialUser={user} initialProfile={profile}><ExploreClient /></AuthProvider>;
}
