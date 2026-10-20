# SAHİ — UI/UX denetimi

Tarih: 19 Ekim 2026 · Dal: `codex/ui-ux-audit`

## Kapsam ve doğrulama sınırı

Bu çalışma mevcut arayüzü ve veri hesaplarını koruyan bir iyileştirme turudur. Canlı veritabanına yazılmadı, kullanıcı kaydı silinmedi, gizli yapılandırma değiştirilmedi. Son talimat gereği PR açılmadı ve production deploy yapılmadı.

- Yerel Next.js geliştirme sunucusunda mevcut **DEV misafir görünümü** kullanıldı. Kimlik/REST istekleri testte izole edildi. Bu, gerçek oturum, RLS veya canlı eşleşme doğrulaması değildir.
- 20 görünüm × 2 genişlik (375/1440px) × 2 tema: **80 ekran durumu**. İki genişlikte giriş ekranı da görüntülendi. Alt sekmeler: günlük geçmiş/matris/şükür/dersler; Kur’an oku/çalış/topluluk ve eski peers/teachers bağlantıları; kişisel/cami topluluğu.
- Tarama; görünümün yüklenmesini, yatay taşmayı, etiketsiz kontrolleri, küçük metin/hedefleri ve tarayıcı hatalarını kaydeder. Ekran görüntüleri ayrıca incelendi. `scripts/audit-ui.cjs` ile tekrarlanabilir.
- Kur’an `peers` ve `teachers` bağlantıları aynı Topluluk üst görünümüne gider; bunlar farklı canlı eşleşme senaryoları sayılmadı.
- `growth` mevcut router'da Dashboard'u gösterir; **3D köy testi yerine geçmez**. `/kesif` doğrudan açılış oturum kapısı test edildi; gerçek GPU/cihaz performansı ayrıca doğrulanmalıdır.
- Bütün alt bileşenlerin tüm olası durumları veya bütün kaynak dosyalarının satır satır denetimi tamamlandı iddiası yoktur. Özellikle yönetici ekranları, iki hesaplı sohbet/eşleşme, gerçek bildirim izinleri ve dosya yükleme/sunucu hataları bu raporda ayrı sınır olarak belirtilmiştir.
- İlerleme, XH, seri ve topluluk sayıları değiştirilmedi. Sahte sosyal kanıt veya yapay %20/%90 ilerleme eklenmedi. Manevî değer ile uygulama katılımı birbirine karıştırılmadı.

## Ortak kabuk — SahApp / kalite stilleri

### Masaüstü (1440px)
- BUG: Koyu temada hesap düğmesi beyaz kalıyordu → FIX: Yüzey, yazı ve kenarlık tema tokenlarına bağlandı.
- BUG: Hesap menüsündeki farkındalık özeti koyu temada beyaz/pembe kalıyor, 8px metinler okunmuyordu → FIX: İki özet kartı için 14px başlık/12px metaveri ve tema yüzeyi; çıkış aksiyonu için açık uyarı rengi.
- IMPROVE: Bazı ortak başlıklar sabit koyu mürekkep kullanıyordu → DONE: `--core-heading` ve kalıtılan metin rengi tema mürekkebine bağlandı.

### Mobil (375px)
- BUG: “Gününü Yaz” düğmesi boş görünüyordu; `span` gizleme kuralı ikonu da gizliyordu → FIX: İkon görünür tutuldu, hedef en az 44×44px.
- IMPROVE: Kaynak bağlantıları ve ikincil aksiyonlar küçük kalıyordu → DONE: Seçili kaynak/gezinti/kopyalama kontrollerinde 44px hedef.

### Dark Mode
- DONE: Eski alan stilleri için semantik renk alias'ları ve eksik spacing tokenları eklendi. Tüm CSS'in token dönüşümü yapıldı iddiası yoktur.

### Etkileşim
- BUG: Ayarlar lazy import'u kendi Suspense sınırı olmadan sayfayı askıya alıyor, auth bridge yeniden kuruluyordu; misafir oturumu kapanıyordu → FIX: Ayarlar için yerel yükleme sınırı ve skeleton. Auth güvenlik mantığı değiştirilmedi.
- BUG: Harici avatar sağlayıcısı erişilemediğinde kırık görsel kalıyordu → FIX: Boyutları koruyan yerel SVG yedeği; yeni kaynak seçildiğinde yeniden denenir.
- DONE: Ayarlar kapandığında odak hesap düğmesine döner.
- Önceki çalışma: skip-to-content, görünür odak halkası ve sidebar ok tuşları korundu.

