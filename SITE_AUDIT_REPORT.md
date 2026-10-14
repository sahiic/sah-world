# SAH World — üretim ve kaynak kod denetimi

Tarih: 13 Ekim 2026, Europe/Istanbul. İncelenen kaynak: `main@4a41be5`. Denetim dalı: `feature/site-audit-2026-10`.

## Yönetici özeti

Ürün bir prototipten ileride: onboarding, günlük taslak kuyruğu, odak sesleri/arka planları, gelişim ağacı, raporlar ve modüler meslek dersleri mevcut. Öncelik yeni ekran eklemek değil; sunucu kuralları, performans ölçümü ve tasarım tutarlılığıdır. Görev metnindeki “onboarding yok” örneği mevcut ürün için doğru değildir.

Bu çalışma uygulama kodunu değiştirmez, üretimde kayıt oluşturmaz/silmez ve migration çalıştırmaz. Canlı oturumdaki özel günlük metinleri, kişi bilgileri ve erişim bilgileri rapora alınmamıştır. Tema testi sonunda başlangıçtaki açık tema ve normal viewport geri yüklenmiştir.

### Kanıt düzeyleri

- **C:** Canlı tarayıcı DOM/erişilebilirlik ağacı/görsel gözlem veya HTTP yanıtı.
- **K:** Belirtilen commit'teki kaynak kod incelemesi; üretim veritabanının aynı durumda olduğunu kanıtlamaz.
- **T:** Bu denetimde çalıştırılmış test.
- **D:** Doğrulanamadı; ölçüm/erişim gerekiyor. Başarılı kabul edilmez.

Canlı oturum açık geldi. Odak, ana sayfa ve Meslek Okulu incelendi. Altı genişlik matrisi ana sayfada uygulandı. Diğer ekranların tamamının canlı uçtan uca denetlendiği iddia edilmez. Gerçek oturumu bozmamak için token silme, oturum sonlandırma, uzun özel not kaydetme ve ağ keserek üretim kuyruğunu tetikleme yapılmadı.

### Kapsam skorları

Bu skorlar Lighthouse/WCAG sertifikası değildir. 0=yok, 1=temel, 2=kısmi, 3=yerleşmiş, 4=ölçümlerle doğrulanmış ölçeğinde **mühendislik olgunluğu değerlendirmesi**; bilinmeyenler puana dahil edilmez.

| Alan | Skor | Gerekçe / güven |
|---|---:|---|
| Mimari | 2/4 | Dinamik bölümler mevcut; 500+ satırlık aktif bileşenler sürüyor. K, yüksek |
| Test altyapısı | 3/4 | Ana dalda 210 birim testi geçti; UI/SQL testleri repoda. T/K, yüksek |
| Erişilebilirlik | 2/4 | Skip link, etiketler ve focus kuralları var; tam ekran okuyucu ve kontrast taraması yok. C/K, orta |
| Responsive | 3/4 | Ana sayfa altı genişlikte taşmadı; tüm modüller ve gerçek cihazlar henüz kapsanmıyor. C, orta |
| Dark mode | 2/4 | İşlevsel tema ve tokenlar var; açık hesap kartı gibi görsel tutarsızlıklar sürüyor. C/K, orta |
| SEO | 3/4 | Meta, canonical, robots ve sitemap var; ürün tanıtım/JSON-LD stratejisi eksik. C/K, yüksek |
| Performans | Ölçülmedi | Alan verisi/trace olmadan puan veya saniye uydurulamaz. |
| Güvenlik | Genel skor verilmedi | Kaynak incelemesi ve başlık kontrolü pentest veya canlı RLS sertifikasyonu değildir. |

## Öncelikli bulgular

P0=kanıtlanmış kritik güvenlik/veri kaybı veya temel akışın tamamen durması; P1=yayın kalitesi için yüksek; P2=planlı iyileştirme; P3=deney. **Bu incelemede doğrulanmış P0 yoktur.**

### SEC-01 — HTTP güvenlik başlıkları eksik — P1

**C:** Ana URL'ye HEAD yanıtında HSTS `max-age=63072000; includeSubDomains; preload` mevcut. CSP, CSP-Report-Only, X-Content-Type-Options, X-Frame-Options, Referrer-Policy ve Permissions-Policy yok. Bu bulgu tek başına XSS olduğu anlamına gelmez.

