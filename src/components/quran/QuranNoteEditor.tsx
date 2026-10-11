'use client';

import type { FormEvent } from 'react';
import type { ReflectionKind } from '@/lib/dailyReflections';
import { AppIcon } from '@/components/ui/AppIcon';

/** Keep field names/validation identical to the existing archive save handler. */
export default function QuranNoteEditor({kind, onSubmit, onClose}: {
  kind: ReflectionKind;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return <form className="wisdom-note-composer" onSubmit={onSubmit}>
    <header><div><span className="eyebrow">{kind === 'verse' ? 'YENİ KUR’AN NOTU' : 'YENİ HADİS NOTU'}</span><h3>Düşünceni kayda dönüştür</h3></div><button type="button" onClick={onClose} aria-label="Formu kapat"><AppIcon name="x" /></button></header>
    <div className="two-fields">
      {kind === 'verse' ? <><label>Sure<input name="sure" required placeholder="Örn. İnşirah" /></label><label>Ayet / referans<input name="reference" required placeholder="Örn. 94:5-6" /></label></> : <><label>Kaynak<input name="reference" required placeholder="Örn. Buhârî, Edeb, 31" /></label><label>Konu<input name="theme" required placeholder="Örn. Sabır" /></label></>}
    </div>
    <label>{kind === 'verse' ? 'Tefsir / not' : 'Hadis metni / kısa not'}<textarea name="text" required rows={4} placeholder="Sende kalan anlam…" /></label>
    <label>Hayata taşıyacağım ders<textarea name="reflection" required rows={3} placeholder="Bugün uygulayabileceğim küçük adım…" /></label>
    <footer><button className="ghost-button" type="button" onClick={onClose}>Vazgeç</button><button className="primary-button" type="submit"><AppIcon name="bookmark" /> Güvenle kaydet</button></footer>
  </form>;
}
