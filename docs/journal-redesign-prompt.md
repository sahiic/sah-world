# SAH World — Günlük bölümünü sade, profesyonel ve etkileşimli hale getir

## Rolün ve teslimatın

SAH World projesinde kıdemli ürün tasarımcısı ve full-stack geliştirici olarak çalış. Günlük bölümünü yalnızca görsel makyajla değil, yazmaya başlama, taslağı koruma ve geçmişe dönme deneyimleriyle iyileştir. Bu bir uygulama görevidir: aşağıdaki ilk sürüm kapsamını kodla, doğrula ve çalışan sonuç teslim et. Sadece öneri listesi, statik maket veya işlevsiz butonlar bırakma.

Hedef deneyim: sakin bir kişisel defter. Kullanıcı açtığında doğrudan yazabilmeli, isterse derinleşebilmeli ve eski yazılarını kolayca bulabilmeli. Daha fazla panel, grafik ve efekt eklemek başarı sayılmaz. SAH'ın niyet, şükür ve şefkatli muhasebe kimliğini koru; başka bir uygulamanın markasını veya arayüzünü kopyalama.

## 1. Başlamadan önce incele

Çalışma alanı `C:\Sah`. Önce gerçek çalışma alanını, `AGENTS.md` talimatlarını, Git durumunu ve mevcut dosyaları kontrol et. Next.js sürümünü varsayma; ilgili rehberi kurulu `node_modules/next/dist/docs/` içinden oku. Kullanıcının mevcut değişikliklerini koru; geniş kapsamlı sıfırlama veya ilgisiz dosya düzenlemesi yapma.

Başlangıçta incelenecek alanlar:

- `src/components/core/JournalHubView.tsx`
- `src/components/core/JournalNotebook.tsx`
- `src/components/core/SectionView.tsx`
- `src/app/globals.css` içindeki günlük stilleri
- `src/lib/appLocation.ts`
- `src/lib/debouncedDrafts.ts`, `src/lib/journalOutbox.ts` ve bunların kullandığı veri/kimlik katmanı
- `src/types/index.ts`, günlük ve şükür store işlemleri
- `tests/e2e/journal-drafts.spec.ts`, `daily-navigation.spec.ts`, `responsive-sections.spec.ts`, `module-outcomes.spec.ts`
- `docs/journal-research-2026-10-07.md`

Dosya adları bir başlangıç haritasıdır; değişmişlerse gerçek eşdeğerlerini bul. Çalışan kayıt ve kimlik altyapısını sırf arayüz değişiyor diye yeniden yazma. Önceden var olan test hatalarını tespit edip kendi değişikliğinin hatalarından ayrı raporla.

## 2. Araştırmadan alınacak ilkeler

Resmi özellik kaynakları:

- Day One: yazma, şablonlar ve geçmişi bulma — https://dayoneapp.com/features/
- Daylio: duygu seçimiyle hızlı giriş — https://daylio.net/
- Stoic: sabah/akşam ve isteğe bağlı rehberli değerlendirme — https://www.getstoic.com/features
- Journey: zaman akışı, takvim ve arama — https://support.journey.cloud/en/categories/journey-basics/articles/what-is-journey
- Diarium: arşiv, arama ve veri taşınabilirliği — https://diariumapp.com/en

Bunlar bağımsız bir “en iyi” sıralaması değildir. Ücretli/platforma özel özelliklerin hepsini kopyalama. SAH'ta hızlı kayıt, sabah–akşam ritüelleri, duygu alanları, taslak koruma ve gün izi zaten bulunuyor. Öncelik bunları daha anlaşılır sunmak; aynı özellikleri ikinci kez geliştirmek değil.

## 3. Yeni bilgi mimarisi

Ana Günlük gezinmesini şu hale getir:

- **Yaz:** günün kaydı ve yazı alanı.
- **Geçmiş:** kayıt listesi, arama ve takvim.
- **Araçlar:** küçük bir menü; Öncelik Matrisim, Şükür Defterim, Hatalar ve Dersler.