**K:** `next.config.ts:3`, `src/proxy.ts:5` başlık politikası tanımlamıyor. Aksiyon: önce Report-Only CSP ile gerekli originleri envanterle; nonce/hash stratejisini Next App Router ile test et; `frame-ancestors`, `nosniff`, uygun referrer ve özellik politikalarını ekle. Mikrofon/konum gibi kullanılan izinleri körlemesine kapatma. Kabul: ana sayfa, focus, auth callback ve statik rotalarda başlık testleri; CSP yüzünden giriş/ses/görsel bozulmaması.

### SEC-02 — Meslek dersinin sırası sunucuda korunmuyor — P1

**K:** `supabase/migrations/011_profession_ethics_school.sql:132` kimlik, ders ve 600 karakter sınırını kontrol ediyor; `:138` ilerlemeyi doğrudan ekliyor. Önceki dersin bitmiş olması kontrolü yok. `:64–65` ve `:165` kullanıcının kendi ilerleme satırına doğrudan INSERT/UPDATE yapmasına izin veriyor. Arayüzde kilitli ders kuralı `src/components/profession/ProfessionSchoolView.tsx` içindeki `openLesson` ile sınırlı. Sonraki migrationlarda bu politika adlarını kaldıran bir düzenleme bulunamadı.

Risk: doğrudan RPC çağrısıyla ders sırasını atlama; tablo yazımıyla ilerleme/XP tutarsızlığı. **Üretimde istismar denenmedi, diğer kullanıcı verisine erişim kanıtı yok.** Aksiyon: ilerleme yazımını doğrulanmış RPC üzerinden sınırla; ayrı not güncelleme RPC'si gerekiyorsa yalnız not alanını aç; önceki ders ve idempotency testleri ekle. Kabul: sıra dışı ders reddedilir, tekrar tamamlamada XP artmaz, başka kişinin satırına yazılamaz. Mevcut ilerlemeler silinmeden yeni migration.

### REL-01 — Katalog fallback'i migration eksikliğini gizleyebilir — P1

**K:** `src/components/profession/professionData.ts:9` dört sorgu yapıyor; `:15` yalnız takip/ilerleme hatasını fırlatıyor; `:22–23` katalog sayısı statik sayıya eşit değilse statik 10 yol/80 dersi gösteriyor. Canlıda yeni meslek kartlarını görmek veritabanında migration 039'un uygulandığını kanıtlamaz. Eksik seed durumunda kart görünürken takip/tamamlama başarısız olabilir.

Aksiyon: katalog sürümü/sağlık doğrulaması; veri erişim hatasını gerçek boş sonuçtan ayır; yayın akışına salt-okunur 10 yol/80 ders ve örnek yeni ders ID doğrulaması koy. Kullanıcıya teknik ayrıntı yerine “Bu içerik henüz hazır değil” göster. Kabul: eksik seed fixture'ında sahte başarılı takip yok, veri korunuyor.

### PERF-01 — Global CSS bütçesi ve cascade karmaşıklığı — P1

**K:** `src/app/globals.css` 507.576 bayt (~496 KiB) kaynak; `journal.css` 24.814, `profession-school.css` 17.688 bayt. Odak kuralları `globals.css:740`, mobil override `:749–750`, sonraki override `:780` gibi farklı katmanlara yayılmış. `layout.tsx:4–5` hem globals hem quality dosyalarını yüklüyor.

Aksiyon: focus/shell/mosque kurallarını sahiplik bazında ayır, PostCSS selector envanteri ve ekran karşılaştırması ile aynı selector'ın son kazananını belgeleyerek taşı. Kör “unused CSS” silme yapma; dinamik modal ve dark selector'ları coverage'da görünmeyebilir. Kabul: ilk rota CSS gzip bütçesi ölçülür, bir önceki sürümden %20 düşüş hedefi ölçüm sonrası kesinleştirilir; light/dark snapshot farkları incelenir.

### PERF-02 — Büyük JS chunk var; “gereksiz paket” henüz kanıt değil — P1 ölçüm

Önceki yerel üretim build'inde (`879c75e`, PR98; bu raporun main kaynağı veya canlıyla aynı değil) en büyük chunk 1.103.044 bayt JS, CSS chunk 669.228 bayt; sıkıştırılmamış disk boyutlarıdır, ilk yükleme transferi değildir. `package.json` Three/R3F/drei/postprocessing içeriyor. Paketlerin mevcut olması ilk ekranda tamamının indirildiği anlamına gelmez. `SahApp.tsx:30–58` dinamik import kullanıyor.