### Psikoloji/UX
- Kişisel ilerleme gerçek veriye dayanır. İstenmeyen çıkış ya da yanıltıcı başarı bildirimi azaltıldı.

## Âlem — DashboardView / GrowthScene

### Masaüstü (1440px)
- IMPROVE: Büyüme alanı, kart açıklamaları ve haftalık özetin küçük metinleri → DONE: Gövde/metaveri ayrımı, daha okunur açıklamalar ve aksiyonlar.

### Mobil (375px)
- DONE: Grid taşması tarandı; ana akış tek sütunda kalır. Büyük sayılar ve başlıklar korundu.

### Dark Mode
- DONE: Ortak mürekkep/yüzey düzeltmesinden yararlanır; büyüme sahnesinin kendi renk dili korundu.

### Etkileşim
- Mevcut büyüme bağlantıları ve günlük CTA akışı korunur. Gerçek büyüme/veri hesapları değiştirilmedi.

### Psikoloji/UX
- Başlangıç durumu “tek küçük adım” önerir; yapay ilerleme eklenmedi.

## Gelişim Raporlarım — ReportsHero / WeeklySummarySection / ReportsDetailTabs

### Masaüstü (1440px)
- BUG: Tüm zamanların kategori dağılımı haftalık veri gibi algılanabiliyordu → FIX: Dönem açıkça “Tüm zamanlar” olarak etiketlendi.
- IMPROVE: Kullanıcıya yönelik olmayan “Katman 02/03” etiketleri → DONE: Anlamlı bölüm etiketleri.

### Mobil (375px)
- DONE: Gövde 14px, metaveri 12px; CTA açıklaması kesilmez; haftalık kart aralığı 24px; ayrıntılar varsayılan kapalı kalır.

### Dark Mode
- BUG: Bölüm başlıkları arka planda kayboluyordu → FIX: Açık mürekkep ve tema yüzeyleri. Başlıklar için 4.5:1 kontrast regresyon testi eklendi.

### Etkileşim
- BUG: Yedi günün değerleri tek `img` rolünün altında gizleniyordu → FIX: Tarih ve kayıt adediyle adlandırılmış yedi liste öğesi.
- Mevcut ayrıntı panelleri ve veri hesapları korunur.

### Psikoloji/UX
- Açıklamalarda yarış yerine kişisel ritim vurgusu; ölçümler olduğundan farklı gösterilmez.

## Günlük — JournalHubView / JournalNotebook / JournalHistory / SectionView

### Masaüstü (1440px)
- IMPROVE: Öncelik matrisi giriş ve ekleme düğmeleri etiketsizdi → DONE: Her alan için açıklayıcı erişilebilir ad.

### Mobil (375px)
- IMPROVE: Tarih inputunun kendisi yaklaşık 21px yüksekliğindeydi → DONE: 44px dokunma alanı; başlık açıklaması 14px.
- Yazı alanının ekranda kalması, detay alanları ve klavye küçültülmüş viewport senaryoları mevcut testlerle kontrol edilir.

### Dark Mode
- Mevcut defter renk sistemi korundu; açık/koyu tarama yapıldı.

### Etkileşim
- Geçmiş araması/tarih filtresi, yanlış tarih aralığı açıklaması, araç menüsü ve taslak koruma regresyon kapsamındadır.
- Otomatik taslak ve bulut kaydı birbirinden ayrı anlatılmaya devam eder.

### Psikoloji/UX
- Yazmaya başlamayı kolaylaştıran tek cümle yaklaşımı korunur; kullanıcının yerine otomatik metin yazılmaz.

## Kur’an Kardeşim — Oku / Çalış / Topluluk

### Masaüstü (1440px)
- BUG: Hoca biyografileri 8px, uzmanlık etiketleri 7px olabiliyordu → FIX: Biyografi 14px, ad 20px, etiketler 12px; ayrı aksiyon satırı.

### Mobil (375px)
- DONE: Hoca kartının bio/etiket/aksiyonları tam satıra yerleştirildi. Sure hücreleri ve form kontrollerinin okunabilirliği artırıldı.
- Hoca aksiyonları en az 44px, yatay taşma regresyon testinde kontrol edilir.