Dört büyük açıklamalı sekme kartını kaldır. Araçları silme, işlevlerini azaltma veya verilerini günlük metnine birleştirme. Araçlar menüsü klavye ve dokunmayla çalışsın; açık araç görünümünde başlık ve Günlük yazmaya dönüş eylemi olsun.

`/?view=journal&tab=journal`, `tab=matrix`, `tab=sukur`, `tab=lessons` bağlantıları çalışmaya devam etsin. Yeni Geçmiş görünümü için gerekiyorsa doğrulanmış bir günlük görünüm parametresi ekle; mevcut gezinme yardımcısıyla bütünleştir. URL, geri/ileri ve yenileme davranışlarını test et. Günlüğe özgü parametre başka modüllerde yanlış görünüm seçtirmesin. Araç veya Geçmiş'e geçmek taslağı kaybettirmesin.

## 4. Yaz ekranının düzeni

Masaüstünde ortalanmış, yaklaşık 720–800 px genişliğinde tek yazı sütunu kullan. İstatistik yan paneli ekleme. Mobilde tek sütun ve 16–20 px kenar boşluğu kullan. Uygulamanın mevcut yeşil yan menüsü ve genel üst çubuğu korunsun.

Üstten alta hiyerarşi:

1. Küçük “Günlük” başlığı; en fazla bir satırlık yardımcı metin.
2. Kompakt Yaz / Geçmiş gezinmesi ve Araçlar menüsü.
3. Tarih, önceki/sonraki gün, Bugün'e dön; Sabah / Akşam seçimi.
4. Kısa Hızlı / Detaylı kontrolü ve duygu seçimi.
5. Ana yazı alanı.
6. Kaydet ve gerçek kayıt durumu.
7. İsteğe bağlı derinleşme alanları, gün izi ve geçmiş anılar.

Mevcut büyük mor–turuncu hero, tekrar eden dev başlık, büyük ritüel/mod kartları, sahte defter halkaları, 3B sayfa dekoru ve gereksiz sabit minimum yükseklikleri kaldır. Tarihi büyük tanıtım kartının içinde tutma. İlk görünümde büyük reklam alanı değil editör görülsün. Sayfada tek H1 olsun.

Mevcut hatırlanan modu koru; yeni kullanıcıyı mod seçim ekranıyla engelleme. Hızlı kayıtta mevcut kısa metin ve duygu akışı görünür olsun. Tam sabah modunda ana alan niyet, tam akşam modunda ana alan günün notu olsun. Mevcut kayıt doğrulamasını aynen koru. Ruh hali seçimini zorunlu bir engel haline getirme.

## 5. Editör ve ilerleyerek derinleşme

Ana metin alanı sade, odaklandığında belirgin, yazdıkça büyüyen bir editör olsun. İlk sürümde ağır bir zengin metin kütüphanesi kurma; mevcut metin verisiyle uyumlu textarea deneyimi yeterli. Ana yazı 16–18 px, satır yüksekliği yaklaşık 1.7; görünür etiket kullan, placeholder tek başına etiket olmasın.

Hızlı ve Detaylı arasında geçiş tüm taslak alanlarını korusun. `content` ve `intentionText` ayrı alanlardır; modu değiştirirken birini diğerine kopyalayarak eski metni ezme veya görünmeyen alanları boşaltma. Kaydın doğrulama hatası varsa ilgili bölümü açıp odağı doğru alana taşı.

Detaylı alanları aşamalı açılan bölümlerde sun:

- Sabah: niyet görünür; karşılaşılabilecek zorluk ve destekleyici not isteğe bağlı.
- Akşam: günün notu görünür; günün anları, şükürler ve kendime not isteğe bağlı.
- Enerji/stres/uyku: “Günün nabzı” altında kompakt, gerektiğinde açılan alan.
- Gün izi: gerçek uygulama etkinliklerini gösteren, varsayılan kapalı bölüm.

Alanında metin olan kapalı bölüm küçük bir “Dolu” göstergesi taşısın. Kapatma değerleri silmesin. Mevcut an ekleme ve şükür satırlarını koru; üç şükür doldurmayı zorunlu kılma. Geçmiş sayfaları hâlâ salt okunur kalsın.