Aksiyon: aynı commit için bundle analyzer ve route/network waterfall çıkar; büyük chunk modül sahipliğini doğrula; kullanılmayan legacy/3D yolunu ancak referans grafiği doğruladıktan sonra kaldır. Hedef: dashboard için route bazlı gzip JS bütçesi, ağır deneyimleri kullanıcı açınca yükleme. Kanıtsız paket silinmemeli.

### PERF-03 — Font stratejisi iyi, ikon bağımlılığı ayrı — P2

**K:** `layout.tsx:8–28` next/font ve `display: swap` kullanıyor; üç font ailesi, çeşitli ağırlıklar var. `:108–111` Tabler webfont CSS'i üçüncü taraf CDN'den preload + stylesheet olarak geliyor. **C:** mobil başlıkta küçük ikon-only hedefler görsel olarak metinli eylemlerden daha az açıklayıcı; erişilebilir adları var. FOIT/FOUT filmstrip ile ölçülmedi.

Aksiyon: kullanılan ikonların yerel SVG/sprite veya daraltılmış font setiyle sunulmasını karşılaştır; özellikle birincil eylemin adı fonta bağlı olmasın. Türkçe/Arabî glyph ve fallback test et. CDN kesildiğinde temel butonların anlaşılır kalması kabul kriteri.

### ARCH-01 — Büyük client kabuğu ve geniş store aboneliği — P2

**K:** aktif adaylar: `CommunityView.tsx` 852, `FocusTimerView.tsx` 803, `SahApp.tsx` 740, `useJourneyStore.ts` 730, `QuranExercises.tsx` 692, `ReportsView.tsx` 669, `QuranChat.tsx` 661 satır. `quranSurahs.ts` 1195 satır veri dosyasıdır; bileşen monoliti sayılmamalı. `legacy/LegacyVillageApp.tsx` 1158 satırın aktif bundle'a girdiği doğrulanmadı.

`SahApp.tsx:116` tüm journey store'a abone; `src/app/page.tsx:6–14` sunucuda kimlik/profil doğrulayıp client kabuğuna geçiyor. Bu, “tamamen client auth” değildir. Aksiyon: store selector'larını daralt, önce React Profiler ile odak tick/günlük yazma/navigasyon commit sürelerini ölç; sonra sınırları böl. Gereksiz render sayısı bu çalışmada ölçülmedi.

### A11Y-01 — 44×44 ürün hedefi her yerde sağlanmıyor — P2

**C:** ana sayfada mobil “Vird ve amel ekle” ~42×44; desktop arama ~560×42 (1920 genişlik), görüş ~42×40, “Tüm raporlar” ~123×25, özet ~111×39. İlk odak ölçümünde Ekle ~52×40. `globals.css:740` `.focus-task-slot form button` taban min-height 34; sonraki kurallar kazanan ölçüyü değiştirebilir.

Aksiyon: ortak hit-area tokenı 44px; simge görsel boyutu sabit kalabilir, tıklama alanını büyüt. **44px kullanıcı isteğidir; WCAG 2.2 AA minimumu koşullarıyla 24px'tir.** Bunları otomatik AA ihlali diye etiketlemiyoruz. [W3C minimum hedef açıklaması](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).

### VIS-01 — Tema hiyerarşisi ve yazı yoğunluğu — P2

**C:** koyu Meslek Okulu, yeşil zemin, mor hero ve açık hesap kartını birlikte kullanıyor; okunabilirlik ile görsel tutarlılık ayrı konular. `.profession-hero p` ve meslek açıklamalarında ölçülen yazı 12px. Hero metni rgb(215,215,236), kart açıklaması rgb(215,220,234); gradient/şeffaf arka plan nedeniyle bu renklerden tek başına AA sonucu çıkarılmaz.

Aksiyon: hesap yüzeyi ve modül kartlarını tek surface/elevated token sistemine bağla; içerik metnini 14–16px aralığında değerlendir; fotoğraf/gradient üzerindeki gerçek en kötü kontrastı ölç. Karanlık tema “yok” değil, tutarlılık işi var.

