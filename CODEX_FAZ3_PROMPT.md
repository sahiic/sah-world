# Codex Prompt: SAH World — Faz 3: Kalite, Erişilebilirlik ve Performans

**Hedef:** Üretim kalitesi; erişilebilirlik, performans, dark mode tutarlılığı ve büyük bileşen refaktörü.
**Branch:** `feature/faz3-quality` (main'den oluştur)
**Bağımlılık:** Faz 1 + Faz 2 merge edilmiş olmalı (main'de mevcut)

---

## GÜVENLİK KURALLARI (ASLA İHLAL ETME)

- Supabase URL, anon key, service role key, Vercel token, şifre, OTP veya `.env` içeriklerini asla mesaja, koda ya da GitHub'a yazma
- main dalına doğrudan kod gönderme. Feature branch kullan
- Mevcut kullanıcı verilerini silme veya üzerine yazma
- Grafik görüntü (şiddete ait fotoğraf/video) asla kullanma

---

## PROJE YAPISI

- Next.js 16+ (App Router), React 19, TypeScript strict
- Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/postcss`)
- `node_modules/next/dist/docs/` içindeki belgeleri OKU — bu Next.js sürümü farklı API'ler kullanıyor
- Framer Motion AnimatePresence animasyonlar için
- Supabase: PostgreSQL + RLS
- AppIcon: `<AppIcon name="icon-name" />` — Tabler Icons webfont (`ti ti-{name}`)
- Design tokens: globals.css `:root` bloğunda tanımlı
- Tema: `[data-theme="dark"]` selektörü ile dark mode, SAH World teması ayrı blok

---

## GÖREV 1: Erişilebilirlik (a11y) Taraması

### Referans: WCAG 2.1 AA seviyesi

### Sorun
SahApp.tsx'de 18 aria attribute var ama alt bileşenlerde eksiklikler mevcut:
- Klavye navigasyonu tam değil (sidebar, quick actions, tabs)
- Focus yönetimi: view değişikliklerinde focus kayboluyor
- Bazı interaktif elemanlar `aria-label` içermiyor
- Renk kontrastı bazı `--core-muted` (#6f7c94) kullanımlarında AA'yı karşılamıyor

### Yapılacaklar

1. **Focus yönetimi:** View değişikliklerinde ana içerik alanına focus at:

```typescript
// SahApp.tsx — navigate fonksiyonunun sonuna ekle
const mainRef = useRef<HTMLElement>(null);

// navigate() içinde, setView'dan sonra:
requestAnimationFrame(() => mainRef.current?.focus());

// JSX'te:
<main className="app-main" id="main-content" ref={mainRef} tabIndex={-1}>
```

2. **Skip link:** Sayfa başına "İçeriğe atla" linki ekle:

```tsx
// SahApp.tsx — root div'in ilk çocuğu olarak
<a href="#main-content" className="skip-link">İçeriğe atla</a>
```

```css
/* globals.css */
.skip-link{position:absolute;top:-100%;left:16px;z-index:999;padding:12px 20px;border-radius:12px;color:#fff;background:var(--core-brand);font-size:14px;font-weight:700;text-decoration:none;transition:top .2s}
.skip-link:focus{top:16px}
```

3. **Sidebar klavye navigasyonu:** Ok tuşlarıyla bölümler arasında geçiş:

```typescript
// sidebar-nav section'a onKeyDown ekle
const handleSidebarKeyDown = (event: React.KeyboardEvent) => {
  const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
  const current = [...buttons].indexOf(event.target as HTMLButtonElement);
  if (current < 0) return;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    buttons[(current + 1) % buttons.length]?.focus();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    buttons[(current - 1 + buttons.length) % buttons.length]?.focus();
  }
};
```

4. **Kontrast düzeltmesi:** `--core-muted` değerini `#5a6578` olarak güncelle (beyaz zeminde 4.6:1 kontrast oranı):

```css
/* globals.css :root bloğunda */
--core-muted: #5a6578; /* AA kontrast — eski: #6f7c94 */
```

Dark mode'da da eşdeğer kontrastı doğrula.

5. **aria-live bölgeleri:** Bildirimler ve XP kazanımları için:

```tsx
// SahApp.tsx — milestone ve bildirim alanlarında
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {milestone ? `${milestone.title}` : ''}
</div>
```

```css
.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);border:0;white-space:nowrap}
```

### Kısıtlama
- Mevcut ARIA attribute'larını KALDIRMA
- SahApp.tsx'in yapısını radikal DEĞİŞTİRME
- Semantic HTML'i koru (article, section, nav, aside, main)

---

## GÖREV 2: QuranCompanionView Bileşen Ayrıştırma

### Sorun
`QuranCompanionView.tsx` tek dosyada **2902 satır**. Bu:
- Bakımı zorlaştırıyor
- Tree-shaking'i engelliyor
- Test yazmayı imkansız kılıyor

### Yapılacaklar

1. Dosyayı şu alt bileşenlere ayır:

```
src/components/quran/
├── QuranCompanionView.tsx    ← ana orchestrator (max 200 satır)
├── QuranReadTab.tsx           ← "Oku" sekmesi (StudyWorkspace + Dashboard özet)
├── QuranStudyTab.tsx          ← "Çalış" sekmesi (Exercises + ProgressMap + Achievements)
├── QuranCommunityTab.tsx      ← "Topluluk" sekmesi (Chat + StudyGroup + TeacherProfile)
├── QuranWisdomWheel.tsx       ← Günlük ayet/hadis çarkı
├── QuranSurahList.tsx         ← Sure listesi bileşeni
├── QuranExerciseCard.tsx      ← Tekil egzersiz kartı
├── QuranProgressChart.tsx     ← İlerleme görseli
├── QuranChatThread.tsx        ← Mesajlaşma thread bileşeni
└── QuranEmptyState.tsx        ← Kur'an bölümüne özel boş durum
```

2. Her dosyanın üstüne importları koy, prop type'ları `interface` olarak tanımla

3. Mevcut `QuranCompanionView.tsx`'i `src/components/quran/QuranCompanionView.tsx`'e taşı

4. `src/components/core/QuranCompanionView.tsx`'i yeniden oluştur:

```typescript
// Sadece re-export — geriye uyumluluk
export { default } from '@/components/quran/QuranCompanionView';
```

5. Mevcut `EmptyState` fonksiyonunu (satır 2861) `QuranEmptyState.tsx`'e taşı

### Kısıtlama
- İç mantığı DEĞİŞTİRME — sadece dosya yapısını reorganize et
- Supabase sorgularını DEĞİŞTİRME
- useQuranPresence, useQuranSession hook'larını DEĞİŞTİRME
- Tab yapısı (Faz 2'de 3 tab olarak ayarlandı) korunsun
- Her ayrıştırmadan sonra `npm run build` çalıştır

---

## GÖREV 3: Mescidim Taşınabilirlik (BTÜ Bağımlılığını Kaldır)

### Sorun
MescidimView.tsx satır 40 ve 56'da sabit kodlanmış:
- `"BTÜ cami topluluğu"` buton metni
- `"Bursa Teknik Üniversitesi · Mescidim"` eyebrow
- `"Şehit Astsubay Ömer Halisdemir Camii"` başlık
- `"Bursa"` konum

### Yapılacaklar

1. Cami profili için bir konfigürasyon dosyası oluştur:

```typescript
// src/lib/mosqueProfile.ts
export interface MosqueProfile {
  name: string;
  campus: string;
  city: string;
  eyebrow: string;
  description: string;
}

export const DEFAULT_MOSQUE: MosqueProfile = {
  name: 'Şehit Astsubay Ömer Halisdemir Camii',
  campus: 'Bursa Teknik Üniversitesi',
  city: 'Bursa',
  eyebrow: 'BURSA TEKNİK ÜNİVERSİTESİ · MESCİDİM',
  description: 'Vakitlerin, tefekkürün ve üniversite topluluğunun ortak hafızası.',
};

export function getMosqueProfile(): MosqueProfile {
  return DEFAULT_MOSQUE;
}
```

2. `MescidimView.tsx` içindeki sabit metinleri `getMosqueProfile()` ile değiştir:

```typescript
const mosque = getMosqueProfile();
// Satır 40: buton metni
<button ...>{mosque.campus} cami topluluğu</button>
// Satır 56: eyebrow, başlık, açıklama
<span className="eyebrow">{mosque.eyebrow}</span>
<h2>{mosque.name}</h2>
<p>{mosque.description}...</p>
<span><AppIcon name="map-pin" /> {mosque.city}</span>
```

3. "Kişisel alanım" başlığını da dinamik yap:
   - `localCommunity ? \`${mosque.campus} cami topluluğu\` : 'Kişisel manevi alanım'`

### Kısıtlama
- Camii SVG illüstrasyonunu DEĞİŞTİRME
- PrayerTimes, MescidimLibrary, MosqueEventArchive bileşenlerini DEĞİŞTİRME
- Supabase sorgularını DEĞİŞTİRME
- Varsayılan profil BTÜ olarak kalmalı (geriye uyumluluk)

---

## GÖREV 4: Dark Mode Tutarlılığı

### Sorun
`[data-theme="dark"]` bloğu (globals.css satır 703-711) ana bileşenleri kapsıyor ama:
- Journal bileşenleri eksik (journal.css ayrı dosya)
- Mescidim bileşenleri eksik
- Profession School bileşenleri eksik
- Focus Timer dark mode'da bazı arka planlar sert beyaz

### Yapılacaklar

1. **Journal dark mode** — `src/app/journal.css` dosyasının sonuna ekle:

```css
[data-theme="dark"] .journal-workspace {
  --journal-bg: #0f1628;
  --journal-surface: rgba(20, 27, 47, 0.96);
  --journal-ink: #e8ecf4;
  --journal-muted: #8a95ad;
  --journal-line: rgba(199, 210, 254, 0.1);
}
[data-theme="dark"] .journal-heading { color: var(--journal-ink) }
[data-theme="dark"] .journal-hub-tabs button { color: var(--journal-muted); background: var(--journal-surface) }
[data-theme="dark"] .journal-hub-tabs button[aria-selected="true"] { color: #c7d2fe; background: rgba(99, 102, 241, 0.15) }
[data-theme="dark"] .journal-notebook { background: var(--journal-surface); box-shadow: inset 0 0 0 1px var(--journal-line) }
[data-theme="dark"] .journal-notebook textarea { color: var(--journal-ink); background: transparent }
[data-theme="dark"] .journal-notebook .mood-selector button { color: var(--journal-muted) }
```

2. **Mescidim dark mode** — globals.css dark mode bloğuna ekle:

```css
[data-theme="dark"] .mescidim-scope-tabs { background: rgba(20, 27, 47, 0.8) }
[data-theme="dark"] .mescidim-scope-tabs button { color: #98a5bd }
[data-theme="dark"] .mescidim-scope-tabs button[aria-selected="true"] { color: #c7d2fe; background: rgba(99, 102, 241, 0.12); box-shadow: none }
[data-theme="dark"] .mosque-identity-hero { background: linear-gradient(135deg, #141b2f, #1a1230) }
[data-theme="dark"] .mosque-identity-copy { color: #e5e7f6 }
[data-theme="dark"] .mescidim-today-hero { background: rgba(20, 27, 47, 0.96) }
```

3. **Profession School dark mode:**

```css
[data-theme="dark"] .profession-track-card { background: rgba(20, 27, 47, 0.96); box-shadow: inset 0 0 0 1px rgba(199, 210, 254, 0.1) }
[data-theme="dark"] .profession-lesson-card { background: rgba(20, 27, 47, 0.96) }
[data-theme="dark"] .profession-lesson-card h3 { color: #eef2ff }
```

4. **SAH World teması dark mode:** `[data-theme="dark"]` altındaki SAH World tokenlerinin tutarlılığını doğrula:

```css
/* globals.css — mevcut satır 1227'deki bloğu doğrula ve eksik tanımları ekle */
[data-theme="dark"] .mescidim-scope-tabs { background: rgba(16, 38, 29, 0.6) }
[data-theme="dark"] .mescidim-scope-tabs button[aria-selected="true"] { color: #8ff2d2; background: rgba(0, 155, 119, 0.2) }
```

### Kısıtlama
- Mevcut `[data-theme="dark"]` kurallarını KALDIRMA
- Işık temasını DEĞİŞTİRME
- SAH World temasının (yeşil/krem) kimliğini koru

---

## GÖREV 5: Birleşik Empty State Bileşeni

### Sorun
Projede 6 farklı yerde `EmptyState` veya `empty-state` div kalıbı tekrarlanıyor:
- `DashboardView.tsx:186` — inline `Empty` fonksiyonu
- `QuranCompanionView.tsx:2861` — inline `EmptyState` fonksiyonu
- `MescidimLibrary.tsx:209` — inline `EmptyState` fonksiyonu
- `ReportsView.tsx:333` — inline div
- `SectionView.tsx:446` — inline div
- `CommunityView.tsx:700, 778` — inline div

### Yapılacaklar

1. Ortak bileşen oluştur:

```typescript
// src/components/ui/EmptyState.tsx
import { AppIcon } from './AppIcon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  compact?: boolean;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon, title, description, compact, action }: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <i><AppIcon name={icon} /></i>
      <strong>{title}</strong>
      <p>{description}</p>
      {action && (
        <button className="ghost-button" onClick={action.onClick}>
          {action.label} <AppIcon name="arrow-right" />
        </button>
      )}
    </div>
  );
}
```

2. Mevcut inline kullanımları bu bileşenle değiştir:

```typescript
// DashboardView.tsx
import EmptyState from '@/components/ui/EmptyState';
// ... yerine:
<EmptyState icon="notes" title="Yolculuğun ilk izi seni bekliyor" description="Bugünden tek bir cümle bırak; zaman akışın sakin sakin şekillenmeye başlasın." compact />
```

3. Her kullanım noktasında önceki ikon, başlık ve açıklamayı KORU — sadece yapıyı değiştir

4. `QuranCompanionView.tsx` ve `MescidimLibrary.tsx`'deki lokal `EmptyState` fonksiyonlarını sil, import'a çevir

### Kısıtlama
- Mevcut `empty-state` CSS sınıflarını DEĞİŞTİRME
- Her bileşenin mevcut mesajlarını KORU
- `compact` variant'ı mevcut kullanımına göre ayarla

---

## GÖREV 6: Bundle Boyutu ve Performans

### Sorun
- GSAP (ScrollTrigger dahil) DashboardView'da dynamic import ile yükleniyor — doğru
- Ancak QuranCompanionView (2902 satır) tek chunk'ta yükleniyor
- `globals.css` 2400+ satır — ayrıştırma potansiyeli var

### Yapılacaklar

1. **QuranCompanionView** zaten Görev 2'de ayrıştırılacak. Bu görev:
   - Her alt bileşeni `dynamic()` ile lazy import et:

```typescript
// src/components/quran/QuranCompanionView.tsx
const QuranReadTab = dynamic(() => import('./QuranReadTab'), {
  loading: () => <SectionSkeleton />,
});
const QuranStudyTab = dynamic(() => import('./QuranStudyTab'), {
  loading: () => <SectionSkeleton />,
});
const QuranCommunityTab = dynamic(() => import('./QuranCommunityTab'), {
  loading: () => <SectionSkeleton />,
});
```

2. **Görselleri optimize et:**
   - SVG inline görselleri (mosque illüstrasyonu, GrowthTree) ayrı `.svg` dosyalarına taşı
   - `next/image` ile yükleme önerilir ama SVG inline kalabilir

3. **CSS değişkenleri audit:**
   - Kullanılmayan CSS değişkenlerini tespit et
   - `globals.css` içinde `--cyber-` prefix'li değişkenler kullanılıyor mu kontrol et
   - Kullanılmayanları kaldır

4. **Font subset:**
   - `layout.tsx`'deki Noto Serif font'unda `subsets: ["latin", "latin-ext"]` var
   - Türkçe karakterler latin-ext'te — doğru
   - JetBrains Mono sadece kod alanlarında kullanılıyor mu kontrol et, kullanılmıyorsa kaldır

5. **Preload hint'leri:**
   - `layout.tsx`'e Tabler Icons preload ekle:

```tsx
<link
  rel="preload"
  href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css"
  as="style"
/>
```

### Kısıtlama
- GSAP dynamic import yapısını DEĞİŞTİRME
- Mevcut `next/font/google` import yapısını DEĞİŞTİRME (sadece gereksiz olanı kaldır)
- `globals.css`'den aktif kullanılan CSS kurallarını silme
- Performans optimizasyonlarından sonra `npm run build` ile bundle boyutunu karşılaştır

---

## TEKNİK KISITLAMALAR (TÜM GÖREVLER İÇİN)

1. Her değişiklikten sonra `npm run build` çalıştır — TypeScript hatası bırakma
2. Tailwind CSS v4 kullan — `@apply` kabul ama vanilla CSS tercih
3. Responsive: 620px (mobil), 900px (tablet), desktop
4. AnimatePresence geçişleri korunsun
5. Commit mesajı formatı:
   ```
   feat(quality): a11y sweep, quran refactor, dark mode consistency

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```

6. Erişilebilirlik test etme:
   - Tab tuşuyla tüm interaktif elemanlara ulaşılabilmeli
   - Ekran okuyucu ile anlaşılır etiketler
   - Renk kontrast oranları 4.5:1 minimum (AA)

---

## ÖNCELIK SIRASI

1. **Görev 1** (Erişilebilirlik) — en kritik kalite eksikliği
2. **Görev 4** (Dark mode) — görünür UX tutarsızlığı
3. **Görev 5** (Empty State) — hızlı kazanım, kod tekrarını azaltır
4. **Görev 2** (Kur'an refaktör) — en büyük teknik borç
5. **Görev 3** (Mescidim) — taşınabilirlik
6. **Görev 6** (Performans) — Görev 2'ye bağımlı, en son

## DOĞRULAMA KONTROL LİSTESİ

- [ ] `npm run build` başarılı
- [ ] Tab tuşuyla tüm navigasyon elemanlarına ulaşılabiliyor
- [ ] Skip link görünüyor ve çalışıyor
- [ ] `--core-muted` kontrastı 4.5:1+ (hem açık hem koyu temada)
- [ ] QuranCompanionView < 250 satır, alt bileşenler ayrı dosyalarda
- [ ] `import QuranCompanionView from '@/components/core/QuranCompanionView'` hâlâ çalışıyor
- [ ] Mescidim'de sabit BTÜ metni kalmamış, `getMosqueProfile()` kullanılıyor
- [ ] Journal, Mescidim, Profession School dark mode'da okunabilir
- [ ] Tüm empty state'ler `EmptyState` bileşenini kullanıyor
- [ ] Bundle boyutu artmamış veya azalmış
- [ ] Mobil (375px) ve desktop (1280px) düzgün görünüyor