### Dark Mode
- DONE: Hoca kartları tema yüzeyleri ve okunur metin rengi kullanır.

### Etkileşim
- Örnek hocalar örnek olarak etiketli kalır; randevu düğmesi aktif gerçek hoca varmış gibi gösterilmez.
- Okuma, alıştırma ve not editörü mevcut regresyon testleri çalıştırılır.
- SINIR: Gerçek iki hesapla eşleşme, realtime mesajlaşma, randevu ve HocaManagement yetki akışları bu misafir turunda doğrulanmadı.

### Psikoloji/UX
- Hasanat/okuma beyanının dinî değer veya sesli yeterlilik ölçümü olmadığı açıklaması korunur.

## Mekânlar — MescidimView / PrayerTimes / MescidimLibrary / MosqueEventArchive

### Masaüstü (1440px)
- IMPROVE: Kütüphane açıklamaları ve kaynak bağlantıları çok küçük → DONE: 14px gövde, 12px metaveri ve daha rahat kaynak aksiyonları.

### Mobil (375px)
- DONE: Kapsam sekmeleri 48px; arama, favori, filtre ve tekrar deneme kontrolleri büyütüldü. Kişisel alan ve etkinlik arşivi tarandı.

### Dark Mode
- DONE: Esma/dua kartları, arama ve açıklamalar ortak tema yüzeyine uyumlu.

### Etkileşim
- BUG: Esma penceresinde kayıt sonucu pencerenin arkasında kalıyordu → FIX: Durum mesajı pencere içinde duyurulur.
- BUG: Kaydetme çağrısı hatası dikkate alınmıyordu → FIX: Yerel kayıt ile sunucu onayı ayrı; ağ hatasında yerelde korunma bilgisi gösterilir.
- DONE: Escape, Tab çevrimi ve açan düğmeye odak dönüşü eklendi.
- SINIR: Canlı namaz servisi sürekliliği, konum/bildirim izinleri ve yönetici etkinlik yazma akışları garanti edilmedi.

### Psikoloji/UX
- Kaynak künyeleri ve notun nerede saklandığı görünür; başarısız senkronizasyon başarı gibi sunulmaz.

## Odak — FocusExperience / zamanlayıcı ve analiz

### Masaüstü (1440px)
- DONE: Merkezi zamanlayıcı düzeni korunur; topbar kontrolleri en az 44px.

### Mobil (375px)
- Oturum, yedi ses seçeneği, duraklatma ve dar ekran kontrolleri regresyon kapsamındadır.

### Dark Mode
- Kendi sakin, koyu görsel dili korunur. Geçmiş/analiz ayrı görünüm olarak kalır.

### Etkileşim
- MISSING: Çalışan oturumdan çıkış onayı → ADDED: Çıkınca mini sayaçta devam edeceğini açıkça söyleyen onay. İptal ekranı korur; onay tam ekrandan çıkar ve oturumu sürdürür.
- BUG: Gömülü görünümde iç içe `main` → FIX: Gömülü sürüm `section`, bağımsız sayfa `main`.
- DONE: Analiz lazy import'u kendi skeleton sınırında yüklenir.

### Psikoloji/UX
- Oturum sessizce silinmez veya tamamlandı sayılmaz; kullanıcının devam etme seçeneği korunur.

## Meslek ve Ahlak Okulu — ProfessionSchoolView / LessonReader / Reflections / Certificate

### Masaüstü (1440px)
- Ders yolu, alan araması ve yansımalar mevcut düzeniyle denetlendi; gereksiz yeniden tasarım yapılmadı.
- IMPROVE: Katalog filtreleri masaüstünde 40px kalıyordu → DONE: Her genişlikte en az 44px hedef.

### Mobil (375px)
- Ana görünüm tarandı; mevcut testler 375/768/1024/1440px ve sertifika sınırlarını kapsar.

### Dark Mode
- Koyu kartlar ve okuyucu korundu; tema taraması yapıldı.

### Etkileşim
- Kilitli ders, ders okuma/tamamlama, yeniden okuma, yansıma ve 8 ders sonrası sertifika test kapsamındadır.