Yazma sorularını küçük bir “Yazmaya yardımcı ol” eylemiyle sun: “Bugün neye niyet ediyorum?”, “Bugünden aklımda kalan ne?”, “Bugün ne için şükrediyorum?”, “Kendime neyi hatırlatmak isterim?” Bunlar rehber sorudur; mevcut metni otomatik değiştirmesin ve kaynaksız ayet/hadis gibi gösterilmesin. Kullanıcı yanıt vermeden soru metnini günlük kaydı sayma.

## 6. Geçmiş gerçekten işlevsel olsun

Geçmiş görünümünde:

- En yeni kayıt önce, tarih gruplu bir liste.
- Her kayıtta tarih, Sabah/Akşam, kısa metin önizlemesi ve varsa mevcut duygu etiketi.
- Günlük içinde arama: içerik, niyet, şükür, kendine not ve anlar. Türkçe arama davranışını ve boşluk normalizasyonunu test et.
- Tarih aralığı ve Sabah/Akşam/Tümü filtresi; filtreleri temizleme eylemi.
- Küçük ay takvimi; yalnızca gerçek kaydı olan günleri işaretle. İleriki tarih kısıtını koru.
- Kayıt açıldığında aynı günün ritüelleri arasında geçiş, okunabilir metin ve açık “Salt okunur” durumu.
- “Bugün yaz” ile bugünün taslağına dönme; geçmiş görüntülemek bugünün taslağını değiştirmesin.

Arama ile filtreler birlikte çalışsın. Veri kısmen yüklüyse bunu belirt; yalnızca yüklenen kayıtları arayıp “tüm geçmişte yok” diye yanlış sonuç verme. Mevcut veri yükleme sınırlarını incele; gerekirse hesap kapsamlı sayfalama ekle ve sunucu politikalarını zayıflatma. Yükleniyor, henüz kayıt yok, arama sonucu yok, hata ve yeniden dene durumları farklı olsun. Demo verileri gerçek hesaba yazılmasın.

## 7. Taslak ve kayıt güvenilirliği — en yüksek öncelik

Mevcut kullanıcı + tarih + sabah/akşam taslak anahtarlarını koru. Cihaz taslağı ile sunucu kaydını ayır. 600 ms civarı bekleyen yerel yazma, tarih/ritüel/mod/araç değişimi ve sayfadan ayrılmada son karakteri kaybettirmesin. Yeni render yapısı eski kaydı tekrar yükleyip kullanıcının yazısını ezmesin.

Kısa durum metinleri gerçek duruma dayansın:

- Yerel yazma tamamlandığında: “Taslak bu cihazda saklandı”.
- Gönderirken: “Kaydediliyor…”.
- Sunucu onayından sonra: “Sunucuya kaydedildi”.
- Kuyrukta: “Cihazda saklandı · bağlantı bekleniyor”.
- Yerel depolama hatasında: kalıcı uyarı, metni kopyalama ve güvenli yeniden deneme.

Yerel yazmanın başarılı olduğu henüz doğrulanmadıysa olmuş gibi konuşma. İlk sürümde mevcut manuel sunucuya Kaydet yaklaşımını koru; otomatik taslak korumayı otomatik bulut kaydı diye adlandırma. Bozuk taslakları veya başarısız gönderimleri sessizce silme. Hesap değişiminde önceki hesabın verisi gösterilmesin veya yeni hesaba gönderilmesin.

Kaydet eylemi erişilebilir olsun. Mobilde sabit eylem kullanırsan alt menü, safe-area ve sanal klavye için boşluk ayır; yazı ve diğer eylemleri örtmesin. Çift tıklama ve tekrar deneme mükerrer kayıt üretmesin. Doğrulama hatasında girilmiş metin korunsun.

## 8. İş kuralları ve veri modelini koru

