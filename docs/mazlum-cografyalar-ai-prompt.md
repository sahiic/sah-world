# Mazlum Cografyalar — Yapay Zeka Araci icin Detayli Uygulama Promptu

> Bu prompt, SAH World platformundaki "Mazlum Cografyalar" bolumunu profesyonel, etkili ve surdurulebilir bir farkindalik/bilinclendirme platformuna donusturmek icin bir yapay zeka kodlama aracina (Claude Code, Cursor, vb.) verilecek kapsamli talimattir.

---

## PROMPT BASLANGICI

---

Sen, SAH World adli Turkce bir dijital platform uzerinde calisan bir full-stack gelistiricisin. Gorevim: "Mazlum Cografyalar" (Filistin ve Dogu Turkistan farkindalik) bolumunu, multidisipliner arastirmaya dayanan kapsamli bir donusum ile profesyonel, etkili ve surdurulebilir bir bilinclendirme/harekete gecirme platformuna yukseltmek.

### TEKNOLOJi YIGINI
- **Framework**: Next.js 16+ (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/postcss`)
- **Veritabani & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Animasyon**: Framer Motion + GSAP (ScrollTrigger)
- **State**: Zustand (`useAuthStore`, `useJourneyStore`)
- **Ikonlar**: `AppIcon` componenti (Tabler Icons bazli)
- **Deployment**: Vercel

### TASARIM SiSTEMi
- **Renk paleti**: Emerald #009B77, Cream #fbf9f6, Gold #c5a059, Forest-deep #0d2b1d
- **Farkindalik aksani**: Filistin = #9f1239 (koyu kirmizi), Dogu Turkistan = #b91c1c (kirmizi)
- **Tema**: "Ruhani & Modern Erdem Arayuzu" — yumusak koseler, blur efektleri, beyaz/krem arka plan
- **Dark mode**: `[data-theme="dark"]` secicisi ile tam destek
- **Tipografi**: Inter font, responsive boyutlar
- **Responsive**: Mobile-first, 620px / 768px / 1100px breakpoint'ler

### GUVENLiK KURALLARI (MUTLAK)
1. Supabase URL, anon key, service role key, Vercel token, sifre veya `.env` iceriklerini asla koda, mesaja veya GitHub'a yazma
2. Main dalina dogrudan kod gonderme — her is icin `feature/...` dalinda calis
3. Mevcut kullanici verilerini silme veya uzerine yazma
4. Grafik goruntu (siddete ait fotograf/video) asla kullanma — insan onurunu koru
5. Her olguyu dogrulanabilir kaynaga dayandır

### MEVCUT DOSYA YAPISI
```
src/components/core/AwarenessView.tsx — Ana farkindalik sayfasi
src/components/core/AwarenessProfileSummary.tsx — Profil ozeti
src/lib/awareness.ts — Veri, tipler, icerik fallback'leri
src/app/globals.css — Tum stiller (awareness- ile baslayan class'lar)
src/app/farkindalik/[geography]/page.tsx — SSR sayfa
src/lib/appLocation.ts — Navigasyon
```

### MEVCUT AwarenessView YAPISI
```
AwarenessView (ana component)
├── header: awareness-route-bar (baslik + okuma ilerlemesi)
├── nav: awareness-geography-tabs (Filistin | Dogu Turkistan secimi)
├── nav: awareness-mode-tabs (Anlati | Ne Yapabiliriz | Bilgi Testi)
├── ScrollyNarrative (GSAP scroll animation + Intersection Observer)
│   ├── awareness-opening (acilis ifadesi + kaynak)
│   ├── awareness-story-grid
│   │   ├── awareness-visual-rail (SVG zaman cizgisi + orbit animasyonu)
│   │   └── awareness-story-panels (6 bolum, her biri kaynakli)
│   └── awareness-source-dock (sticky kaynak gostergesi)
├── ActionPanel ("Ne Yapabiliriz?" — 4 eylem karti)
│   ├── Bilgi testi yonlendirmesi
│   ├── Insani yardim kuruluslari (Kizilay, UNICEF)
│   ├── Dua kutuphanesine yonlendirme (Mescidim entegrasyonu)
│   └── Kaynakli paylasim (WhatsApp, X, Instagram, kopyala)
├── Quiz (10 soruluk kaynakli bilgi testi + XH odulu)
└── footer: awareness-integrity-note (kaynak seffafligi notu)
```

### MEVCUT Supabase TABLOLARI
```sql
regional_awareness_content — Dogrulanmis icerik
awareness_quiz_questions — Quiz sorulari
user_quiz_attempts — Kullanici quiz denemeleri
awareness_engagement_log — Etkilesim kaydi (okuma, paylasim, vb.)
```

---

## YAPILACAK iSLER — 10 MODÜL

Her modulu sirasiyla, tamamen calisan ve test edilmis sekilde uygula. Her modulun sonunda TypeScript hatasi sifir olmali.

---

### MODUL 1: BOYKOT REHBERi & BiLiNCLi TUKETiM

**Bilimsel Temel**: Fogg Davranis Modeli — davranis degisikligi icin motivasyon + yetenek + tetikleyici gerekir. Boykot, en somut ve tekrarlanabilir eylem bicimidir.

**Yapilacaklar**:

1. **Yeni dosya**: `src/lib/boycottData.ts`
   - Kategoriler: `gida`, `teknoloji`, `moda`, `kozmetik`, `icecek`, `market`, `diger`
   - Her marka icin tip:
     ```typescript
     type BoycottItem = {
       id: string
       category: BoycottCategory
       brandName: string
       parentCompany: string
       reason: string
       sourceUrl: string
       sourceName: string
       alternatives: { name: string; note: string; url?: string }[]
       isActive: boolean
       addedDate: string
     }
     ```
   - Dogrulanmis kaynaklardan (BDS resmi listesi, boykot.org vb.) en az 30 marka ile baslat
   - ONEMLI: Her markanin boykot nedeni bir kaynaga dayanmali

2. **Yeni component**: `src/components/awareness/BoycottGuide.tsx`
   - Kategori filtreleme (tab'lar veya chip'ler)
   - Arama cubugu (marka adi ile arama)
   - Her marka karti:
     - Marka adi + ana sirket
     - Boykot nedeni (kisa)
     - Kaynak linki
     - Alternatif urunler listesi (yesil highlight)
     - "Ben de boykot ediyorum" toggle butonu
   - Kullanicinin boykot karnesi: "12/30 markayi biraktin" ilerleme cubugu
   - "Bu haftanin odak boykotu" — her hafta one cikan 1 marka

3. **Supabase tablolari**:
   ```sql
   CREATE TABLE boycott_items (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     category TEXT NOT NULL,
     brand_name TEXT NOT NULL,
     parent_company TEXT,
     reason TEXT NOT NULL,
     source_url TEXT NOT NULL,
     source_name TEXT NOT NULL,
     alternatives JSONB DEFAULT '[]',
     is_active BOOLEAN DEFAULT true,
     added_date DATE DEFAULT CURRENT_DATE,
     created_at TIMESTAMPTZ DEFAULT now()
   );

   CREATE TABLE user_boycott_log (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     boycott_item_id UUID REFERENCES boycott_items(id),
     is_boycotting BOOLEAN DEFAULT true,
     started_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE(user_id, boycott_item_id)
   );
   ```

4. **AwarenessView entegrasyonu**:
   - `awareness-mode-tabs`'a yeni tab ekle: "Boykot Rehberi" (ikon: `ban`)
   - `appLocation.ts`'deki panel tipine `boycott` ekle

5. **Stil**:
   - Kartlar: krem arka plan, ince border, hover'da hafif golge
   - Alternatifler: yesil arka planli chip'ler
   - Boykot toggle: kirmizi → yesil gecis animasyonu
   - Dark mode tam destek

---

### MODUL 2: TOPLULUK ETKiSi DASHBOARD'U

**Bilimsel Temel**: Sosyal Kanitlama (Social Proof) + Kolektif Eylem Teorisi — "yalniz degilsin" hissi motivasyonu arttirir.

**Yapilacaklar**:

1. **Yeni component**: `src/components/awareness/CommunityImpact.tsx`
   - Sayfanin ust kisminda (hero'nun altinda) kompakt bir bant:
     - "🕊 Topluluk Etkisi" baslik
     - Canli sayaclar (animated counter):
       - "X kisi anlatilari okudu"
       - "Y bilgi testi tamamlandi"
       - "Z kaynakli paylasim yapildi"
       - "W kisi boykot karnesi baslatti"
     - Sayaclar yukarı kayarak degisen sayi animasyonu (Framer Motion)

2. **Supabase fonksiyonu**: Aggregate sorgu ile topluluk istatistiklerini cek
   ```sql
   CREATE OR REPLACE FUNCTION get_community_stats()
   RETURNS TABLE(metric TEXT, value BIGINT) AS $$
   BEGIN
     RETURN QUERY
     SELECT 'readers'::TEXT, COUNT(DISTINCT user_id) FROM awareness_engagement_log WHERE event_type = 'section_read'
     UNION ALL
     SELECT 'quizzes'::TEXT, COUNT(*) FROM user_quiz_attempts
     UNION ALL
     SELECT 'shares'::TEXT, COUNT(*) FROM awareness_engagement_log WHERE event_type = 'shared'
     UNION ALL
     SELECT 'boycotters'::TEXT, COUNT(DISTINCT user_id) FROM user_boycott_log WHERE is_boycotting = true;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

3. **Gercek zamanli guncelleme**: Supabase realtime subscription ile sayaclar canli guncellensin (opsiyonel — performans etkisine gore karar ver)

4. **Stil**: Yatay kart banti, cam morfoloji (glassmorphism), hafif animasyon, responsive (mobilde 2x2 grid)

---

### MODUL 3: HAFTALIK FARKINDALIK GOREVLERi

**Bilimsel Temel**: Micro-activism + aliskanlik dongusu. Kucuk, tekrarlanan eylemler kalici davranis degisikligi yaratir.

**Yapilacaklar**:

1. **Yeni dosya**: `src/lib/weeklyMissions.ts`
   - Haftalik rotasyonlu gorev havuzu (en az 20 gorev):
     ```typescript
     type WeeklyMission = {
       id: string
       title: string
       description: string
       actionType: 'read' | 'share' | 'boycott' | 'learn' | 'connect' | 'pray'
       xhReward: number
       icon: string
       verificationMethod: 'self_report' | 'auto_track'
     }
     ```
   - Ornek gorevler:
     - "Bu hafta 1 kisiye kaynakli bilgi aktar" (share)
     - "1 boykot markasina alternatif bul" (boycott)
     - "Filistin tarihinden 1 yeni kavram ogren" (learn)
     - "Aile sofrasinda 5 dakika konuyu konus" (connect)
     - "Mazlumlar icin 1 dua oku" (pray)
     - "Dogu Turkistan hakkinda 1 kaynak incele" (read)

2. **Yeni component**: `src/components/awareness/WeeklyMissions.tsx`
   - "Bu Haftanin Gorevleri" karti (home panelinde)
   - 3 gorev gosterimi (haftalik rotasyon — hafta numarasina gore)
   - Her gorev: ikon + baslik + aciklama + XH odulu + "Tamamladim" butonu
   - Tamamlama animasyonu (confetti veya checkmark)
   - Haftalik ilerleme: "2/3 gorev tamamlandi"
   - Streak sayaci: "3. hafta ust uste gorev tamamladin!"

3. **Supabase tablolari**:
   ```sql
   CREATE TABLE user_mission_completions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     mission_id TEXT NOT NULL,
     week_number INT NOT NULL,
     completed_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE(user_id, mission_id, week_number)
   );
   ```

4. **Stil**: Gorev kartlari checklist tarzinda, tamamlananlar yesil tonla vurgulu

---

### MODUL 4: iNTERAKTiF ZAMAN CiZGiSi & iNFOGRAFiKLER

**Bilimsel Temel**: Gorsel hafiza, metin hafizasindan 6 kat gucludur. Infografikler %80 daha fazla paylasim alir.

**Yapilacaklar**:

1. **Yeni component**: `src/components/awareness/AwarenessTimeline.tsx`
   - Dikey zaman tuneli (mobilde tek sutun, masaustunde zigzag)
   - Filistin: 1948 → 1967 → 1987 → 1993 → 2000 → 2005 → 2008 → 2014 → 2021 → 2023 → Bugun
   - Dogu Turkistan: 1759 → 1865 → 1933 → 1949 → 1955 → 2014 → 2017 → 2019 → 2022 → Bugun
   - Her doniim noktasi: baslik + kisa aciklama + kaynak linki + ikon
   - Scroll ile aktif donem highlight
   - Tiklayinca detay popup'i

2. **Yeni component**: `src/components/awareness/InfoGraphic.tsx`
   - SVG bazli infografikler:
     - Multeci sayilari (kaynak: UNRWA)
     - Toprak kaybi zaman serisi
     - Kaynakli istatistikler
   - Responsive SVG viewBox
   - Dark mode renk uyumu
   - Paylasima hazir (export/screenshot olanagi)

3. **Entegrasyon**: "Anlati" paneline veya ayri bir "Kronoloji" tab'ina ekle

---

### MODUL 5: EMPATi MOLASI (COMPASSION RESET)

**Bilimsel Temel**: Nörobilim arastirmalari empati ile merhamet arasindaki farkı ortaya koyar. "Ile hissetmek" aci aglarini aktive eder ve yorar; "icin hissetmek" odul aglarini aktive eder ve enerji verir. Empati yorgunlugu onleme, kullaniciyi kaybetmemek icin kritik.

**Yapilacaklar**:

1. **Yeni component**: `src/components/awareness/CompassionReset.tsx`
   - Agir icerik sonrasi (ornegin tutuklu bolumu, kamp bolumu) otomatik gosterim
   - Yumusak gecis animasyonu (fade-in, blur arka plan)
   - Icerik:
     - "Bir nefes al. Ogrenmek cesaret ister."
     - Kisa bir ayet veya dua onerisi (Mescidim entegrasyonu)
     - Nefes egzersizi animasyonu (60 saniye, istege bagli)
     - "Hatirla: bilgi tasimak eylemdir."
     - "Hazir oldugunda devam et" butonu
   - Kullanici ayari: "Empati molasi gosterilsin mi?" toggle

2. **Tetikleme mantigi**: ScrollyNarrative icerisinde, "detention" veya "human" bolumlerinden sonra otomatik tetikle

3. **Stil**: Krem arka plan, yumusak gradient, buyuk tipografi, huzurlu his

---

### MODUL 6: FARKINDALIK SEViYELERi (AWARENESS LEVELS)

**Bilimsel Temel**: Oyunlastirma + kimlik insasi. "Ben bir Hafiza Koruyucusuyum" diyebilmek, kalici baglantiyi arttirir.

**Yapilacaklar**:

1. **Seviye tanimlari** (`src/lib/awarenessLevels.ts`):
   ```typescript
   const AWARENESS_LEVELS = [
     { level: 1, name: 'Gözlemci', icon: 'eye', requirement: 'İlk anlatıyı oku', xpThreshold: 0 },
     { level: 2, name: 'Öğrenci', icon: 'book', requirement: 'İlk testi geç', xpThreshold: 50 },
     { level: 3, name: 'Kaynak Takipçisi', icon: 'link', requirement: '5+ kaynak incele', xpThreshold: 150 },
     { level: 4, name: 'Ses Yükselt', icon: 'speakerphone', requirement: 'İlk paylaşımı yap', xpThreshold: 300 },
     { level: 5, name: 'Bilinçli Tüketici', icon: 'shopping-cart-off', requirement: 'Boykot karnesi başlat', xpThreshold: 500 },
     { level: 6, name: 'Dayanışma Elçisi', icon: 'heart-handshake', requirement: 'Haftalık görevleri tamamla', xpThreshold: 800 },
     { level: 7, name: 'Hafıza Koruyucusu', icon: 'shield-check', requirement: 'Tüm coğrafyaları tamamla', xpThreshold: 1200 },
   ]
   ```

2. **Yeni component**: `src/components/awareness/AwarenessLevelBadge.tsx`
   - Profil bolumunde ve AwarenessProfileSummary'de goruntuleme
   - Seviye ikonu + isim + ilerleme cubugu
   - Seviye atlama animasyonu (confetti + bildirim)

3. **Entegrasyon**: Mevcut XH sistemiyle uyumlu, `useJourneyStore` uzerinden

---

### MODUL 7: DUA & NiYET DUVARI

**Bilimsel Temel**: Manevi boyut + topluluk baglantisi + tekrar ziyaret motivasyonu. Dini pratik, psikolojik dayaniklilik ile pozitif korelasyon gosterir.

**Yapilacaklar**:

1. **Yeni component**: `src/components/awareness/PrayerWall.tsx`
   - Anonim niyet/dua yazma alani (maks 280 karakter)
   - Dua kartlari: kaligrafi tarzı yazi + zaman damgasi
   - "Amin" butonu (kalp/el ikonu) + sayaci
   - Filtreleme: Filistin | Dogu Turkistan | Genel
   - Gunluk/haftalik dua sayaci: "Bugün 147 dua edildi"
   - Moderasyon: uygunsuz icerik filtresi (client-side keyword + server-side review)

2. **Supabase**:
   ```sql
   CREATE TABLE community_prayers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id),
     prayer_text TEXT NOT NULL CHECK(char_length(prayer_text) <= 280),
     geography TEXT, -- 'filistin', 'dogu_turkistan', NULL for genel
     created_at TIMESTAMPTZ DEFAULT now(),
     is_approved BOOLEAN DEFAULT true,
     amin_count INT DEFAULT 0
   );

   CREATE TABLE prayer_amins (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     prayer_id UUID REFERENCES community_prayers(id),
     user_id UUID REFERENCES auth.users(id),
     created_at TIMESTAMPTZ DEFAULT now(),
     UNIQUE(prayer_id, user_id)
   );
   ```

3. **Mescidim entegrasyonu**: "Dua kutuphanesinden sec" butonu ile hazir dualari cekme

---

### MODUL 8: TANIKLIK DUVARI (WITNESS WALL)

**Bilimsel Temel**: Kisisel hikayeler istatistiklerden 22 kat daha akilda kalicidir (Stanford). Yuz + isim + hikaye = empati koprüsü.

**Yapilacaklar**:

1. **Yeni component**: `src/components/awareness/WitnessWall.tsx`
   - Dogrulanmis taniklik kartlari:
     - Tanik adi (veya guvenlik icin anonim)
     - Yer + tarih
     - Taniklik metni (kisa, 2-3 cumle)
     - Kaynak (nereden alindi)
   - Kart tasarimi: buyuk tirnak isareti, italic metin, yumusak arka plan
   - Sonsuz kaydirma (infinite scroll)
   - "Bu tanikligi kaynagindan oku" linki

2. **Veri kaynagi**: Dijital Hafiza, TRT Haber, UNRWA raporlari — sadece dogrulanmis, yayin izni olan tanikliklar

3. **ETiK KURALLAR**:
   - Grafik goruntu ASLA kullanma
   - Tanik kimligi gizliyse korumaya devam et
   - Travma tetikleyici icerikten once uyari goster
   - Cocuk tanikliklarda ekstra hassasiyet

---

### MODUL 9: 30 GUNLUK FARKINDALIK YOLCULUGU

**Bilimsel Temel**: Aralikli tekrar (spaced repetition) + aliskanlik dongusu (21-30 gun kurali) + tamamlama motivasyonu.

**Yapilacaklar**:

1. **Yapı**:
   - Hafta 1 (Gun 1-7): TARiHSEL ARKA PLAN
     - Her gun 1 kisa okuma + 1 soru
     - Filistin ve Dogu Turkistan'i paralel ogrenme
   - Hafta 2 (Gun 8-14): iNSAN HiKAYELERi
     - Tanikliklar + kisisel hikayeler
     - Empati egzersizleri
   - Hafta 3 (Gun 15-21): SOMUT EYLEMLER
     - Boykot baslat + paylasim yap + kuruluslari tani
     - Gunluk mini gorevler
   - Hafta 4 (Gun 22-30): SÜREKLiLiK
     - Haftalik gorev aliskanligi
     - Topluluk katilimi
     - Final testi + sertifika

2. **Yeni component**: `src/components/awareness/ThirtyDayJourney.tsx`
   - Gunluk icerik karti (5-10 dakika)
   - Ilerleme haritasi (gun ikonlari ile gorsel yol)
   - Push notification hatirlatma (mevcut bildirim sistemi ile entegre)
   - Tamamlama sertifikasi (paylasima uygun gorsel)

3. **XH Odulleri**: Her gun tamamlama = 10 XH, hafta tamamlama = bonus 50 XH, 30 gun tamamlama = 200 XH + "Hafiza Koruyucusu" rozeti

---

### MODUL 10: GENEL UX iYiLESTiRMELERi

**Yapilacaklar**:

1. **Ana sayfa (home) yeniden duzenleme**:
   - Ust bant: Topluluk Etkisi Dashboard (Modul 2)
   - Hero: Mevcut acilis + animasyon (koruma)
   - Haftalik Gorevler karti (Modul 3)
   - Son taniklik one cikarmasi (Modul 8)
   - Boykot odagi (Modul 1)
   - 30 Gunluk Yolculuk baslat CTA (Modul 9)

2. **Tab yapisi guncelleme** (`appLocation.ts`):
   ```
   home | anlati | eylem | boykot | kronoloji | taniklik | dua | test
   ```

3. **Paylasim kartlari iyilestirme**:
   - Open Graph gorsel sablonlari (her cografya icin)
   - Paylasim onizleme karti (WhatsApp, Twitter card)
   - QR kod olusturma (offline paylasim icin)

4. **Erisilebilirlik**:
   - ARIA etiketleri tum interaktif oge icin
   - Klavye navigasyonu tam destek
   - Ekran okuyucu uyumlulugu
   - Renk kontrast oranlari WCAG AA uyumlu

5. **Performans**:
   - Lazy loading tum agir componentler icin
   - Image optimization (next/image)
   - Code splitting (dynamic imports)
   - Supabase sorgularini cache'leme

---

## UYGULAMA KURALLARI

1. **Her modul icin sirasiyla**:
   - Once tip tanimlamasi (TypeScript types)
   - Sonra veri katmani (lib dosyasi + Supabase migration)
   - Sonra component
   - Sonra entegrasyon (AwarenessView'a ekleme)
   - Sonra stil (globals.css'e `.awareness-` prefix ile)
   - Son olarak test (TypeScript zero errors + gorsel dogrulama)

2. **Her component icin**:
   - `"use client"` direktifi
   - Framer Motion animasyonlari
   - Dark mode tam destek (`[data-theme="dark"]`)
   - Mobile-first responsive tasarim
   - Loading/empty/error durumlari
   - Supabase verisi yoksa fallback/demo veri gostermeli

3. **CSS kurallari**:
   - Tum class'lar `.awareness-` prefix ile
   - Globals.css'e ekle, ayri CSS dosyasi olusturma
   - Dark mode: `[data-theme="dark"] .awareness-xxx`
   - Responsive: `@media(max-width: 620px)` ve `@media(max-width: 768px)`

4. **Veri kurallari**:
   - Kullanici giris yapmamissa: demo/fallback veri goster, aksiyonlarda "Giris yapin" uyarisi
   - Her olgu mutlaka kaynakli olmali
   - Boykot listesi sadece dogrulanmis kaynaklardan
   - Tanikliklar sadece yayin izni olan kaynaklardan

5. **Etik kurallar**:
   - Grafik goruntu ASLA kullanma
   - Nefret soyleminden kacinma — bilgilendir, kiskirtma
   - Tanik kimligini koru
   - Travma tetikleyici icerikten once uyari goster
   - Cocuklarla ilgili iceriklerde ekstra hassasiyet
   - "Compassion fatigue" onleme mekanizmalari ekle

---

## BASARI KRiTERLERi

1. TypeScript zero errors
2. Tum modüller calisiyor ve gorsel olarak profesyonel
3. Dark mode tam destek
4. Mobile responsive (375px - 1440px)
5. Supabase entegrasyonu calisiyor (veya demo fallback)
6. Paylasim linkleri dogru calisiyor
7. Erisilebilirlik (ARIA, klavye, kontrast)
8. Sayfa yukleme suresi < 3 saniye
9. Her olgusal cumlenin kaynagi var
10. Empati molasi mekanizmasi calisiyor

---

## REFERANS KAYNAKLAR VE TEORiK CERCEVE

### Davranis Bilimi
- **Fogg Davranis Modeli (B = MAP)**: Davranis = Motivasyon × Yetenek × Tetikleyici. Platform tasariminda her uc faktoru birlikte ele al.
- **Nudge Teorisi (Thaler & Sunstein)**: Kullaniciyi zorlamadan, varsayilan secenekleri ve mekaniği kullanarak dogru eyleme yonlendir.
- **Aralikli Tekrar (Spaced Repetition)**: Bilgiyi 1 → 3 → 7 → 21 → 60 gun araliklarla tekrarlayarak uzun sureli hafizaya yerlestir.

### Psikoloji
- **Empati vs. Merhamet (Tania Singer, Max Planck)**: Empati yorar, merhamet enerji verir. Tasarimda "aciya odaklanma" yerine "dayaniklilik ve somut adim" vurgula.
- **Compassion Fatigue Onleme**: Agir icerikten sonra "nefes molasi" + pozitif dayanisma hikayesi.
- **Narratif Tasimacilik (Green & Brock)**: Hikayeye "tasinan" kisiler, istatistiklerden 22 kat daha fazla etkilenir.

### Sosyoloji & Sosyal Hareket Teorisi
- **Cerceveleme Teorisi (Snow & Benford)**: Tani (sorun ne?) → Cozum (ne yapilir?) → Motivasyon (neden sen?).
- **Kaynak Seferberlik Teorisi**: Basarili hareketler, bireysel sikayetlerden degil, organizasyon kapasitesinden dogar.
- **Kolektif Eylem (Olson)**: "Benim eylemim fark yaratir mi?" sorusuna somut cevap ver — sayaclar, etki gosterimleri.
- **Sosyal Kanitlama (Cialdini)**: "342 kisi bugun harekete gecti" — baskalarinin eylemini gostererek motivasyon arttirir.

### Dijital Aktivizm
- **BDS Hareketi**: Merkezi olmayan, tabansal, teknoloji destekli (barkod tarama, alternatif onerme).
- **#MilkTeaAlliance**: Sinir otesi dijital dayanisma — coklu platform, gorsel iletisim, mizah + bilgi.
- **Scrollytelling**: Interaktif hikaye anlatimi — UNHCR, NYT, Guardian ornekleri.

### Muzeler & Anit Tasarimi
- **USHMM "From Memory to Action"**: Interaktif masa + taahut duvari + sosyal paylasim.
- **Museo Memoria y Tolerancia**: iPad interaktifleri + birincil kaynaklar + kisisel tanikliklar.

### Oyunlastirma (Gamification)
- **Intrinsik Motivasyon (Deci & Ryan — SDT)**: Ozerklik + Yetkinlik + Aidiyet.
- **Anlatiya gomulu eylem**: Islemsel taleplerden %30 daha etkili.
- **Takim tabanli gorevler**: Bireysel siralamalardan daha etkili topluluk baglantisi yaratir.

---

## PROMPT SONU

---

> Bu prompt'u bir AI kodlama aracina (Claude Code, Cursor, Windsurf vb.) verdikten sonra, moduleri tek tek uygulamasini iste. Her modul tamamlandiginda gorsel kontrol yap ve ondan sonra bir sonraki modüle gec.