### Psikoloji/UX
- Kullanıcı katılımı ile manevî üstünlük arasında ayrım korunur; kilitler sahte progress ile açılmaz.

## Mazlum Coğrafyalar — AwarenessView ve alt paneller

### Masaüstü (1440px)
- Öğren / Harekete Geç / Bilgi Testi yapısı ve kaynak bağlantıları korundu.

### Mobil (375px)
- Ana görünümde taşma yok; alt sekme, filtre ve test etkileşimleri regresyon kapsamındadır.

### Dark Mode
- Mevcut quiz cevap/geri bildirim kontrast testleri korunur.

### Etkileşim
- Coğrafya seçimi, boykot arama/filtre, boş durum ve tekrar test ödülünün sınırlanması kontrol edilir.
- Dua defteri örnek/yerel olarak etiketlidir; canlı anonim topluluk duvarı varmış gibi sunulmaz.

### Psikoloji/UX
- Hassas içerik için saygılı görsel ton korunur. Uydurma topluluk sayıları eklenmez.

## Profil — ProfileView / BadgeGallery / ActivityCalendar

### Masaüstü (1440px)
- BUG: Sonraki seviye açıklaması 6px ve `overflow:hidden` olan ilerleme çubuğunda kesiliyordu → FIX: Açıklama çubuğun dışına çıkarıldı.
- DONE: Sayfa başlığı h1, puan etiketi XH; progressbar ad/değerleri eklendi.

### Mobil (375px)
- DONE: Rozet açıklamaları 14px; seri istatistikleri iki sütunda; ay gezinti düğmeleri 44×44px.

### Dark Mode
- BUG: Fotoğraf olmayan profilin ikonu koyu zeminde seçilmiyordu → FIX: Belirgin tema yüzeyi/renkli avatar alanı.

### Etkileşim
- Seviye açıklamasının görünürlüğü ve erişilebilir ilerleme değeri regresyon kapsamındadır.

### Psikoloji/UX
- Kazanılmamış rozetler gerçek koşullarıyla gösterilmeye devam eder.

## Ayarlar / arama / kutlama — ortak pencereler

### Masaüstü (1440px)
- DONE: Ayarlar yüklenirken uygulama kabuğu yerinde kalır.

### Mobil (375px)
- DONE: Ayar penceresinde viewport/safe-area sınırı ve iç kaydırma; görünür 44px kapatma kontrolü.

### Dark Mode
- Ortak yüzey ve odak halkası korunur.

### Etkileşim
- MISSING: Güvenilir klavye odak çevrimi → ADDED: Üstteki pencereye ait Tab/Escape, iç içe avatar kırpma penceresi desteği, scroll kilidi ve odak dönüşü.
- ADDED: Ayarlarda ok/Home/End ile sekme gezintisi ve panel ilişkileri.
- BUG: Aramada `aria-activedescendant` vardı, sonuç listesi semantiği yoktu → FIX: Combobox/listbox/option ve seçili sonuç bilgisi.
- DONE: Kutlama hareket azaltma tercihini dikkate alır.

### Psikoloji/UX
- Arama sonucu olmayan durum açıklayıcı kalır; modal kapatıldığında kullanıcı başladığı yere döner.

## Topluluk / 3D / doğrulanamayan alanlar

### Masaüstü (1440px)
- Topluluk boş/yükleme görünümü ve giriş noktaları tarandı. Gerçek grup üyeleriyle sohbet doğrulanmadı.
- BUG: `/kesif` doğrudan ziyaretinde `AuthProvider` yoktu; yükleme durumu çözülmüyordu → FIX: Ana sayfadaki sunucuda doğrulanmış kimlik + provider düzeni bu rotaya da uygulandı. Girişsiz kullanıcı köye değil giriş ekranına ulaşır.

### Mobil (375px)
- Topluluk ana görünümünde yatay taşma yok. 3D WebGL ve dokunmatik sürüş bu taramanın dışında.

### Dark Mode
- Topluluk boş durumu tarandı. 3D canvas tema kıyaslaması yapılmadı.

### Etkileşim
- BUG: Grup oluşturma/katılma hatası modal arkasında kalıyordu → FIX: Hata modal içinde `role="alert"` ile gösterilir; Tab odağı içeride tutulur, Escape kapatır ve odak açan düğmeye döner.
- BUG: Grup detayındaki ikinci `<main>` → FIX: Tek ana içerik alanı korunarak detay `<section>` oldu.
- Gerçek group RPC/realtime/RLS ve avatar upload, randevu/peer yönetimi için ayrı, kontrollü test hesapları gerekir. Bu tur bu servisler çalışıyor diye sonuç vermez.