- Günlük alanları, UUID kimliği, oluşturulma zamanı, ritüel ve mod bilgisi kayıpsız korunsun.
- Bugünkü kayıt güncellenebilir; eski günlükler salt okunur. Bu görev yeni silme/düzenleme yetkisi vermiyor.
- XH, seri ve rozet davranışları değiştirilmesin. Taslak koruma, açılır bölüm veya sekme değişimi ödül üretmesin. Tekrar Kaydet fazladan XH vermesin.
- Akşam şükürleri mevcut şükür akışıyla tutarlı kalsın; aynı kaydı güncellerken ikinci şükür kaydı veya tekrar ödül oluşturulmasın.
- Kur’an/odak/dua/ders gün izi gerçek kaynaklardan gelsin; sayılar ve olaylar uydurulmasın.
- Mevcut tags, moments, selfNote, intentionText, expectedChallengeText ve gratitudeText gibi alanlar tek bir stringe indirilmesin.
- Eski ritüel/mod bilgisi olmayan kayıtlar mevcut uyumluluk davranışıyla okunabilsin.

## 9. Tasarım sistemi ve erişilebilirlik

SAH yeşili ana eylem vurgusu; sıcak kırık beyaz zemin, koyu okunabilir metin ve hafif nötr yüzeyler kullan. Aşırı gradient, iç içe kart, ağır gölge, parlayan buton veya hareketli arka plan ekleme. Mevcut font/icon sistemini kullan. İkonların tek başına anlam taşıdığı eylemlere erişilebilir ad ver.

Önerilen değerler: bölüm aralığı 20–24 px; kontrol aralığı 8–12 px; radius 12–16 px. Başlık ölçülü, yardımcı yazı en az 12–13 px. Aynı düzeydeki eylemler aynı yükseklikte; birincil eylem Kaydet. Bilgi yalnızca renkle anlatılmasın.

CSS günlük kökü altında kapsamlandırılsın. İlgisiz global stilleri veya diğer modülleri bozma. Mevcut çelişen günlük kurallarını temizleyerek düzenle; dosyanın sonuna sürekli override yığma. Tema varsa açık/koyu uyumunu koru. Yazı odak göstergeleri, en az 44 px dokunma hedefleri, klavye kullanımı, uygun tab/menu/accordion semantiği ve azaltılmış hareket tercihi desteklensin. WCAG AA kontrastını ölç.

## 10. Mahremiyet ve içerik sınırları

Günlük metinlerini loglara, analitik olaylarına, hata telemetrisine veya dış yapay zeka servisine gönderme. Yeni veri paylaşımı veya sosyal yayın ekleme. Metin önizlemelerini güvenli render et; kullanıcı içeriğini HTML olarak çalıştırma.

Hesap kapsamlı erişim ve mevcut sunucu politikaları korunmalı. “Uçtan uca şifreli”, “biz bile okuyamayız” gibi mevcut mimaride doğrulanmamış vaatler yazma. Günlük sağlık teşhisi veya kişinin imanını/ahlakını puanlayan bir araç değildir. Dil sıcak ve yargılamayan olsun; “kaçırdın, başarısız oldun” gibi baskı üretme.

Varsayılan ruh hali, enerji, stres ve uyku değerlerini kullanıcı ölçümü sanma. Bu ilk sürümde yeni duygu eğilimi grafikleri veya neden–sonuç yorumları ekleme. Gelecekte analiz yapılacaksa açık kullanıcı seçimini işaretleyen veri ve eski kayıtların ele alınışı önce tasarlanmalı.

## 11. İlk sürüm kapsamı ve sonraki aşamalar

Bu görevde bitir: sade editör, Yaz/Geçmiş/Araçlar yapısı, kompakt tarih/ritüel/mod kontrolleri, alanları koruyan derinleşme bölümleri, çalışan arşiv arama/filtre/takvim, doğru durumlar, mobil uyum ve testler.

Bu görevde kapsam dışında tut: medya yükleme, ses transkripsiyonu, yapay zeka analizi, PIN kilidi, yeni bildirim altyapısı, gelişmiş duygu grafikleri, yeni ödül sistemi. Etiket düzenleme, dışa aktarma ve isteğe bağlı hatırlatıcıları sonraki aşama önerisi olarak belgele; uygulanmamış özelliği çalışan buton gibi gösterme.

## 12. Zorunlu doğrulamalar

Önce mevcut testlerin durumunu kaydet. Sonra değişen akışlara uygun anlamlı testler ekle; testleri silme veya hataları gizleyecek biçimde zayıflatma.

