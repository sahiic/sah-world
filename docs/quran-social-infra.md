# Kur’an sosyal altyapısı — yayın durumu

8 Ekim 2026. Dal: `feature/quran-social-infra`. Bu değişiklik, `feature/quran-readiness` / PR #64 üzerine kuruludur. PR #64 ana dala birleştirildi; sosyal arayüz yayını [PR #65](https://github.com/sahiic/sah-world/pull/65) üzerinden takip edilir. Canlı veritabanı kurulumu tamamlandı; önizleme yayını tek başına ana alan adının güncellendiğinin kanıtı değildir.

## Uygulanan öncelikli fazlar

- Her ders ve kabul edilmiş kardeşlik eşleşmesi için ayrı sohbet; eski bağlamsız mesajlar ayrı, salt okunur arşivde korunur.
- Görünen konuşmanın alınan mesajlarına sınırlandırılmış okundu bilgisi, gönderildi/okundu tikleri, sekme ve konuşma rozetleri. Genel topluluk gelen kutusu ders mesajlarını karıştırmaz.
- Eşleşme istekleri ve randevu durumları için gerçek zamanlı güncelleme; bağlantı dönüşünde ve görünür sekmede periyodik yenileme. Tarayıcı bildirimi yalnızca önceden verilmiş izinle kullanılır.
- 400 karakterlik eşleşme isteği formu; kabul edilen isteği tekrar göndermek mevcut ilişkiyi sıfırlamaz.
- İsteğe bağlı, ilişkiye özel ve yetkilendirilmiş çevrimiçi/yazıyor göstergesi. Veri yokken çevrimiçi olunduğu veya kesin çevrimdışı olunduğu iddia edilmez.
- Karşılıklı özel ders notları; önceki kayıt okunamadığında üzerine kaydetme engeli.
- Öğrenciye özel, tek işlem içinde yeniden planlama. Yeni saat alınamazsa eski randevu geçerli kalır; eski mesaj ve notlar taşınmaz/silinmez. Mevcut iki saatlik iptal penceresi korunur.
- İstanbul saatli haftalık takvim ve özel ders notlarını içermeyen iCalendar indirmesi.
- Kabul edilmiş eşleşmelere davet gönderilen 2–5 kişilik çalışma odaları, sure/ayet hedefi ve isteğe bağlı çalışma zamanı. Davet kabul edilmeden grup sohbetine erişilmez.
- Ortak mobil/koyu tema sohbet yüzeyi; tarih ayırıcıları, çok satırlı giriş, başarısız gönderimde korunmuş metin, eski mesajlarda kalırken zorla aşağı kaydırmama, grup mesajlarında gönderen adı.

Gerçek veri bulunmayan “son görülme” süresi veya birlikte çalışılan gün sayısı üretilmez. Dosyadaki 18 maddelik genel denetim listesinin mesaj düzenleme/silme, dosya/ses yükleme, görüntülü/sesli görüşme, hoca fotoğraf yükleme ve yönetici analizleri bu öncelikli dört fazın dışında kalan sonraki işlerdir.

## Veritabanı ve gizlilik

`034_quran_social_threads.sql` sohbet bağlamlarını, kontrollü gönderme/okuma RPC’lerini, özel Presence politikalarını ve atomik yeniden planlamayı ekler. Alıcı, okundu bilgisi dışında içerik, kimlik, zaman veya yönlendirmeyi değiştiremez. Önceki genel arkadaş listesi RPC’si başka kullanıcı kimliğiyle çağrılamaz.

`035_quran_study_rooms.sql` RLS korumalı oda/davet tablolarını ekler. Odanın `group_id` alanı mevcut `groups` tablosuna bağlanır. Oda kimliği yanlışlıkla grup yabancı anahtarı olarak kullanılmaz. Mevcut grup koduyla katılım yolu da oda davetini atlayamaz. Ayrılma, grup üyeliğini ve oda görünürlüğünü birlikte günceller. Mevcut genel grup silme işlemi oda kayıtlarını silmez; ilişkili oda varsa yabancı anahtar koruması silmeyi reddeder.