### Psikoloji/UX
- Sadece yerelde tutulan/demo içerik topluluk başarısı olarak sunulmaz.

## Tekrarlanabilir kontroller

PowerShell; gizli değer gerektirmez, yalnızca mevcut yerel yapılandırma kullanılır:

```powershell
$env:SAH_E2E='1'
npm run dev -- --webpack --port 3011
# Ayrı terminal:
$env:SAH_E2E_PORT='3011'
node scripts/audit-ui.cjs after
npm run test:unit
npx next build
npx playwright test tests/e2e/ui-audit.spec.ts tests/e2e/focus-quality.spec.ts tests/e2e/phase-three.spec.ts tests/e2e/responsive-sections.spec.ts tests/e2e/login-experience.spec.ts tests/e2e/profession-school.spec.ts tests/e2e/awareness-redesign.spec.ts tests/e2e/journal-redesign.spec.ts tests/e2e/quran-readiness.spec.ts tests/e2e/quran-note-editor.spec.ts --workers=1
# Üretim derlemesini ayrı terminalde başlat:
npm run start -- --port 3012
# Başka terminal:
node scripts/audit-public.cjs
```

Kanıtlar `test-results/ux-audit-verified/`, `test-results/audit-ui-final/`, `test-results/audit-targeted/` ve `test-results/production-ui-smoke/` altında; test fotoğrafları/izleri commit edilmez. Geliştirme font çözücüsü sorunu nedeniyle test sunucusu webpack ile, üretim derlemesi varsayılan Next build ile çalıştırıldı. Görsel taramayı, build'i ve E2E turlarını sırayla çalıştırmak önerilir.

### Sonuç durumu

- 80/80 görünüm yüklendi; taramada yatay taşma ve runtime hatası yok.
- Küçük kontrol taramasında kalan 18px öğeler etiket içinde yer alan native checkbox'lar; tıklanabilen etiketin 44px alanı ayrıca korunur. Bu sayım tek başına tam WCAG sertifikasyonu değildir.
- 229/229 birim testi geçti.
- Son kodla `npx next build` ve değişen TS/TSX dosyalarının hedefli ESLint kontrolü geçti.
- Yerel üretim build'inde `/`, `/focus`, `/kesif` × 375/1440px: 6/6 yükleme/taşma/runtime kontrolü geçti.
- İlk geniş E2E turu: 87/92 geçti. Günlük yazı alanının 480px sınırını aşması düzeltildi; başarısız günlük, odaktan dönüş, koyu tema ve farkındalık senaryoları sonraki turlarda geçti.
- Yeni denetim paketi: son toplu çalıştırmada 19/20 geçti; kalan hoca kartı senaryosu DEV giriş yüklemesinde zaman aşımına uğradı ve değişiklik yapılmadan tek başına tekrar çalıştırıldığında geçti. Pencere odağı, yerel avatar yedeği ve Keşif oturum kapısı iki projede de geçti. Bu sonuç **tek çalıştırmada tamamen yeşil bir E2E turu değildir**.
- Sonradan eklenen hesap menüsü koyu tema senaryosu masaüstü/mobil 2/2 geçti; böylece paketteki 22 senaryonun her biri en az bir doğrulama turunda geçti. Son menü ve kapalı menülü rapor görüntüleri `test-results/account-menu-final.png` ve `test-results/reports-final.png` içinde.
- AÇIK BULGU: Uzun/yoğun DEV misafir testlerinde aralıklı giriş-yükleme takılması veya misafir görünümünün kapanması görüldü. Üretim giriş/odak/Keşif smoke turunda görülmedi, ancak gerçek oturumla kök neden ve süreklilik kontrolü ayrıca gerekir. Test geçirmek için üretime misafir/auth bypass eklenmedi.
- Lighthouse/Web Vitals, ekran okuyucu gerçek cihaz testi, iOS klavye/VoiceOver, 60fps ölçümü ve production iki hesaplı işlemler yapılmadı; bunlar için kalite garantisi verilmez.