En az şu senaryoları doğrula:

1. Hızlı kayıtta kısa metin yazıp kaydetme; detaylı sabah/akşam doğrulamaları.
2. Son karakteri yazıp bekleme dolmadan başka modüle gidip geri dönme.
3. Sabah/akşam ve tarih değişimi; yenileme; Hızlı/Detaylı geçişi; tüm alanlar korunur.
4. Geçmişe ve araçlara geçip bugünün taslağına dönme.
5. Geçmiş kaydın salt okunurluğu ve eski veri uyumluluğu.
6. İçerik/niyet/şükür araması, Türkçe karakterler, birleştirilmiş filtreler, takvim, boş sonuç.
7. Ağ yokken kuyruk, ağ gelince gönderim; depolama hatası ve bozuk taslakta dürüst durum.
8. Hesap değişimiyle veri ayrımı; eski hesabın kuyruğu yeni hesap adına gönderilmez.
9. Tekrar Kaydet ile aynı UUID; fazladan XH veya şükür kaydı yok.
10. Klavye gezinmesi, odak dönüşü, hata duyuruları; dar ekran ve sanal klavye.
11. Eski günlük URL'leri, tarayıcı geri/ileri ve yenileme.
12. Focus, Mescidim, Kur’an Kardeşim ve diğer modüllerde yan etki yok.

`npm run test:unit`, ilgili Playwright testleri, değişen dosyaların lint kontrolü ve `npm run build` çalıştır. Ortam nedeniyle çalışmayan testi açıkça belirt; başarılı çalışmış gibi raporlama. Mock testleriyle gerçek sunucu doğrulamasını birbirine karıştırma. Test hesabı veya sentetik yerel veri kullan; gerçek özel günlükleri ekran görüntüsüne koyma.

## 13. Görsel kabul kriterleri

- 1440×900 masaüstünde ve 390×844 mobilde uygulamanın üst çubuğu dahil ilk görünümde ana yazı alanı görünür; yeni kullanıcı aşağı kaydırmadan yazmaya başlayabilir.
- Bu iki ölçüde ana editörün üst kenarı yaklaşık ilk 480 px içerisinde olsun; masaüstünde yaklaşık 220 px, mobilde en az 160 px görünür yazı yüksekliğini hedefle. Mevcut kabuk bunu engelliyorsa ölçüp dürüstçe raporla, hedefi sessizce yok sayma.
- Ayrıca 375, 768 ve 1920 px genişliklerde yatay taşma veya örtüşme yok.
- Uzun Türkçe metin, büyük yazı ölçeği, dolu/boş geçmiş, hata ve kaydetme durumları test edilmiş.
- Kaydet çubuğu içeriği, mobil alt menüyü veya sanal klavyede erişilmesi gereken alanları kapatmıyor.
- İlk ekran artık büyük mor tanıtım kartı ve kart yığınları değil; sade ve okunabilir bir defter.
- Önce/sonra masaüstü ve mobil ekran görüntüsü sun.

## 14. Yayın ve son rapor

Kullanıcı yalnızca yerel önizleme değil canlı yayın da istemişse ve yetkili yayın yolu mevcutsa, projeyi doğru üretim kanalından yayımla. Yanlış Vercel hesabında yeni kopya proje kurma; hesap, ortam değişkeni veya Supabase projesini değiştirme. Üretim yayınını doğrulamak için başarılı deployment, ilgili commit ve canlı Günlük ekranını kontrol et. Yerel değişiklik veya build başarısı tek başına canlı yayın değildir.

Bu promptun hazırlanması, tek başına canlı yayımlama yetkisi vermez. Yetki veya erişim yoksa çalışan yerel sonucu ve tam yayın engelini belirt. “Canlıda güncellendi” demek için üretim doğrulaması gerekir.

Son rapor kısa olsun: görünür değişiklikler, korunan mevcut işlevler, gerçek test sonuçları, önce/sonra görseller, yayın durumu ve varsa bilinen sınırlamalar. Taslak kaybı, hatalı başarı mesajı veya hesaplar arası veri karışması varsa görev tamamlandı deme.
