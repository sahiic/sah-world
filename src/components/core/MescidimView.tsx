'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MESCIDIM_TABS, openAppView, selectedValue } from '@/lib/appLocation'
import { AppIcon } from '@/components/ui/AppIcon'
import PrayerTimes from './PrayerTimes'
import MescidimLibrary from './MescidimLibrary'
import MosqueEventArchive from './MosqueEventArchive'

type MescidimTab = 'vakitler' | 'asma' | 'dua' | 'etkinlikler'

export default function MescidimView({ reward }: { reward: (amount: number, label: string, sourceType: string, sourceId: string) => void }) {
  const params = useSearchParams()
  const [legacyTab] = useState<MescidimTab>(() => {
    if (typeof window === 'undefined') return 'vakitler'
    const requested = sessionStorage.getItem('sah:mescidim:tab')
    return requested === 'dua' || requested === 'asma' ? requested : 'vakitler'
  })
  const tab = selectedValue(params.get('tab'), MESCIDIM_TABS, legacyTab)
  const localCommunity = tab === 'etkinlikler'
  const [initialOccasion] = useState(() => typeof window === 'undefined' ? undefined : sessionStorage.getItem('sah:mescidim:occasion') ?? undefined)
  const openSection = useCallback((next: Exclude<MescidimTab, 'etkinlikler'>) => {
    openAppView('mescidim', next)
    window.requestAnimationFrame(() => document.getElementById(`mescidim-${next}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [])
  useEffect(() => {
    sessionStorage.removeItem('sah:mescidim:tab')
    sessionStorage.removeItem('sah:mescidim:occasion')
  }, [])
  useEffect(() => {
    if (localCommunity || tab === 'vakitler') return
    const timer = window.setTimeout(() => document.getElementById(`mescidim-${tab}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 160)
    return () => window.clearTimeout(timer)
  }, [localCommunity, tab])
  return <div className="mescidim-experience">
    <header className="page-heading"><div><span className="eyebrow">MESCİDİM</span><h1>{localCommunity ? 'Yerel cami topluluğu' : 'Kişisel manevi alanım'}</h1><p>{localCommunity ? 'Bursa Teknik Üniversitesi camisine ait etkinlik arşivi. Katılım isteğe bağlıdır.' : 'Hangi şehirde olursan ol, vakitler, zikir ve kaynaklı kütüphanen burada.'}</p></div></header>
    <nav className="mescidim-scope-tabs" aria-label="Mescidim kapsamı">
      <button role="tab" aria-selected={!localCommunity} onClick={() => openSection('vakitler')}><AppIcon name="lock" /> Kişisel alanım</button>
      <button role="tab" aria-selected={localCommunity} onClick={() => openAppView('mescidim', 'etkinlikler')}><AppIcon name="building-mosque" /> BTÜ cami topluluğu</button>
    </nav>
    {localCommunity && <section className="mosque-identity-hero">
      <div className="mosque-identity-art" aria-hidden="true">
        <span className="mosque-moon" />
        <svg viewBox="0 0 420 230" role="img">
          <defs><linearGradient id="mosqueDome" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6d98f"/><stop offset="1" stopColor="#d89b3e"/></linearGradient><linearGradient id="mosqueWall" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fffdf5"/><stop offset="1" stopColor="#e7e2d4"/></linearGradient></defs>
          <path d="M57 189h306v24H57z" fill="#2f685d" opacity=".28"/>
          <path d="M118 102h184v91H118z" fill="url(#mosqueWall)"/>
          <path d="M145 102c9-45 121-45 130 0z" fill="url(#mosqueDome)"/>
          <path d="M209 45v20" stroke="#d89b3e" strokeWidth="5" strokeLinecap="round"/><path d="M209 43a11 11 0 1 1 0-21 9 9 0 1 0 0 21z" fill="#f4c65b"/>
          <path d="M76 56h26v137H76z" fill="url(#mosqueWall)"/><path d="M72 56h34L89 27z" fill="url(#mosqueDome)"/><path d="M88 27V12" stroke="#d89b3e" strokeWidth="4"/>
          <path d="M318 56h26v137h-26z" fill="url(#mosqueWall)"/><path d="M314 56h34l-17-29z" fill="url(#mosqueDome)"/><path d="M332 27V12" stroke="#d89b3e" strokeWidth="4"/>
          <path d="M185 193v-52a25 25 0 0 1 50 0v52" fill="#194c46"/><path d="M137 130h25v30h-25zm121 0h25v30h-25z" fill="#8dd6c0" opacity=".72"/>
        </svg>
      </div>
      <div className="mosque-identity-copy"><span className="eyebrow">BURSA TEKNİK ÜNİVERSİTESİ · MESCİDİM</span><h2>Şehit Astsubay Ömer Halisdemir Camii</h2><p>Vakitlerin, tefekkürün ve üniversite topluluğunun ortak hafızası. İbadet ritmini takip et; kaynaklı manevi kütüphaneyi ve camimizin etkinlik arşivini keşfet.</p><div><span><AppIcon name="map-pin" /> Bursa</span><span><AppIcon name="shield-check" /> Güvenli topluluk arşivi</span></div></div>
    </section>}
    {!localCommunity && <>
      <section className="mescidim-today-hero">
        <div className="mescidim-today-copy"><span className="eyebrow">BUGÜNÜN MANEVÎ AKIŞI</span><h2>Vakit, zikir ve dua.</h2><p>Günün ritmini takip et, kısa bir zikir molası ver ve duaya alan aç.</p></div>
        <div className="mescidim-today-mark" aria-hidden="true"><span><AppIcon name="building-mosque" /></span><i/><i/><i/></div>
        <div className="mescidim-today-promise"><AppIcon name="shield-check" /><span><strong>Kaynaklı ve kişisel</strong><small>Vakitler, Esmâ ve dualar güvenilir kaynak bilgileriyle sunulur.</small></span></div>
      </section>

      <nav className="mescidim-section-nav" aria-label="Mescidim bölümleri">
        <button aria-current={tab === 'vakitler' ? 'page' : undefined} onClick={() => openSection('vakitler')}><span><AppIcon name="clock" /></span><strong>Namaz vakitleri</strong><small>Bugün ve takvim</small></button>
        <button onClick={() => document.getElementById('mescidim-zikir')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span><AppIcon name="refresh" /></span><strong>Zikir sayacı</strong><small>Sakin bir ritim</small></button>
        <button aria-current={tab === 'asma' ? 'page' : undefined} onClick={() => openSection('asma')}><span><AppIcon name="sparkles" /></span><strong>Günün Esmâsı</strong><small>Tefekkür alanı</small></button>
        <button aria-current={tab === 'dua' ? 'page' : undefined} onClick={() => openSection('dua')}><span><AppIcon name="book-2" /></span><strong>Dualar</strong><small>Kaynaklı kütüphane</small></button>
      </nav>

      <div className="mescidim-single-flow">
        <section id="mescidim-vakitler" className="mescidim-flow-section">
          <header className="mescidim-flow-heading"><span>01</span><div><small>GÜNÜN RİTMİ</small><h2>Namaz vakitleri</h2><p>Bulunduğun şehre göre sıradaki vakti ve günün tamamını tek bakışta gör.</p></div></header>
          <PrayerTimes reward={reward} />
        </section>
        <MescidimLibrary stacked initialOccasion={initialOccasion} />
      </div>
    </>}
    {localCommunity && <MosqueEventArchive />}
  </div>
}
