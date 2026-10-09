# Codex Prompt: SAH World — Faz 2: Deneyim İyileştirmesi

**Hedef:** Onboarding, kişiselleşme, sidebar ve Kur'an bölümü sadeleştirmesi.
**Branch:** `feature/faz2-deneyim` (main'den oluştur, Faz 1 merge edildikten sonra başla)
**Süre tahmini:** 3-4 hafta
**Bağımlılık:** Faz 1 tamamlanmış olmalı (tip ölçeği, mobil nav, awareness sadeleştirme)

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

## TASARIM TOKENLERİ (FAZ 1'DEN SONRA)

```
:root {
  /* Faz 1'de eklenen tip ölçeği */
  --text-display: clamp(28px, 4vw, 48px);
  --text-h2: clamp(20px, 2.5vw, 28px);
  --text-body: 15px;
  --text-small: 13px;
  --text-caption: 11px;
  --font-display: Georgia, 'Times New Roman', serif;

  /* Mevcut tokenler */
  --font-inter: 'Inter', system-ui, sans-serif;
  --brand-primary: #4f46e5;
  --brand-violet: #7c3aed;
  --canvas: #090d16;
  --surface: #0f172a;
  --surface-raised: #18213a;
  --ink-primary: #f8fafc;
  --ink-muted: #94a3b8;
}
```

---

## GÖREV 1: Progressive Onboarding (WelcomeGuide.tsx)

### Referans: Duolingo
Duolingo yeni kullanıcıyı kayıt bile sormadan ilk derse başlatır. 2 dakikada basarı hissi verir.

### Sorun
`WelcomeGuide.tsx` mevcut ama ne kadar etkili olduğu belirsiz. Kullanıcı Dashboard'a geldiğinde 8 farklı bileşenle karşılaşıyor.

### Yapılacaklar

1. `src/components/core/WelcomeGuide.tsx` dosyasını güncelle:

```
İlk giriş akışı (3 adım):
1. "Hoş geldin, {isim}" — tek cümle, büyük serif başlık
2. "İlk niyetini belirle" — journal'a yönlendiren tek CTA buton
3. "İlk adımın tamamlandı!" — kutlama animasyonu + XP ödülü
```

2. Adım 2'de kullanıcı bir cümle yazdığında:
   - `addXP(25, "İlk niyet")` çağır
   - Kutlama animasyonu göster (MilestoneCelebration benzeri)
   - Dashboard'a geri döndür

3. localStorage key: `sah:onboarding-complete` — tamamlanınca bir daha gösterme

4. CSS: Tam ekran overlay, blur arka plan, ortada tek kart

```css
.welcome-guide-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  background: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(12px);
}
.welcome-guide-card {
  max-width: 480px;
  padding: var(--space-12) var(--space-8);
  border-radius: var(--radius-lg);
  background: var(--surface);
  text-align: center;
  box-shadow: var(--shadow-raised);
}
.welcome-guide-card h1 {
  font-family: var(--font-display);
  font-size: var(--text-display);
}
```

### Kısıtlama
- Mevcut WelcomeGuide varsa üzerine yaz, yoksa oluştur
- XP sistemi (addXP) kullan, yeni puan sistemi ekleme

---

## GÖREV 2: Dashboard Quick Actions Sadeleştirme (DashboardView.tsx)

### Referans: Notion — açılışta tek CTA

### Sorun
`quickActions` dizisinde 6 buton var. Hick's Law: seçenek arttıkça karar süresi artar.

### Yapılacaklar

1. `quickActions` 6 → 3 sabit aksiyona düşür:

```typescript
const quickActions = [
  { id: 'focus', icon: 'target-arrow', title: 'Odaklan', note: 'Kesintisiz bir çalışma seansı başlat' },
  { id: 'journal', icon: 'pencil', title: 'Günlük yaz', note: 'Bugünü birkaç cümleyle kaydet' },
  { id: 'mescidim', icon: 'building-mosque', title: 'Mescidim', note: 'Vakit ve zikir alanına git' },
];
```

2. `personalizedActions` ve `suggested` mantığını koru ama "SANA UYGUN KÜÇÜK ADIM" bölümünü sadeleştir

3. "daily-wheel" ve "sukur" ve "matrix" quick action'lardan KALDIRMA — onları yalnızca akıllı öneri olarak göster

### Kısıtlama
- DashboardView'ın diğer bölümlerini (GrowthTree, metrics, activity) DEĞİŞTİRME
- `onNavigate` prop API'sini DEĞİŞTİRME

---

## GÖREV 3: Sidebar Collapsible Icon-Rail (SahApp.tsx)

### Referans: Linear — dar modda sadece ikonlar, hover'da tooltip

### Sorun
8 bölüm sidebar'da uzun liste oluşturuyor. Collapse/expand özelliği yok.

### Yapılacaklar

1. `SahApp.tsx` içinde sidebar state'i ekle:

```typescript
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
```

2. Collapsed modda:
   - Her item sadece ikon gösterir (48x48 buton)
   - Hover'da tooltip ile label gösterir
   - Sidebar genişliği: 72px (collapsed), 260px (expanded)
   - Toggle butonu: sidebar'ın altında `<AppIcon name="layout-sidebar-right" />`

3. Expanded modda:
   - Mevcut yapı korunsun (ikon + label)

4. localStorage key: `sah:sidebar-collapsed` — tercihi hatırla

5. CSS (globals.css):

```css
.core-sidebar {
  width: 260px;
  transition: width .25s cubic-bezier(.16,1,.3,1);
}
.core-sidebar.collapsed {
  width: 72px;
}
.core-sidebar.collapsed .nav-label {
  display: none;
}
.core-sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}
.core-sidebar .nav-item {
  position: relative;
}
.core-sidebar.collapsed .nav-item:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--surface-raised);
  color: var(--ink-primary);
  font-size: var(--text-small);
  font-weight: 500;
  white-space: nowrap;
  box-shadow: var(--shadow-card);
  z-index: 50;
  pointer-events: none;
}
```

### Kısıtlama
- Mobil navigasyonu (Faz 1'de eklenen bottom sheet) DEĞİŞTİRME
- `navigationItems` dizisinin sırasını DEĞİŞTİRME
- 768px altında sidebar zaten gizleniyor — bu davranışı koru

---

## GÖREV 4: Kur'an Bölümü Sadeleştirme (QuranCompanionView.tsx)

### Referans: Quran.com — temiz, 3 adımlı akış

### Sorun
9 alt-modül var: QuranDashboard, QuranExercises, QuranProgressMap, QuranStudyWorkspace, QuranAchievements, QuranChat, QuranStudyGroup, QuranTeacherProfile, QuranTeacherFeedback.

### Yapılacaklar

1. 9 modülü 3 ana sekmeye düşür:

```
OKU → QuranStudyWorkspace (sure seçimi + okuma)
ÇALIŞ → QuranExercises + QuranProgressMap (egzersizler + ilerleme haritası)
TOPLULUK → QuranChat + QuranStudyGroup + QuranTeacherProfile (sosyal)
```

2. QuranDashboard → "Oku" sekmesinin üst kısmına entegre et (streak, günlük ayet, ilerleme özeti)
3. QuranAchievements → Ayrı tab yerine "Çalış" sekmesinin alt kısmında göster
4. QuranTeacherFeedback → "Topluluk" sekmesinde hoca profilinin altında

5. Tab yapısı:

```typescript
type QuranTab = "oku" | "calis" | "topluluk";
```

6. QURAN_TABS sabitini güncelle (`src/lib/appLocation.ts`)

### Kısıtlama
- Bileşenlerin iç mantığını DEĞİŞTİRME — sadece nerede render edildiklerini reorganize et
- Supabase sorgularını DEĞİŞTİRME
- useQuranPresence hook'unu koru
- useQuranSession store'unu koru

---

## GÖREV 5: Raporlarda Karşılaştırmalı Insight (ReportsView.tsx)

### Referans: Apple Health — "Bu hafta geçen haftadan %X daha aktifsin"

### Sorun
Haftalık içgörü metni statik formül: "Bu hafta en çok {kategori} alanına döndün." Gerçek bir karşılaştırma yok.

### Yapılacaklar

1. `src/lib/weeklyInsights.ts` dosyasına karşılaştırma fonksiyonu ekle:

```typescript
export function buildComparativeInsight(
  thisWeekEvents: ActivityEvent[],
  allEvents: ActivityEvent[]
): string {
  const now = new Date();
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(lastWeekStart.getDate() - 13);
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  const lastWeekCount = allEvents.filter(e => {
    const d = new Date(e.createdAt);
    return d >= lastWeekStart && d < lastWeekEnd;
  }).length;

  const thisWeekCount = thisWeekEvents.length;

  if (lastWeekCount === 0 && thisWeekCount === 0)
    return "Bu hafta henüz bir adım bırakmadın. Tek bir küçük kayıtla başlayabilirsin.";
  if (lastWeekCount === 0)
    return `Bu hafta ${thisWeekCount} adım bıraktın — yolculuğun başlıyor!`;

  const change = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
  if (change > 0)
    return `Bu hafta geçen haftadan %${change} daha aktifsin. ${thisWeekCount} küçük adım biriktirdin.`;
  if (change < 0)
    return `Geçen haftaya kıyasla biraz daha sakinsin — ama her geri dönüş yeni bir başlangıç.`;
  return `Geçen haftayla aynı ritimdesin — ${thisWeekCount} adım. İstikrar güçlü bir erdem.`;
}
```

2. `ReportsView.tsx` içinde mevcut statik mesajı bu fonksiyonla değiştir

### Kısıtlama
- Mevcut `buildWeeklyInsights` fonksiyonunu KALDIRMA — yenisini yanına ekle
- Mevcut heatmap, trend chart yapılarını DEĞİŞTİRME

---

## GÖREV 6: Focus Timer Varsayılan Başlangıç (FocusTimerView.tsx)

### Referans: Calm — tek buton ile başla, seçenekler ayarlarda

### Sorun
Timer açılırken kullanıcıya timer type, sound, background, duration seçtiriliyor. Çok fazla karar noktası.

### Yapılacaklar

1. İlk açılışta doğrudan timer ekranını göster:
   - Varsayılan: countdown, 25 dakika, ses kapalı, arka plan otomatik
   - Tek "Başla" butonu

2. Ayarları (timer type, ses, arka plan) KALDIRMA — sadece başlangıç ekranından gizle:
   - Timer çalışıyorken veya durduğunda erişilebilir (mevcut modal sistemi)
   - İlk ekranda görünmesin

3. Eğer kullanıcı daha önce seans yapmışsa, son tercihlerini localStorage'dan oku:
   - `useFocusTimerStore` zaten bunu yapıyor — doğrula

### Kısıtlama
- FocusAudioEngine yapısını DEĞİŞTİRME
- FocusBackdrop, FocusPresets bileşenlerini KALDIRMA — sadece ilk ekrandan gizle
- `finalizeFocusSession` mantığını DEĞİŞTİRME
- Focus sayfası ayrı route (/focus) olarak da var — her iki entry point'te de çalıştığını doğrula

---

## TEKNİK KISITLAMALAR (TÜM GÖREVLER İÇİN)

1. Her değişiklikten sonra `npm run build` çalıştır — TypeScript hatası bırakma
2. Tailwind CSS v4 kullan — `@apply` kabul ama vanilla CSS tercih
3. Responsive: 620px (mobil), 900px (tablet), desktop
4. AnimatePresence geçişleri korunsun
5. Commit mesajı formatı:
   ```
   feat(ux): onboarding, sidebar ve kur'an sadeleştirme

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```

6. localStorage key'leri:
   - Yeni eklenenler: `sah:onboarding-complete`, `sah:sidebar-collapsed`
   - Mevcut değişmesin: `sah:boycotts`, `sah:missions`, `sah:journey-days`

---

## ÖNCELIK SIRASI

1. **Görev 1** (Onboarding) — kullanıcı ilk deneyimi
2. **Görev 2** (Dashboard Quick Actions) — hızlı düzeltme
3. **Görev 4** (Kur'an sadeleştirme) — en büyük iş
4. **Görev 3** (Sidebar) — UI iyileştirme
5. **Görev 5** (Rapor insight) — veri iyileştirme
6. **Görev 6** (Focus başlangıç) — UX polish

## DOĞRULAMA KONTROL LİSTESİ

- [ ] `npm run build` başarılı
- [ ] Yeni kullanıcıda onboarding çalışıyor
- [ ] Mevcut kullanıcıda onboarding gösterilmiyor
- [ ] Dashboard 3 quick action gösteriyor
- [ ] Sidebar collapse/expand çalışıyor, tercih hatırlanıyor
- [ ] Kur'an bölümü 3 tab ile çalışıyor
- [ ] Rapor insight'ı karşılaştırmalı metin gösteriyor
- [ ] Focus tek butonla başlıyor
- [ ] Mobil (375px) ve desktop (1280px) düzgün görünüyor
