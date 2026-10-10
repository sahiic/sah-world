"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AppIcon } from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';
import { eligibleForWelcome, FIRST_INTENTION_EVENT, readOnboarding, writeOnboarding } from '@/lib/onboarding';
import { JOURNAL_STATUS_EVENT, pendingJournalEntries } from '@/lib/journalOutbox';
import { recordXpEvent } from '@/lib/xp';
import { useJourneyStore } from '@/store/useJourneyStore';

export default function WelcomeGuide({ profileId, createdAt, completed = false, name, hasActivity, currentView, preview = false, onComplete, onStart, onReturn }: {
  profileId: string; createdAt: string; completed?: boolean; name: string; hasActivity: boolean; currentView: string; preview?: boolean;
  onComplete: () => void; onStart: () => void; onReturn: () => void;
}) {
  const [step, setStep] = useState<'closed' | 'welcome' | 'intention' | 'writing' | 'celebrate'>('closed');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const initialized = useRef(false);
  const busy = useRef(false);
  const entryId = useRef<string | undefined>(undefined);
  const card = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const owner = preview ? `preview:${profileId}` : profileId;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = readOnboarding(localStorage, owner);
    entryId.current = saved?.entryId;
    let legacy = false;
    try { legacy = localStorage.getItem('sah-welcome-complete') === 'true'; } catch { /* server preference still applies */ }
    const next = saved?.stage === 'complete' || !preview && (completed || legacy) ? 'closed'
      : saved?.stage === 'writing' ? 'writing'
      : preview || profileId !== 'guest-user-123' && eligibleForWelcome(createdAt, completed, hasActivity) ? 'welcome' : 'closed';
    queueMicrotask(() => setStep(next));
  }, [completed, createdAt, hasActivity, owner, preview, profileId]);

  const finish = useCallback(async (reward: boolean) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      let claimed = false;
      if (!preview) {
        // Conditional claim: two tabs/devices cannot both award the first step.
        const { data, error: failure } = await supabase.from('profiles')
          .update({ onboarding_completed: true }).eq('id', profileId)
          .or('onboarding_completed.eq.false,onboarding_completed.is.null').select('id');
        if (failure) throw failure;
        claimed = Boolean(data?.length);
      } else claimed = readOnboarding(localStorage, owner)?.stage !== 'complete';
      try { writeOnboarding(localStorage, owner, { stage: 'complete' }); } catch { /* server completion is authoritative */ }
      if (reward && claimed) {
        useJourneyStore.getState().addXP(25);
        if (!preview) void recordXpEvent({ sourceType: 'onboarding', sourceId: profileId, label: 'İlk niyet', amount: 25 });
      }
      if (!preview) onComplete();
      setStep(reward ? 'celebrate' : 'closed');
    } catch { setError('Niyetin korundu. İlk adımın tamamlanması için bağlantını kontrol edip tekrar dene.'); }
    finally { busy.current = false; setSaving(false); }
  }, [onComplete, owner, preview, profileId]);

  useEffect(() => {
    if (step !== 'writing') return;
    const checkSaved = () => {
      if (!entryId.current) return;
      if (preview || !pendingJournalEntries(profileId).some(entry => entry.id === entryId.current)) void finish(true);
    };
    const submitted = (event: Event) => {
      const detail = (event as CustomEvent<{ owner: string; id: string }>).detail;
      if (detail?.owner !== profileId) return;
      entryId.current = detail.id;
      try { writeOnboarding(localStorage, owner, { stage: 'writing', entryId: detail.id }); } catch { /* keep in memory */ }
      checkSaved();
    };
    const synced = (event: Event) => {
      const detail = (event as CustomEvent<{ owner: string; value: string }>).detail;
      if (detail?.owner === profileId && detail.value === 'saved') checkSaved();
    };
    window.addEventListener(FIRST_INTENTION_EVENT, submitted);
    window.addEventListener(JOURNAL_STATUS_EVENT, synced);
    checkSaved();
    return () => { window.removeEventListener(FIRST_INTENTION_EVENT, submitted); window.removeEventListener(JOURNAL_STATUS_EVENT, synced); };
  }, [finish, owner, preview, profileId, step]);

  const overlay = step === 'welcome' || step === 'intention' || step === 'celebrate';
  useEffect(() => {
    if (!overlay) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = card.current;
    root?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !root) return;
      const buttons = [...root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.removeEventListener('keydown', trap); previous?.focus(); };
  }, [overlay, step]);

  if (step === 'closed') return null;
  if (step === 'writing') return <aside className="welcome-writing" aria-label="İlk niyet rehberi">
    <AppIcon name="pencil" /><p><strong>İlk niyetini belirle</strong><span>Bir cümle yazıp Kaydet’e bas. Bulut kaydı tamamlandığında ilk adımın kutlanacak.</span></p>
    {currentView !== 'journal' && <button className="primary-button" onClick={onStart}>Günlüğe dön</button>}
    {error && <><span role="alert">{error}</span><button disabled={saving} onClick={() => { if (entryId.current && !pendingJournalEntries(profileId).some(entry => entry.id === entryId.current)) void finish(true); }}>Tekrar dene</button></>}
    <button className="welcome-skip" disabled={saving} onClick={() => void finish(false)}>Daha sonra</button>
  </aside>;
  return <div className="welcome-guide-overlay">
    <section ref={card} tabIndex={-1} className="welcome-guide-card" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      {step !== 'celebrate' && <button className="welcome-skip" disabled={saving} onClick={() => void finish(false)}>Daha sonra</button>}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <div className={`welcome-symbol ${step === 'celebrate' ? 'celebrating' : ''}`}><AppIcon name={step === 'celebrate' ? 'confetti' : step === 'intention' ? 'pencil' : 'leaf'} /></div>
          <p className="eyebrow">{step === 'welcome' ? '1 / 3 · SANA AİT BİR ALAN' : step === 'intention' ? '2 / 3 · KÜÇÜK BİR ADIM' : '3 / 3 · İLK NİYET'}</p>
          <h1 id="welcome-title">{step === 'welcome' ? `Hoş geldin, ${name.trim().split(/\s+/)[0] || 'Yolcu'}` : step === 'intention' ? 'İlk niyetini belirle' : 'İlk adımın tamamlandı!'}</h1>
          <p>{step === 'welcome' ? 'Kendine dönmek için bugün bir cümle yeter.' : step === 'intention' ? 'Bugün neye alan açmak istiyorsun? Günlüğüne tek bir cümle bırak.' : 'Niyetini kaydettin. İlk adım ödülün: 25 XH.'}</p>
          {error && <p role="alert">{error}</p>}
          <button className="primary-button" disabled={saving} onClick={() => {
            if (step === 'welcome') setStep('intention');
            else if (step === 'intention') { try { writeOnboarding(localStorage, owner, { stage: 'writing' }); } catch { /* still allow writing */ } setStep('writing'); onStart(); }
            else { setStep('closed'); onReturn(); }
          }}>{saving ? 'Kaydediliyor…' : step === 'welcome' ? 'Devam et' : step === 'intention' ? 'İlk niyetimi yaz' : 'Evrenime dön'} <AppIcon name="arrow-right" /></button>
        </motion.div>
      </AnimatePresence>
    </section>
  </div>;
}
