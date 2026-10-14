import type { Metadata } from 'next';
import ExploreClient from '@/components/legacy/ExploreClient';

export const metadata: Metadata = { title: 'Keşif Modu | SAHİ', robots: { index: false, follow: false } };

export default function ExplorePage(){ return <ExploreClient/>; }