Presence paketleri yalnızca arayüz ipucudur; yetki kaynağı değildir. Özel kanal politikaları bağlantı/kimlik yenilemesi sırasında değerlendirilir. Canlı doğrulama sırasında ilişki iptali ve yeniden bağlanma ayrıca denenmelidir. Kaynaklar: [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization), [Supabase Presence](https://supabase.com/docs/guides/realtime/presence).

`036_quran_lesson_note_integrity.sql` özel not erişimini gerçek ders katılımcılarıyla sınırlar; yönetici unvanı tek başına not okuma hakkı vermez. Notun ders, yazar ve rol bilgileri sonradan değiştirilemez; yalnızca tamamlanan dersin gerçek öğrencisi/hocası kendi notunu yazabilir.

## Doğrulama

- `npm run build`: başarılı.
- `npx tsc --noEmit`: başarılı; değişen TypeScript dosyalarında ESLint başarılı.
- `npm run test:unit`: 52/52 başarılı.
- `npx playwright test --config=playwright.social.config.ts`: masaüstü ve mobilde 14/14 başarılı. İzole yerel HTTP/WebSocket fixture kullanır; gerçek kullanıcı veya canlı veriye yazmaz.
- Mevcut Kur’an readiness/pilot tarayıcı senaryoları: 18/18 başarılı.
- `node scripts/test-quran-social-database.cjs`: gerçek SQL/RLS işlemleriyle izole PGlite üzerinde başarılı. 031–033 tabanı üzerinde 034–036 iki kez uygulanır. Konuşma ayrımı, yetkisiz/alakasız hesap erişimi, içerik değişmezliği, sınırlı okundu bilgisi, özel Presence yetkisi, dolu saatte geri alma, oda daveti/kod atlatma ve karşılıklı not gizliliği kontrol edilir. Yönetici rolüyle özel notları okuma, hoca rolü taklidi ve notu başka derse yönlendirme de reddedilir.
- PGlite testi canlı Realtime sunucusu, üretim bağlantısı, üretim eşzamanlı yükü veya kriptografik grup kodu üretiminin testi değildir. Publication adımları yalnızca bu test ortamında atlanır.
- Ekran kanıtları yalnızca kurgu hesaplar içerir: `validation/quran-social/desktop-dark.png`, `validation/quran-social/mobile-dark.png`.
- CI, genel misafir UI testlerinden ayrı sosyal fixture testini ve iki izole veritabanı betiğini çalıştıracak şekilde güncellendi.

## Canlı veritabanı doğrulaması — 8 Ekim 2026

Kullanıcının açtığı yetkili Supabase oturumunda 030–036 tek transaction içinde sıralı uygulandı ve migration geçmişine kaydedildi. Test edilmiş kaynak commit: `784ebce336166592b49c767483eba3b226f4ddec`. İşlem başarılı tamamlandı; 12 mesaj ve 5 randevu korundu. 198 cevap anahtarı yüklendi. Onaylanan hesabın `admin` rolü ve aktif, gerçek `Baş Muallim` profili doğrulandı. Panelde otomatik yedek bulunmadığı görüldü; yedek varmış gibi kabul edilmedi. Kullanıcı kayıtları silinmedi veya test verisiyle değiştirilmedi.

Canlı katalog kontrolleri: 11 yeni tabloda RLS açık; cevap anahtarlarını anonim/oturumlu istemci okuyamıyor; sonuç/puan/seri tablolarına doğrudan yazma kapalı; anonim sosyal RPC çalıştırma kapalı; iki özel Presence politikası var; not kimliğini koruyan trigger etkin; not SELECT politikası gerçek katılımcı kontrolü kullanıyor. `appointments`, `chat_messages`, `quran_peer_matches`, `quran_study_room_members` Realtime publication içinde.

İki ayrı gerçek hesapla canlı mesaj/okundu/Presence ve oda daveti uçtan uca testi yapılmış kabul edilmez. Bu akışların izole otomatik testleri başarılıdır; canlı katalog kontrolü gerçek iki hesap testi yerine geçmez. Eğitim içeriğinin ehil öğretici son incelemesi de ayrı bir süreçtir.

## Yayın ve tekrar kurulum notları

1. Canlıda 030–036 uygulandı; tekrar çalıştırmadan migration geçmişini kontrol et. Yeni ortamda eksik migration’ları sırasıyla uygula: 030, 031, 032, 033, 034, 035, 036. 031’i 032’den sonra tek başına tekrar çalıştırma; 032 puan/yazma yetkilerini daraltır. Dosyalar `supabase/migrations/` altındadır. Gerçek kullanıcı verileriyle seed/test çalıştırma.
2. Yeni tablo/RPC şema önbelleğini, public tablolar için Realtime publication üyeliğini ve özel Presence RLS politikalarını doğrula. Açık eski istemcilerin yenilenmesiyle yeni sunucu tarafı alıştırma kayıt yoluna geçilmelidir.
3. PR #64 ve ona bağlı sosyal değişiklikleri test edilmiş sırayla birleştir; doğrudan `main` push yapma. Otomatik Vercel üretim yayınının doğru commit’te hazır olduğunu ve ana alan adını doğrula.
4. Gerçek öğrenci ve hoca hesaplarında iki ayrı dersin mesajlarının ayrıldığını, yalnızca açılan konuşmanın rozetinin azaldığını, opt-in yazıyor göstergesini, karşılıklı notları, dolu saatte eski rezervasyonun korunmasını ve davetsiz kişinin odaya giremediğini doğrula.
5. Sorunda verileri silme. Şema değişikliklerini ileriye dönük düzelt; önceki istemciye dönüşün 032 sonrası doğrudan puan yazma davranışıyla uyumlu olmadığını dikkate al.

İzole SQL testini başka bilgisayarda çalıştırmak için `@electric-sql/pglite@0.5.8` ayrı bir test klasörüne kurulmalı; `QURAN_PGLITE_ROOT` bu klasörü göstermelidir. Bu değişken veritabanı şifresi veya canlı bağlantı adresi değildir.
