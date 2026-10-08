# CODEX — Kur'an-ı Kerim Kardeşim: Kapsamlı İyileştirme Promptu

Tarih: 8 Ekim 2026
Proje: SAH World — `github.com/sahiic/sah-world`
Hedef dal: `feature/quran-polish` (main'den aç)

---

## Güvenlik kuralları (kesinlikle uy)

- Supabase URL, anon key, service role key, Vercel token, şifre, OTP veya `.env` içeriklerini asla mesaja, koda ya da GitHub'a yazma.
- `main` dalına doğrudan kod gönderme. Her iş için `feature/...` biçiminde ayrı branch aç.
- Mevcut kullanıcı değişikliklerini silme veya üzerine yazma.
- Grafik görüntü (şiddete ait fotoğraf/video) asla kullanma — insan onurunu koru.
- Her olguyu doğrulanabilir kaynağa dayandır.

## Teknik bağlam

| Alan | Değer |
|------|-------|
| Framework | Next.js 16+ (App Router), `force-dynamic`, React 19, TypeScript strict |
| CSS | Tailwind v4 (`@import "tailwindcss"` + `@tailwindcss/postcss`) |
| Veritabanı | Supabase PostgreSQL + RLS + Realtime + SECURITY DEFINER fonksiyonlar |
| Animasyon | Framer Motion AnimatePresence |
| State | Zustand (`useAuthStore`, `useJourneyStore`, `useQuranSession`) |
| Renkler | emerald `#009B77`, cream `#fbf9f6`, gold `#c5a059`, forest-deep `#0d2b1d` |
| Koyu tema | `[data-theme="dark"]` selector |
| CSS prefix | `.qc-` (quran companion) |
| Misafir modu | Zustand state, localStorage'a yazmaz |
| Navigasyon | `openAppView()` → `window.history.pushState()` (SPA, sayfa yenilemesiz) |
| Tekrar aralıkları | [1, 3, 7, 21, 60] gün |
| Hasanat | Uygulama içi motivasyon puanı; dinî sevap ölçüsü DEĞİL |
| Next.js docs | Kod yazmadan önce `node_modules/next/dist/docs/` oku (AGENTS.md kuralı) |
| Canlı site | https://sah-world.vercel.app |
| Migration'lar | 022, 030-036 canlı veritabanında uygulandı |

## Mevcut mimari (dokunma, sadece anla)

### Ana dosya: `src/components/core/QuranCompanionView.tsx` (~2800+ satır)
- 10 sekme: home, progress, exercises, teachers, appointments, peers, study, achievements, wheel, manage
- `load()` fonksiyonu (satır 450-635): 10 paralel Supabase çağrısı (Promise.all)
- Realtime abonelikleri (satır 329-444): chat_messages, peer_matches, appointments, study_room_members
- `SAMPLE_HOCA` sabiti (satır 104-116): Hardcoded placeholder hoca
- `sampleAppointments` (satır 117-164): Demo randevular
- Tab routing: `openAppView("quran-companion", tab)` → pushState
- URL parametresi: `?view=quran-companion&tab=X` → `useSearchParams().get("tab")`

### Alt bileşenler (tümü gerçek implementasyon):
- `QuranChat.tsx` (567 satır): Mesajlaşma, realtime, sayfalama, okundu bilgisi
- `AppointmentChat.tsx` (64 satır): QuranChat wrapper, `contextId={appointment.id}`
- `QuranStudyGroup.tsx` (408 satır): Oda CRUD, davet, grup sohbeti
- `QuranDashboard.tsx` (233 satır): Hero, stats, mini surah grid
- `QuranExercises.tsx` (727 satır): 6 alıştırma tipi, quiz engine
- `QuranProgressMap.tsx` (293 satır): 30 cüz, 114 sure grid
- `QuranStudyWorkspace.tsx` (362 satır): Hedefler, günlük ilerleme, haftalık sıralama
- `QuranAchievements.tsx` (86 satır): Rozet grid
- `QuranTeacherProfile.tsx` (92 satır): Hoca profili, yorumlar
- `QuranTeacherFeedback.tsx` (133 satır): Öğrenci yorum formu
- `useQuranPresence.ts` (166 satır): Supabase Presence, yazıyor göstergesi
- `quranSocial.ts` (90 satır): Tarih, mesaj birleştirme, okunmamış sayacı

### Veritabanı (uygulanmış, değiştirme):
- 031-036 migration'ları canlıda çalışıyor
- RLS aktif, SECURITY DEFINER fonksiyonlar mevcut
- Realtime publication: appointments, chat_messages, quran_peer_matches, quran_study_room_members

---

## GÖREVLER — Öncelik sırasıyla

Her görev için: dosya yolu, mevcut davranış, beklenen davranış ve kabul kriterleri yazılıdır. Bir görevi atlama; tamamlanamıyorsa nedeni açıkla.

---

### GÖREV 1: İlk yükleme performansı — skeleton süresini azalt

**Dosya:** `src/components/core/QuranCompanionView.tsx` satır 450-635

**Mevcut durum:** `load()` fonksiyonu 10 Supabase çağrısını tek `Promise.all` ile yapıyor. Tümü dönene kadar `CompanionSkeleton` gösteriliyor. Canlı sitede bu 5-8 saniye sürüyor.

**Beklenen:**
1. Çağrıları iki gruba ayır:
   - **Kritik** (ekranda hemen gösterilecek): `hoca_profiles`, `get_my_quran_appointments`, `quran_study_goals`, `quran_streaks`, `get_my_hasanat_total`
   - **Arka plan** (ilgili sekme açıldığında gerekli): `browse_quran_helpers`, `get_my_quran_peer_matches`, `quran_surah_progress`, `quran_exercise_results`, `quran_review_schedule`
2. Kritik grup dönünce `setLoading(false)` yap, dashboard hemen render olsun.
3. Arka plan grubunu ikinci `Promise.all` ile yükle; her biri gelince ilgili state'i güncelle.
4. Arka plan verisi yokken ilgili sekmeler kendi skeleton/spinner'larını göstersin.

**Kabul:**
- Dashboard (home) sekmesi 2 saniye içinde görünür (skeleton yerine gerçek içerik)
- Diğer sekmeler yüklenene kadar mini-skeleton gösterir, yüklendikten sonra içerik gösterir
- Tüm mevcut işlevsellik korunur

---

### GÖREV 2: URL tabanlı sekme yönlendirme güvenilirliği

**Dosyalar:**
- `src/lib/appLocation.ts` (satır 21-24)
- `src/components/core/SahApp.tsx` (satır 559)
- `src/components/core/QuranCompanionView.tsx` (satır 246-258)

**Mevcut durum:** `?view=quran-companion&tab=peers` gibi doğrudan URL'ler bazen SAH World'ün genel "İçerik hazırlanıyor..." skeleton'unu gösteriyor, QuranCompanionView yüklenmiyor. Sorun: tam sayfa yenilemesinde `SahApp` seviyesinde view routing ile `QuranCompanionView` içindeki `useSearchParams` arasındaki zamanlama.

**Beklenen:**
1. URL'de `view=quran-companion` varsa `SahApp`, `QuranCompanionView` bileşenini derhal mount etsin.
2. `QuranCompanionView` kendi `tab` parametresini `useSearchParams` ile alıp doğru sekmeye yönlendirsin.
3. Tam sayfa yenilemesinde (F5, paylaşılan link) doğru sekme 100% güvenilir açılsın.
4. `openAppView("quran-companion", "peers")` ile pushState yapıldığında back/forward butonları doğru çalışsın.

**Kabul:**
- `sah-world.vercel.app/?view=quran-companion&tab=peers` → doğrudan Kur'an Kardeşi sekmesi açılır
- `sah-world.vercel.app/?view=quran-companion&tab=manage` → yetkili kullanıcıda Hoca yönetimi açılır
- Tarayıcı geri butonu önceki sekmeye döner

---

### GÖREV 3: Placeholder hoca profilini temizle

**Dosya:** `src/components/core/QuranCompanionView.tsx` satır 104-164

**Mevcut durum:**
- `SAMPLE_HOCA` sabiti her zaman `teachers` listesine ekleniyor (satır 473: `setTeachers([SAMPLE_HOCA])` — misafir/pilot modda).
- Gerçek kullanıcı modunda veritabanındaki `hoca_profiles` tablosundan çekiliyor ama `is_placeholder: true` olan kayıt hâlâ veritabanında duruyor.
- Hoca listesinde "İmam Hatip Ramazan Hoca" gerçek hoca gibi görünüyor, fakat `user_id` null.

**Beklenen:**
1. Gerçek kullanıcı modunda: `is_placeholder === true` olan hocaları TeacherDiscovery listesinden **gizle** (veritabanından silme, sadece UI'da filtrele).
2. Misafir/pilot modunda: Placeholder hocayı açıkça "Örnek profil — gerçek hocalar yakında" etiketi ile göster.
3. TeacherDiscovery'deki mevcut `is_placeholder && <em>Örnek profil</em>` etiketini (satır 1209) koruyarak "Randevu al" butonunu placeholder için devre dışı bırak.

**Kabul:**
- Giriş yapmış kullanıcı placeholder hocayı görmez
- Misafir/pilot ziyaretçi placeholder hocayı görür ama randevu alamaz
- Placeholder hoca veritabanından silinmez

---

### GÖREV 4: Hoca fotoğrafı için dosya yükleme

**Dosya:** `src/components/core/QuranCompanionView.tsx` satır 2586-2589

**Mevcut durum:** Hoca profili düzenleme formunda fotoğraf alanı düz `<input name="photo">` text input'u. Kullanıcı URL yapıştırmak zorunda.

**Beklenen:**
1. `<input type="file" accept="image/*">` ile dosya seçimi ekle.
2. Seçilen dosyayı Supabase Storage'a yükle: bucket `hoca-photos`, yol `{hoca_id}/{timestamp}.{ext}`.
3. Yükleme tamamlanınca `photo_url`'i Storage public URL ile güncelle.
4. Yükleme sırasında progress göster.
5. Mevcut URL text alanını kaldırma — geri çekilme seçeneği olarak sakla (ama önce dosya yükleme göster).
6. Dosya boyutu limiti: 2 MB. Hata mesajı göster aşılırsa.
7. Yükleme sonrası avatar önizleme göster.

**Veritabanı:**
- Supabase Storage bucket `hoca-photos` oluşturulmalı (migration veya dashboard'dan).
- Bucket policy: authenticated kullanıcılar yükleme yapabilir, public okuma.
- Bu görevi **yalnızca arayüz ve yükleme kodunu yaz** — bucket oluşturmayı migration notu olarak belgele, çalıştırma.

**Kabul:**
- Hoca yönetiminde dosya seçince fotoğraf yüklenip profilde görünür
- 2 MB üstü dosya reddedilir
- Mevcut URL yöntemi de çalışmaya devam eder

---

### GÖREV 5: Akran eşleştirme (peers) — boş liste iyileştirmesi

**Dosyalar:**
- `src/components/core/QuranCompanionView.tsx` (PeerMatching bileşeni)
- `supabase/migrations/022_quran_companion.sql` satır 301-308 (`browse_quran_helpers`)

**Mevcut durum:**
- `browse_quran_helpers()` yalnızca `quran_level = 'helper'` olan kullanıcıları döndürüyor.
- Platform yeni olduğu için hiç `helper` seviyeli kullanıcı yok → liste her zaman boş.
- Boş liste sadece EmptyState gösteriyor, kullanıcıyı yönlendirmiyor.

**Beklenen:**
1. EmptyState mesajını iyileştir:
   - "Henüz eşleşme bulunmuyor" yerine: "Şu anda eşleşebilecek Kur'an kardeşi bulunmuyor. Seviyeni 'Yardımcı' olarak güncellersen, başkalarının seni bulmasını sağlarsın."
   - "Seviyemi güncelle" butonu → LevelOnboarding'i açsın veya profil seviye güncelleme modal'ı göstersin.
2. **Ayrı migration dosyasında** (037 numara) `browse_quran_helpers` fonksiyonunu genişlet:
   - `helper` dışında `fluent` seviyeli kullanıcıları da döndür (ama `beginner`/`alphabet` seviyeyi döndürme).
   - Sütun olarak `quran_level` zaten döndürülüyor — UI tarafında seviye etiketi göster.
3. Kullanıcının kendi seviyesini `helper` olarak güncelleyebileceği küçük bir kart ekle (PeerMatching içinde, listenin üstünde).

**Kabul:**
- Boş liste durumunda kullanıcı ne yapacağını biliyor
- `fluent` ve `helper` seviyeli kullanıcılar listede görünüyor
- Kullanıcı kendi seviyesini güncelleyebiliyor
- Migration dosyası `037_quran_peer_expansion.sql` olarak oluşturulur ama **uygulanmaz** — sadece kaynak kodda tutulur

---

### GÖREV 6: Mesaj düzenleme ve silme

**Dosya:** `src/components/quran/QuranChat.tsx` (satır 271-323)

**Mevcut durum:** `send()` fonksiyonu mesaj gönderir, ama düzenleme/silme yok. Yanlış gönderilmiş mesaj düzeltilemez.

**Beklenen:**
1. Kullanıcının kendi mesajlarında (sender_id === userId) uzun basma/sağ tık menüsü: "Düzenle" ve "Sil".
2. **Düzenle:** Mesaj balonunu inline edit moduna geçir. Kaydet → `update_quran_message` RPC çağır.
3. **Sil:** Onay dialogu → `delete_quran_message` RPC çağır. Mesaj yerine "Bu mesaj silindi" göster (soft-delete).
4. Düzenlenen mesajda "(düzenlendi)" etiketi göster.
5. Sadece 15 dakika içindeki mesajlar düzenlenebilir/silinebilir.

**Veritabanı (migration 037 veya 038):**
```sql
-- update_quran_message: sadece sender_id = auth.uid() ve created_at > now() - interval '15 minutes'
-- delete_quran_message: soft-delete → deleted_at sütunu ekle, mesaj içeriğini '[silindi]' yap
-- RLS: sadece kendi mesajını düzenle/sil
```

**Kabul:**
- Kendi mesajını 15 dk içinde düzenleyebilir
- Kendi mesajını 15 dk içinde silebilir (soft-delete)
- Başkasının mesajında menü yok
- 15 dk sonra menü görünmez
- Migration dosyası oluşturulur ama **uygulanmaz**

---

### GÖREV 7: Seviye onboarding kalıcılık kontrolü

**Dosya:** `src/components/core/QuranCompanionView.tsx` satır 697-714 ve satır 977-989

**Mevcut durum:**
- `saveLevel()` profil tablosuna `quran_level` yazıyor.
- Ama home sekmesi her yüklemede `profile?.quran_level` kontrolü yapıyor. Eğer profil henüz yüklenmediyse veya cache uyumsuzsa onboarding tekrar gösteriliyor olabilir.
- Dashboard'un görünme koşulu: `tab === "home" && !loading` (satır 977). LevelOnboarding koşulu: `!profile?.quran_level`.

**Beklenen:**
1. `saveLevel()` çağrıldıktan sonra `patchProfile({ quran_level: level })` zaten yapılıyor — `useAuthStore`'daki profilin güncellendiğinden emin ol.
2. Eğer `useAuthStore.profile` sayfa yenilemesinde null başlıyorsa ve Supabase oturumu dönene kadar sıfır ise, LevelOnboarding'i `loading` durumunda gösterme.
3. Koşulu `!loading && isRealUser && !profile?.quran_level` olarak daralt.
4. Misafirde zaten gösterilmiyor — emin ol.

**Kabul:**
- Seviye seçtikten sonra sayfa yenilemesinde onboarding TEKRAR görünmez
- İlk kez gelen gerçek kullanıcı onboarding'i bir kez görür
- Misafir onboarding görmez (seviye Zustand'da)
- Yükleme sırasında onboarding flash etmez

---

### GÖREV 8: Unread mesaj badge'i ana kenar çubuğunda (sidebar)

**Dosyalar:**
- `src/components/core/SahApp.tsx` (satır 71: sidebar item tanımları)
- `src/components/core/QuranCompanionView.tsx` (thread sayısı zaten mevcut)

**Mevcut durum:** Kur'an Kardeşim sekmelerinde (appointments, peers) okunmamış mesaj badge'leri doğru çalışıyor. Ama SAH World ana kenar çubuğundaki "Kur'an'ı Kerim Kardeşim" menü öğesinde badge yok — kullanıcı mesaj geldiğini fark etmiyor.

**Beklenen:**
1. `SahApp` sidebar'da "Kur'an'ı Kerim Kardeşim" satırına unread badge ekle.
2. Badge değeri: `quranUnreadCounts(threads)` toplamını hesapla (fonksiyon `quranSocial.ts`'de zaten var).
3. Badge yalnızca giriş yapmış kullanıcıda görünsün.
4. Thread'leri sidebar seviyesinde yüklemek için: `SahApp`'ta hafif bir `useEffect` ile `get_quran_thread_summaries` RPC'sini çağır ve toplam unread sayısını hesapla.
5. Realtime ile güncelle (mevcut `chat_messages` aboneliğine benzer şekilde).

**Kabul:**
- Yeni mesaj gelince sidebar'daki badge artar
- Mesaj okunduğunda badge azalır
- 0 iken badge gizlenir
- Misafirde badge görünmez

---

### GÖREV 9: Hoca profilinde iCalendar indirme doğrulaması

**Dosya:** Hoca profili/randevu detay kartında iCal indirme linki

**Mevcut durum:** `quran-readiness.md` iCalendar indirmesinden bahsediyor ama canlı sitede test edilmedi. Mevcut implementasyonun doğru çalıştığını doğrula.

**Beklenen:**
1. iCal dosyasının doğru formatını kontrol et: `BEGIN:VCALENDAR`, `VTIMEZONE` (Europe/Istanbul), `VEVENT`, `DTSTART`/`DTEND`, `SUMMARY`.
2. `topic_notes` içinde özel ders notu varsa iCal'e **eklenmediğinden** emin ol (gizlilik).
3. Dosya adı: `kuran-randevu-{tarih}.ics`.
4. Google Calendar ve Apple Calendar'da import test senaryosu belge.

**Kabul:**
- İndirilen .ics dosyası Google Calendar'a import edilebilir
- Özel ders notu .ics içinde yok
- Saat dilimi Europe/Istanbul

---

### GÖREV 10: Randevu yeniden planlama UX iyileştirmesi

**Dosya:** AppointmentsView bileşeni içindeki reschedule akışı

**Mevcut durum:** Backend `reschedule_hoca_appointment` RPC mevcut (migration 034). Arayüzde yeniden planlama butonu var ama akış testi ve UX doğrulaması yapılmadı.

**Beklenen:**
1. Yeniden planlama akışını incele ve doğru çalıştığını doğrula.
2. Yeniden planlama sırasında:
   - Müsait slotları göster (BookingFlow benzeri)
   - Eski tarih/saati açıkça göster
   - "Yeni tarih seç" adımı
   - Onay adımı: "Eski: X → Yeni: Y"
   - Başarılı → flash mesajı + listeyi yenile
3. Dolu saatte yeniden planlama denenirse eski randevu korunsun (backend zaten bunu yapıyor — UI'da hata mesajı göster).
4. İptal edilen/geçmiş randevularda yeniden planlama butonu görünmesin.

**Kabul:**
- Onaylanmış randevu yeniden planlanabilir
- Yeni slot seçimi BookingFlow ile tutarlı UI
- Dolu saat → hata mesajı, eski randevu korunur
- İptal/geçmiş randevuda buton yok

---

### GÖREV 11: Haftalık sıralama opt-in akışı doğrulaması

**Dosya:** `src/components/quran/QuranStudyWorkspace.tsx`

**Mevcut durum:** Haftalık sıralama varsayılan kapalı. Kullanıcı opt-in yapabilmeli. Anonim ad ile katılım.

**Beklenen:**
1. Opt-in/opt-out toggle'ının doğru çalıştığını doğrula.
2. Opt-in durumunda: kullanıcının gerçek adı yerine rastgele anonim ad gösterildiğini doğrula.
3. Opt-out durumunda: kullanıcı sıralamada görünmesin.
4. Sıralama verisi her hafta sıfırlansın.
5. Kendi sırandaki satır vurgulanmış olsun.

**Kabul:**
- Toggle açılınca sıralamada anonim ad ile görünür
- Toggle kapatılınca sıralamadan çıkar
- Gerçek ad/email hiçbir yerde gösterilmez
- Kendi satırı farklı arka plan ile vurgulanır

---

### GÖREV 12: Hoca yorum yayımlama akışı doğrulaması

**Dosyalar:**
- `src/components/quran/QuranTeacherFeedback.tsx` (133 satır)
- `src/components/quran/QuranTeacherProfile.tsx` (92 satır)

**Mevcut durum:** Öğrenci tamamlanan dersinden sonra yorum yazabilir. Yorum `is_public: true` ile yayımlanır, tekrar kaydetme ile geri çekilir.

**Beklenen:**
1. Yalnızca tamamlanmış (`status: 'completed'`) dersten sonra yorum yazılabildiğini doğrula.
2. Yorum formu: yıldız (1-5) + metin.
3. `is_public` toggle: açık → hoca profilinde görünür; kapalı → sadece kayıt.
4. Daha önce yazılmış yorum varsa düzenleme modu.
5. Hoca profil sayfasında sadece `is_public: true` yorumlar görünsün.
6. Hoca kendi yorumlarını göremesin (gizlilik).

**Kabul:**
- Tamamlanmamış derste yorum butonu yok
- Yayımlanan yorum hoca profilinde görünür
- Geri çekilen yorum profilden kaybolur
- Hoca kendine yazılmış yorumları görmez

---

### GÖREV 13: Çalışma odası (study room) UX iyileştirmesi

**Dosya:** `src/components/quran/QuranStudyGroup.tsx` (408 satır)

**Mevcut durum:** Oda oluşturma, davet, kabul/red, ayrılma, grup sohbeti çalışıyor. Ama:
- Oda listesi boşken kullanıcıyı yönlendirmiyor
- Oda detay görünümü sade
- Sure/ayet hedefi oda kartında görünmüyor

**Beklenen:**
1. Boş liste durumunda: "Henüz bir çalışma odanız yok. Kur'an kardeşlerinizle birlikte çalışmak için oda oluşturun." mesajı + "Oda oluştur" CTA butonu.
2. Oda kartlarında:
   - Oda adı, sure hedefi, ayet aralığı
   - Üye sayısı / maksimum kapasite (2-5)
   - Planlanan çalışma zamanı (varsa)
   - Son mesaj önizlemesi
   - Okunmamış mesaj badge'i
3. Aktif oda kartına tıklayınca sohbet açılsın.
4. Davet bekleyen kullanıcıya ayrı "Bekleyen davetler" bölümü göster.

**Kabul:**
- Boş durumda yönlendirici mesaj ve buton var
- Oda kartları bilgilendirici
- Sohbet doğru açılıyor
- Davet bölümü ayrı ve belirgin

---

### GÖREV 14: Tarayıcı bildirimi izin akışı

**Dosya:** `src/components/core/QuranCompanionView.tsx` satır 716-730

**Mevcut durum:** `enableReminders()` `Notification.requestPermission()` çağırıyor. Ama:
- İzin zaten verilmişse tekrar soruyor
- İzin reddedilmişse kullanıcıya ne yapacağını söylemiyor
- İzin durumu hiçbir yerde gösterilmiyor

**Beklenen:**
1. İzin durumunu kontrol et: `Notification.permission === 'granted'` → "Bildirimler açık" göster.
2. `'denied'` → "Bildirimler engellendi. Tarayıcı ayarlarından açabilirsin." mesajı.
3. `'default'` → İzin iste butonu göster.
4. İzin verildikten sonra test bildirimi gönder: "Bildirimlerin açıldı. Randevuların yaklaştığında seni uyaracağız."
5. Randevu sekmesinde izin durumu küçük ikonla gösterilsin (yeşil çan = açık, gri çan = kapalı).

**Kabul:**
- Zaten izinli kullanıcıya tekrar izin sorulmaz
- Engellenen kullanıcıya yönlendirme mesajı gösterilir
- Test bildirimi başarıyla gönderilir
- İzin durumu görsel olarak belli

---

### GÖREV 15: Koyu tema (dark mode) tutarlılık kontrolü

**Dosya:** CSS dosyaları + `[data-theme="dark"]` selector

**Mevcut durum:** Temel koyu tema desteği var ama bazı bileşenlerde kontrast yetersiz olabilir. `quran-readiness.md`'de 4.5:1 minimum kontrast kuralı belirtilmiş.

**Beklenen:**
1. Tüm `.qc-` prefix'li CSS sınıflarında koyu tema değişkenlerini kontrol et.
2. Özellikle bu alanları doğrula:
   - Hoca kartları (`.hoca-card`)
   - Sohbet balonları (mesaj gönderen/alıcı renkleri)
   - Rozet kartları
   - Alıştırma sonuç ekranı
   - Boş durum (EmptyState) arka planı
   - Form inputları (availability, time-off)
   - Admin rol kartı (`.admin-role-card`)
3. Minimum kontrast 4.5:1 olsun (WCAG AA).
4. Koyu temada `cream` (#fbf9f6) arka plan kullanılmasın — koyu alternatifini kullan.

**Kabul:**
- Tüm metin 4.5:1 kontrast oranını karşılar
- Koyu temada beyaz/cream arka plan patlaması yok
- Tüm butonlar koyu temada okunabilir
- `prefers-color-scheme: dark` medya sorgusu ile tutarlı

---

### GÖREV 16: Mobil düzen iyileştirmesi

**Dosya:** CSS dosyaları + bileşen yapıları

**Mevcut durum:** Temel mobil destek var ama bazı alanlarda taşma, kesme veya erişilebilirlik sorunları olabilir.

**Beklenen:**
1. Bu alanları 375px genişlikte test et:
   - Sekme çubuğu (`.quran-companion-tabs`): yatay scroll ile tüm sekmeler erişilebilir olsun
   - Hoca kartları (`.hoca-grid`): tek sütun, fotoğraf/bilgi/butonlar dikey sıralı
   - Sohbet penceresi: tam genişlik, alt menünün üstünde
   - Alıştırma kartları: şıklar taşmasın
   - Haftalık müsaitlik grid'i (`.qc-week-grid`): mobilde yatay scroll veya accordion
   - Admin kullanıcı arama sonuçları: metin kesme yok
2. Touch hedefleri minimum 44x44px olsun (WCAG).
3. Sekme çubuğunda aktif sekme görünür olsun (scroll-into-view).

**Kabul:**
- 375px'de tüm içerik okunabilir ve erişilebilir
- Yatay taşma yok
- Touch hedefleri yeterli boyutta
- Aktif sekme görünür alanda

---

### GÖREV 17: Erişilebilirlik (a11y) denetimi

**Dosyalar:** Tüm QuranCompanion bileşenleri

**Mevcut durum:** Temel aria-label'lar mevcut (tabs, modals). Ama kapsamlı a11y denetimi yapılmadı.

**Beklenen:**
1. Tab navigasyonu: `role="tablist"` + `role="tab"` + `role="tabpanel"` + `aria-selected` doğru mu kontrol et. Mevcut `aria-pressed` varsa `role="tab"` ile uyumlu `aria-selected`'a çevir.
2. Modal/dialog: QuranModal'ın `role="dialog"` + `aria-modal="true"` + focus trap'i doğru mu kontrol et.
3. Form etiketleri: Tüm inputlarda `<label>` veya `aria-label` var mı.
4. Hata mesajları: `role="alert"` kullanılıyor mu (zaten bazılarında var, tümünü kontrol et).
5. Renk bağımsız bilgi: Yalnızca renkle ayırt edilen bilgi yok — ikon veya metin de olsun.
6. Ekran okuyucu ile anlamlı sıralama: heading hiyerarşisi (h1 > h2 > h3) doğru mu.

**Kabul:**
- axe-core veya Lighthouse a11y testi 90+ puan
- Tab sırası mantıklı
- Tüm etkileşimli öğeler klavye ile erişilebilir
- Heading hiyerarşisi doğru

---

### GÖREV 18: Test kapsamı genişletme

**Dosyalar:**
- `tests/` dizini altında yeni test dosyaları

**Mevcut durum:** 52 birim testi + 14 sosyal fixture testi + 18 readiness testi geçiyor. Ama yeni eklenen özellikler (mesaj düzenleme, fotoğraf yükleme, genişletilmiş peer listesi) için test yok.

**Beklenen:**
1. Her yeni RPC/migration için PGlite testi ekle (`scripts/test-quran-social-database.cjs` dosyasını genişlet).
2. Her yeni UI özelliği için Playwright e2e testi ekle.
3. Mevcut testlerin kırılmadığını doğrula: `npm run test:unit`, Playwright testleri.

**Kabul:**
- Yeni özellikler için en az 1 birim + 1 e2e test
- Mevcut 52 + 14 + 18 test hâlâ geçiyor
- `npm run build` ve `npx tsc --noEmit` hatasız

---

## Yapılmaması gerekenler (sonraki faz — bu prompt'un DIŞINDA)

Bu maddeler bu görev setinin kapsamı DIŞINDADIR. Codex bunlara dokunmasın:

- Dosya/ses/resim yükleme (chat attachments)
- Görüntülü/sesli görüşme entegrasyonu
- Yönetici analiz dashboard'u
- Push notification (service worker + FCM)
- Yapay zekâ okuma değerlendirmesi
- SSR/ISR optimizasyonu
- Mevcut migration dosyalarını değiştirme (031-036)
- Veritabanına doğrudan bağlanma veya migration uygulama
- `.env` dosyasını okuma veya değiştirme

---

## Teslim kontrol listesi

Her görev tamamlandığında:

1. `npm run build` → hatasız
2. `npx tsc --noEmit` → hatasız
3. ESLint → değişen dosyalarda 0 hata, 0 uyarı
4. Mevcut testler → tümü geçiyor
5. Yeni migration dosyaları `supabase/migrations/` altında, **uygulanmamış** — kaynak kodda tutulur
6. Her değişiklik ayrı commit, anlamlı commit mesajı
7. PR açıldığında tüm değişiklikler tek `feature/quran-polish` dalında

---

## Sıralama önerisi

1. GÖREV 1 (performans) + GÖREV 2 (URL routing) — temel UX
2. GÖREV 3 (placeholder) + GÖREV 7 (onboarding) — veri tutarlılığı
3. GÖREV 5 (peers genişletme) + GÖREV 6 (mesaj düzenleme) — sosyal
4. GÖREV 4 (fotoğraf yükleme) + GÖREV 8 (sidebar badge) — UX
5. GÖREV 9-12 (doğrulama görevleri) — kalite güvence
6. GÖREV 13-14 (çalışma odası + bildirim) — UX
7. GÖREV 15-17 (tema + mobil + a11y) — erişilebilirlik
8. GÖREV 18 (testler) — en son, tüm değişiklikler bitince
