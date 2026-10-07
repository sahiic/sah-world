# SAH World Günlük — araştırma ve yeniden tasarım kararı

Araştırma tarihi: 7 Ekim 2026.

## Sonuç

Günlük için önerilen yön, daha fazla kart ve özellik eklemek değil; mevcut yazma deneyimini görünür, anlaşılır ve güvenilir hale getirmektir. Ana ekran bir tanıtım sayfası veya istatistik panosu değil, kişisel yazı alanı olmalıdır.

Önerilen ana yapı: **Yaz / Geçmiş**, yanında küçük bir **Araçlar** menüsü. Sabah–akşam seçimi ve tarih kompakt bir satırda; duygu seçimi ve yazı alanı hemen altında. Niyet, şükür, günün anları ve kendine not gibi derinleşme alanları ihtiyaç halinde açılır. Öncelik Matrisim, Şükür Defterim ve Hatalar ve Dersler silinmez; Araçlar üzerinden mevcut işlevleriyle erişilebilir.

## Yöntem ve sınırlar

- Rakip özellikleri, ürünlerin resmi özellik ve yardım sayfalarından araştırıldı. Bunlar bağımsız kullanıcı memnuniyeti sıralaması değildir; “en sevilen özellik” veya “dünyanın en iyi uygulaması” gibi bir sıralama kanıtlanmış değildir.
- SAH değerlendirmesi kullanıcının Günlük ekran görüntüsü ve yerel kaynak kodu incelemesine dayanır. Canlı üretim sürümünün bütün davranışlarının aynı olduğu bu araştırmada ayrıca doğrulanmadı.
- Rakipler ücretli/ücretsiz sürüm ve platforma göre farklı özellikler sunabilir. Burada fiyat veya her platformda bulunabilirlik karşılaştırması yapılmadı.
- Aşağıdaki tasarım kararları, kaynaklarda anlatılan özelliklerden ve SAH incelemesinden çıkarılan ürün önerileridir; ölçülmüş bir kullanıcı testi sonucu değildir.

## Resmi kaynaklara dayanan karşılaştırma

| Uygulama | Belgelenen ilgili özellikler | SAH'taki karşılığı/farkı | Uyarlanacak karar |
| --- | --- | --- | --- |
| Day One | Metin biçimlendirme, yazı şablonları, takvim, etiket ve arama filtreleri, eski anıları yeniden bulma. | SAH'ta yazma, tarih seçimi ve anı kartları var; ancak kapsamlı günlük arşivi görünümü belirgin değil. | Yazı alanını birincil yap; geçmişi arama ve takvimle bulunabilir hale getir. |
| Daylio | Duygu ve etkinlik seçimiyle hızlı kayıt; isteğe bağlı notlar; liste/takvim ve arama. | SAH zaten duygu + bir cümle içeren Hızlı Kayıt sunuyor; bu akış büyük seçim kartlarının altında kalıyor. | Yeni bir duygu sistemi icat etme; mevcut hızlı kaydı ilk ekrana taşı. |
| Stoic | Sabah/akşam değerlendirmeleri, yazmaya yardımcı sorular, temalı rehberli günlükler ve geçmiş. | SAH'ta Sabah Niyeti ve Akşam Muhasebesi zaten var. | Ritüelleri koru; soruları isteğe bağlı ve kısa göster, formu zorunlu bir sınava dönüştürme. |
| Journey | Zaman akışı/takvim, duygu ve etiketler, arama/filtreleme, özel şablonlar. | SAH'ta tarih üzerinden okumak mümkün; birden fazla eski kaydı karşılaştırıp bulma akışı zayıf. | Arşiv listesi ve sade tarih/ritüel filtreleri ekle. |
| Diarium | Takvim/zaman akışı, anahtar kelime ve etiket araması, şablonlar, farklı biçimlerde dışa aktarma. | SAH'ın uygulama içi gün izi bağlantıları güçlü; günlük metni yanında gürültülü olmamalı. | Gün izini katlanabilir bağlam yap; dışa aktarmayı sonraki aşama olarak ele al. |