### SEO-01 — Teknik temel var; keşfedilebilir ürün sayfaları ayrılmalı — P2

**C:** title, description, Open Graph ve kök canonical mevcut; JSON-LD sayısı 0. `robots.txt` HTTP 200, 92 bayt; `sitemap.xml` HTTP 200, 736 bayt. **K:** `robots.ts` admin'i engelliyor; `sitemap.ts` ana sayfa, iki farkındalık sayfası ve hukuki sayfaları içeriyor. Özel günlük/sohbetin indexlenmemesi doğru hedef; sırf SEO için kişisel içerik açılmamalı.

Aksiyon: herkese açık ürün tanıtım rotaları için özgün metadata ve yalnız doğrulanabilir WebApplication/Organization JSON-LD. `?view=` ekranlarına ayrı SEO sayfası muamelesi yapma; auth callback hata sayfası index politikasını ayrıca kontrol et. Canonical kök olması özel uygulama ekranları için tek başına bug değildir.

## Canlı responsive / etkileşim kanıtı

900px yükseklikte ana sayfa. Uygulama içi tarayıcı küçük genişliklerde ölçek yuvarlaması yapıyor; istenen ve DOM'daki değer ayrı raporlandı. “Yatay taşma yok” tüm alt öğelerin kırpılmadığı anlamına gelmez (`layout.tsx:114` overflow-x-hidden).

| İstenen genişlik | DOM innerWidth | document scrollWidth | Sonuç |
|---:|---:|---:|---|
| 320 | 321 | 316 | Belge yatay taşmıyor; tam 320 emülasyonu doğrulanmadı |
| 375 | 376 | 371 | Belge yatay taşmıyor; bottom nav görünür |
| 768 | 768 | 763 | Belge yatay taşmıyor |
| 1024 | 1024 | 1020 | Belge yatay taşmıyor, sidebar düzeni |
| 1440 | 1440 | 1435 | Belge yatay taşmıyor |
| 1920 | 1920 | 1915 | Belge yatay taşmıyor |

Odak ekranında aynı genişlikler denendi ancak ilk seri ardışık resize örneklerinden biri önceki genişliği döndürdü; o seri tam matris kanıtı sayılmadı. 504px ilk görüntüde sayaç, süre, ses ve arka plan alanları görünür ve belge taşmıyordu. Ana sayfada görünür adsız button sayısı 0 çıktı; bu bütün site erişilebilirlik sertifikası değildir.

Tema menüsü açıldı, koyu görünüm uygulandı, Escape ile menü kapatıldı, Meslek Okulu'na geçildi ve açık görünüm geri yüklendi. Bir tarayıcı komutu timeout verdi fakat sonraki DOM'da tema değişmişti; uygulama hatası diye kaydedilmedi. Canlıda Tab/Enter tüm akışları, gerçek ekran okuyucu ve cihaz dokunma davranışı tamamlanmadı.

## Performans ölçüm tablosu ve tamamlayıcı protokol

| Ölçüm | Sonuç | Gereken yöntem |
|---|---|---|
| FCP / LCP | D: ölçülmedi | Aynı production SHA, temiz profil, 5 soğuk mobil/desktop Lighthouse/trace; medyan ve aralık |
| CLS | D: ölçülmedi | Yükleme + modal + font + route boyunca layout-shift gözlemi |
| INP | D: ölçülmedi | Gerçek kullanıcı p75 / yeterli etkileşim örneği; tek click süresi INP değildir |
| Kullanılmayan CSS | D: yüzde verilmedi | Tüm durumları açan coverage; dinamik selector envanteri |
| React re-render | D: ölçülmedi | Profiler ile yazma, timer tick, menü ve route başına commit izi |
| Image optimizasyonu | K: config remotePatterns var | Canlı tüm img/background/video ağ envanteri, srcset/sizes, lazy/LCP önceliği kontrolü eksik |

Hedefler: p75 LCP ≤2,5sn, INP ≤200ms, CLS ≤0,1; bunlar elde edilmiş sonuç değil [Web Vitals eşikleridir](https://web.dev/articles/vitals?hl=en). Mevcut tarayıcı arayüzü network interception/profiler/vitals kaydı sunmadığından tahmini puan üretilmedi. Ölçüm için kontrollü ayrı test oturumu kullanılmalı, üretim kullanıcısının oturumu ve taslağı etkilenmemeli.

## Hata yönetimi, veri güvenliği ve kapsam sınırları

- `src/components/core/SectionErrorBoundary.tsx:17` alert ve retry içeriyor; React hata sınırı, bütün async sorgu hatalarını kendiliğinden yakalamaz.
- `src/components/ui/MotionPreferences.tsx:6` MotionConfig reducedMotion="user" sağlıyor; `quality.css:6–7` görünür focus stilleri var. CSS/SVG ve GSAP hareketlerinin tamamının bu Framer Motion ayarına otomatik uyduğu varsayılmaz; ayrı reduced-motion kontrolü gerekir.
- `src/lib/journalOutbox.ts:88–92` online olayı ve tekrar deneme var. Offline temeli mevcut; tam offline uygulama anlamına gelmez. `src`/`public` aramasında service worker registration/push subscription akışı bulunmadı; manifest tek başına offline sağlamaz.
- `src/providers/AuthProvider.tsx:52–64` auth eventleri ve signout temizliği; `src/proxy.ts:23` sunucuda getUser doğrulaması var. Süresi geçmiş token/ağ hatası senaryoları canlıda çalıştırılmadı.
- `supabase/migrations/023_launch_readiness.sql:36,60,84` chat, quiz, peer hız sınırları içeriyor; “rate limit yok” demek yanlış. Üretim kurulumu ve eşzamanlı çağrıda atomiklik ayrıca test edilmeli.
- `038_quran_message_edit.sql:77,87,102,109` auth/gönderen kontrolleri içeriyor. Canlı RLS policy dump ve iki farklı test hesabı olmadan tam izolasyon kararı verilmez.
- `src` taramasında dangerouslySetInnerHTML/innerHTML/eval eşleşmesi çıkmadı; bu tüm XSS olasılıklarını dışlamaz. URL protokol allowlist, link hedefi ve ileride Markdown sanitizasyonu test edilmeli.
- `.env` açılmadı; hiçbir secret değeri taranıp rapora alınmadı. Client build sızıntısı tam secret scan ile doğrulanmadı. Supabase public istemci ayarları ile service-role gibi sunucu sırları aynı sınıf değildir; değerleri paylaşmadan CI secret scanner kullanılmalı.
- `LoginScreen.tsx:436–437` iki `as never` mock kullanıcı cast'i var; test fixture tipiyle değiştirilmeli. Metinsel `any` aramasının 7 eşleşmesi yorum ve manifest değerlerini de içeriyor; “7 any tip hatası” sonucu çıkarılamaz.

## Test kapsamı

Bu denetim dalında `npm run test:unit`: **210/210 geçti**. Önceki PR98 için 220 test sonucu bu dalın sonucu değildir; günlük ders önerisi ana dala henüz dahil değil.

Repo UI testleri: `tests/e2e/phase-three.spec.ts:14` klavye/skip-link, `:30` light/dark muted token kontrastı, `:48` journal/mosque responsive; `profession-school.spec.ts` ders/reflection/sertifika; `focus-quality.spec.ts`, `focus-studio.spec.ts`, `journal-drafts.spec.ts`, `quran-social.spec.ts` ilgili akışları içeriyor. CI `.github/workflows` içinde unit→Playwright→izole sosyal backend→izole PostgreSQL→build çalıştırıyor. **Bu denetimde tüm E2E yeniden çalıştırılmadı.**

Kritik boşluklar: field CWV bütçesi; gerçek ekran okuyucu; tüm renk çiftleri; 320 ve 1920 tüm ekranlar; RPC ders sırası ve doğrudan tablo yazımı negatif testleri; deployment/migration parity; gerçek staging auth expiry/offline/reconnect. Test dosyası varlığı ile branch coverage yüzdesi aynı şey değildir; coverage yüzdesi ölçülmedi.

## Sonuç

İlk teslim: SEC-01 + SEC-02 + REL-01 ve performans baseline. Ardından dokunma alanları ve CSS sahipliği. Daha fazla gamification veya AI eklemeden mevcut veri/tamamlanma sözleşmesi güvenilir hale getirilmeli. Rakip karşılaştırması [VISUAL_COMPARISON.md](VISUAL_COMPARISON.md), dosya bazlı plan [ROADMAP.md](ROADMAP.md).