Kaynaklar: [Day One özellikleri](https://dayoneapp.com/features/), [Daylio resmi sitesi](https://daylio.net/), [Stoic özellikleri](https://www.getstoic.com/features), [Journey yardım sayfası](https://support.journey.cloud/en/categories/journey-basics/articles/what-is-journey), [Diarium özellikleri](https://diariumapp.com/en).

Bu ürünlerden arayüz veya marka kopyalamak değil, yazmaya başlama ve yazıya geri dönme akışlarını öğrenmek gerekir. Fotoğraf, harita, ses kaydı ve gelişmiş analiz gibi bütün rakip özelliklerini aynı anda eklemek, SAH'ta çözmek istediğimiz karmaşayı artırır.

## SAH'ın mevcut güçlü tarafları

Kaynaklar: `src/components/core/JournalHubView.tsx`, `src/components/core/JournalNotebook.tsx`, `src/lib/debouncedDrafts.ts`, `src/lib/journalOutbox.ts`, `src/types/index.ts`.

1. Sabah niyeti ve akşam muhasebesi ürünün kimliğine uygun ve birbirinden ayrı tutuluyor.
2. Hızlı ve detaylı yazma seçenekleri mevcut; son seçilen mod hatırlanıyor.
3. Ruh hali, enerji, stres ve uyku alanları mevcut. Bunları yeniden geliştirmek gerekmiyor.
4. Taslaklar kullanıcı, tarih ve ritüel bazında cihazda saklanıyor; sayfadan ayrılma gibi durumlarda bekleyen değişiklikler yazılmaya çalışılıyor.
5. Sunucu kayıtları için bekleyen gönderim kuyruğu ve kayıt durumları mevcut. Çevrimdışı taslak ile sunucuya kaydedilmiş veri aynı şey değil.
6. Günün gerçek uygulama etkinlikleri ve geçmiş anılar günlükle ilişkilendiriliyor.
7. Geçmiş günler mevcut ürün kuralı gereği salt okunur; bugün düzenlenebilir.
8. Akşam şükürleri ayrı şükür alanıyla ilişkilendiriliyor; tekrar kaydetmede XH artışının hesaplanması için mevcut kurallar bulunuyor.

## Asıl sorunlar ve çözüm

### 1. Yazıya başlamak için fazla görsel engel var

Ekran görüntüsünde Günlük başlığı, dört büyük sekme, ikinci büyük başlık içeren hero, tarih kartı ve durum bandı yazı alanından önce geliyor. İncelenen CSS'te hero en az 270 px, başlığı 62 px'e kadar; ritüel kartları en az 92 px. Defter gövdesinin yüksekliği de sabit bir alt sınıra bağlanmış. Kullanıcı ekranı açınca yazı alanını değil sayfanın tanıtımını görüyor.

Çözüm: Tek H1; küçük tarih/ritüel çubuğu; büyük hero, defter halkaları ve dekoratif sayfa çevirme etkisi kaldırılmalı. Ana metin alanı ilk ekranda görünmeli. Fotoğraf/video arka planı bu sayfaya taşınmamalı: Focus için uygun olan atmosfer, metin ağırlıklı günlükte okunabilirliği azaltabilir.

### 2. Birden fazla kullanım amacı aynı görsel ağırlıkta

Günlük yazmak, öncelik matrisi kullanmak, şükür eklemek ve ders kaydetmek ayrı veri/iş akışları. Hepsinin sürekli büyük sekme kartları olarak gösterilmesi yazmaya başlama kararını geciktiriyor.

Çözüm: Günlükte Yaz/Geçmiş ana yönü; diğer üç alan Araçlar menüsünde. Eski bağlantılar çalışmaya devam etmeli. Araçlara geçiş yazılmamış taslağı kaybettirmemeli. Şükür ve ders kayıtları tek serbest metne dönüştürülmemeli.

### 3. Hızlı ve detaylı akış iki ayrı büyük giriş gibi

Mevcut hızlı kayıt aslında ihtiyaç duyulan sade deneyimi sağlıyor. Sorun sunumu. İki büyük seçim kartı yerine kompakt bir Hızlı/Detaylı kontrolü yeterli.

Çözüm: Yeni kullanıcı için mevcut hızlı varsayılan; hatırlanan mod korunur. Mod değiştirme hiçbir alanı temizlememeli. Detaylı moddaki niyet, zorluk, anlar, şükür ve kendine not alanları açılabilir bölümler halinde sunulmalı. Mevcut zorunlu alan kuralları değişmemeli.

### 4. Geçmişi bulmak birinci sınıf bir işlev değil

Tarih seçimi ve anı kartları var; fakat görünür bir günlük arşivi, kayıt araması ve filtreleri aynı netlikte yok.

Çözüm: Geçmişte tarih sıralı liste, küçük bir takvim, tarih aralığı ve sabah/akşam filtresi. Arama gerçekten içerik, niyet, kendine not, şükür ve an alanlarını aramalı. Boş sonuç ile henüz yüklenmemiş veya yalnızca kısmen yüklenmiş geçmiş farklı gösterilmeli.

### 5. Kayıt ve mahremiyet metni daha kesin olmalı

Taslağın cihazda korunması, gönderim kuyruğuna alınması ve sunucu tarafından onaylanması farklı durumlar. “Kaydedildi” metni yalnızca doğru aşamada kullanılmalı. Görünür mahremiyet metni tek başına uçtan uca şifreleme veya sunucu işletmecisinin erişememesi anlamına gelmez.

Çözüm: Kısa, doğru durum göstergeleri; depolama hatasında kalıcı uyarı ve metni kopyalama imkanı. Güvenlik mimarisi doğrulanmadan kesin mahremiyet/şifreleme vaatleri eklenmemeli. Kullanıcı metni analitik/log/üçüncü taraf yapay zekaya gönderilmemeli.

### 6. Mikro yazılar ve kayan kayıt çubuğu

Bazı mevcut yardımcı metinler 7–9 px; bu bir erişilebilirlik riski, bu araştırmada ölçülmüş kontrast ihlali iddiası değildir. Ekran görüntüsündeki kayıt çubuğu içerik üzerine yerleşiyor.

Çözüm: Ana yazı 16–18 px, yardımcı metin en az 12–13 px. Kontrast test edilsin. Masaüstünde kayıt eylemi editörün altında; mobilde gerekirse kısa sabit çubuk ama alt menü, güvenli alan ve sanal klavye hesaba katılarak içerik tamamen erişilebilir kalsın.

## Önerilen kapsam

### İlk sürüm: gerçekten uygulanacak

- Editör merkezli tek sütun.
- Yaz/Geçmiş ve kompakt Araçlar.
- Tarih, Sabah/Akşam ve Hızlı/Detaylı kontrollerinin sadeleştirilmesi.
- Mevcut alanların kayıpsız, aşamalı açılan sunumu.
- İşlevsel geçmiş listesi, arama, tarih ve ritüel filtresi.
- Gerçek kayıt durumları ve taslak güvenilirliği.
- Mobil/klavye/erişilebilirlik kontrolleri.
- Gün izi ve geçmiş anıların ikincil, sakin sunumu.

### Sonraki aşama: ayrıca kapsamlandırılacak

- Etiket düzenleme: modelde etiket bulunması yeterli değil; taslak ve gönderim akışı da kapsanmalı.
- Kullanıcının kendi verisini dışa aktarması.
- İzinli hatırlatıcılar.
- Gerçek ve açıkça kullanıcı tarafından girilmiş verilere dayanan duygu eğilimleri.
- Şablon tercihleri ve erişilebilir kişiselleştirme.

Varsayılan ruh hali/enerji değerleri gerçek kullanıcı ölçümü değildir. Sonraki analiz sürümü için ölçümün kullanıcı tarafından seçildiğini gösteren veri bilgisi ve eski verilerin nasıl ele alınacağı tasarlanmalıdır. Yalnızca sayı bulunması bir duygu grafiği için yeterli kanıt değildir. Manevi davranışlarla ruh hali arasında neden–sonuç veya klinik yorum yapılmamalıdır.

### Bu işin dışında

Yeni sosyal paylaşım, zorunlu yapay zeka analizi, sağlık teşhisi, medya bulutu, tüm uygulamanın yeniden yazılması, eski kayıtların silinmesi, yeni ödül ekonomisi, altyapı/hesap transferi.

## Başarı ölçümü

- Yeni kullanıcı yazmaya başlamadan önce mod seçim ekranı veya açılır pencereyle engellenmez.
- Ana yazı alanı, uygulama üst çubuğu dahil 1440×900 masaüstü ve 390×844 mobil ilk görünümünde belirgindir.
- Bir kısa günlük yazıp kaydetmek mevcut minimum metin kuralıyla mümkündür; zorunlu duygu değerlendirmesi veya üç şükür doldurma şartı eklenmez.
- Sabah/akşam, tarih, mod, araç ve sayfa değiştirildiğinde son karakter dahil taslak korunur.
- Kullanıcı hesabı değişince başka hesabın taslağı veya kayıt kuyruğu gösterilmez/gönderilmez.
- Geçmiş araması ve filtreleri gerçek kayıtlarla çalışır; sahte veri yoktur.
- Tekrar kaydetme, taslak koruma veya görünüm değiştirme yeni XH/şükür kaydı üretmez.
- Depolama/ağ hataları başarı olarak gösterilmez.
- Diğer modüllerin tasarım ve davranışları değişmez.
- Uygulama yapılırken önce/sonra ekran görüntüleri ve çalıştırılan testlerin gerçek sonuçları sunulur; yerel önizleme canlı yayın diye sunulmaz.

Uygulama için hazır ayrıntılı talimat: [journal-redesign-prompt.md](./journal-redesign-prompt.md).
