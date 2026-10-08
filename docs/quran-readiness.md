# Kur’an Kardeşim — test ve yayın hazırlığı

Tarih: 7 Ekim 2026 · Dal: `feature/quran-readiness`

## Durum

Arayüz ve uygulama değişiklikleri bu dalda hazır. **Canlı Supabase kurulumu ve canlı yayın henüz tamamlanmadı.** Kullanıcı `eyuperen5633@gmail.com` hesabının yönetici ve Baş Muallim yapılmasını açıkça onayladı; mevcut oturumda veritabanına yönetici erişimi bulunmuyor. Yerel testte verilen yetki, canlı hesapta verilmiş yetki anlamına gelmez.

Üretim sitesi bu çalışma için değiştirilmedi. Veritabanı adımları doğrulanmadan bu dalı `main` ile birleştirmeyin. Önizlemenin misafir denemesi, gerçek hesap/randevu/veritabanı testi değildir.

## Uygulanan kapsam

- Ana bileşenden `QuranDashboard`, `QuranExercises`, `QuranProgressMap` ve `QuranStudyWorkspace` ayrıldı. Rozet, hoca profili, öğrenci yorumu ve erişilebilir pencere bileşenleri eklendi.
- Zümrüt/krem/altın tasarım; belirgin navigasyon, sade çalışma planı, mobil düzen ve koyu tema. Küçük kutlama animasyonu, puan geçişi ve yeni rozet penceresi; hareket azaltma tercihi desteklenir.
- Dört soru-cevap alıştırması sekiz soru sunar. Üç zorluk seçeneği, karışık şıklar, tek cevap kilidi, cevap açıklaması ve sonuçta konu bazlı analiz bulunur. Ayet sıralama bir kısa surenin bütün ayetlerini kullanır; soru sayısı sureye göre 3–7’dir.
- 114 sure ve gerçek ayet sınırlarına dayanan 30 cüz haritası. Birden fazla cüzde bulunan sureler bölümlenir; ilerleme sıfırlama da kaydedilir. İlerleme kullanıcının beyanıdır, sesli okuma doğrulaması değildir.
- Günlük ayet/dakika hedefi, gerçek kayıtlarla haftalık özet, 1/3/7/21/60 günlük tekrar planı. Her yedi günlük seride bir gün koruma kazanılır; gösterge sınırsız koruma vaat etmez.
- Haftalık sıralama varsayılan kapalıdır. Kullanıcı seçerse rastgele özel bir tohumdan türetilen haftalık anonim adla paylaşılır; e-posta, ad veya kullanıcı kimliği yayımlanmaz.
- Hoca profili, ayrı öğrenci yorumları, haftalık müsaitlik grid’i. Özel ders notları yorum tablosuna taşınmaz. Yorum ancak tamamlanmış kendi dersinden ve açık paylaşım seçimiyle yayımlanır; tekrar kaydetme ile yayından kaldırılabilir.
- Randevu ve akran mesajlaşmasında başarısız gönderim metni silmez. Pencereler mobil alt menünün üstünde açılır; Escape, odak döngüsü ve önceki odağa dönüş desteklenir.
- Misafir Kur’an verisi yalnızca bellekteki Zustand durumundadır; localStorage veya çerezle kalıcılaştırılmaz. Örnek randevular yalnızca açık `pilot=demo` bağlantısındadır; normal misafire sahte randevu, seri veya kazanılmış rozet gösterilmez.

## İçerik doğruluğu ve sınırlar

| İçerik | Banka |
| --- | --- |
| Ayet tamamlama | 34 farklı ayetten üretilen 86 farklı kesme/tamamlama sorusu; 86 farklı ayet değildir |
| Tecvid tanıma | 38 harf birleşimi öğretim sorusu; ayet alıntısı olarak sunulmaz |
| Harf tanıma | 28 harf |
| Meal eşleştirme | 12 kısa özgün Türkçe anlam özeti; belirli bir yayımlanmış mealin alıntısı değildir |
| Ayet sıralama | 7 kısa sure / 34 ayet |

Eski yanlış kalkale ve med açıklamaları düzeltildi. Nûn örneklerinin ayrı kelimeler arasındaki geçişleri anlattığı belirtilir. Cüz 22 başlangıcı 33:31, cüz 25 başlangıcı 41:47 dahil tüm sınırlar Quran.com verisiyle karşılaştırıldı. Harita toplam 6.236 ayeti tam bir kez kapsar.

Hasanat, uygulama içindeki motivasyon puanının mevcut adıdır; dinî sevabın veya kişinin manevî değerinin ölçüsü değildir. Tecvid çoktan seçmeli testleri mahreç/tilavet yeterlilik belgesi vermez. Otomatik ses veya yapay zekâ okuma değerlendirmesi eklenmedi. Nihai eğitim içeriği bir ehil Kur’an öğreticisinin incelemesinden de geçmelidir.

## Araştırmadan yapılan uyarlamalar

“En sevilen özellikler” şeklinde doğrulanmamış bir kullanıcı araştırması iddiası yoktur. Aşağıdaki ürünlerin kendi açıklamalarından tasarım/öğrenme ilkeleri uyarlanmıştır:

- [Quran.com öğrenme planları](https://quran.com/en/product-updates/introducing-learning-plans): küçük ve açık günlük çalışma planı.
- [Duolingo alışkanlık ve seri yaklaşımı](https://blog.duolingo.com/how-duolingo-streak-builds-habit/): tutarlı küçük çalışma, sınırlı seri koruması ve ölçülü kutlama.
- [Tarteel test puanlama açıklaması](https://support.tarteel.ai/en/articles/16565162-how-does-test-scoring-work): sonuç ekranında hataların ve tekrar ihtiyacının anlaşılır olması. Tarteel’in sesli değerlendirmesi bu uygulamada varmış gibi sunulmaz.
- [Ta’limi Board basit tecvid kuralları](https://www.alquranacademy.com/public/quran/tajweed_resources/Simple_Tajweed_Rules_English.pdf): temel harf/kural ayrımlarının kontrolü.
- [Quran.com cüz verisi](https://api.quran.com/api/v4/juzs): 30 cüzün ayet sınırlarının doğrulanması.

## Doğrulama

- Üretim derlemesi ve TypeScript: geçti.
- Değişen uygulama ve tarayıcı test dosyalarında ESLint: 0 hata, 0 uyarı.
- Birim testleri: 46/46 geçti.
- Masaüstü/telefon tarayıcı testleri: 28/28 geçti; ayet sıralama, yanlış ayetlerden tekrar oluşturma ve tekrar tarihinin ilerlemesi dahil. Son görsel düzeltmeden sonra dört ana sayfa/koyu tema senaryosu yeniden geçti; özet kartlarının gerçek yazı kontrastı en az 4,5:1 olarak kontrol edildi.
- Yalıtılmış PostgreSQL/PGlite denemesi: 031/032/033 sıralı iki kez uygulanabildi. Yetki bootstrap’ı, cevap anahtarı doğrulama, aynı sonucun tekrar gönderilmesinde tek ödül, kullanıcı izolasyonu, doğrudan puan/seri yazma yasağı, yönetici rolünü izinsiz alamama, opt-in sıralama ve özel/paylaşılan öğrenci yorumu kontrolleri geçti.

Tarayıcı testleri geliştirme ortamında mevcut DEV misafir girişini kullanır. Üretime yeni bir kimlik doğrulama atlatması eklenmez. PGlite testi, sınırlı önkoşul şeması üzerinde gerçek PostgreSQL kurallarını çalıştırır; bütün Supabase servislerini, gerçek oturumları, Realtime veya canlı tablolardaki eski verileri doğrulamaz.

Yerel tekrar çalıştırma:

```powershell
npm run build
npm run test:unit
$env:SAH_E2E_PORT='3014'
$env:PW_USE_SYSTEM_CHROME='1'
npx playwright test tests/e2e/quran-readiness.spec.ts tests/e2e/quran-pilot.spec.ts tests/e2e/daily-navigation.spec.ts tests/e2e/responsive-sections.spec.ts --workers=1
```

Yalıtılmış veritabanı testi isteğe bağlıdır; üretim bağlantısı kullanmaz. Geçici bağımlılık repo dışında tutulur:

```powershell
$quranTestRuntime=Join-Path ([System.IO.Path]::GetTempPath()) 'sah-quran-pglite'
npm install --prefix $quranTestRuntime --no-save @electric-sql/pglite
$env:QURAN_PGLITE_ROOT=$quranTestRuntime
node scripts/test-quran-database.cjs
```

## Canlı yayın kapısı — henüz yapılmadı

Görsel kanıtlar: [masaüstü](validation/quran/readiness-desktop-2026-10-07.png), [telefon](validation/quran/readiness-mobile-2026-10-07.png), [koyu tema](validation/quran/readiness-dark-mobile-2026-10-07.png). Bunlar yerel misafir denemesidir.

1. Supabase’de yetkili oturumu açın; şifre, OTP, service-role key veya veritabanı bağlantı bilgisini sohbet/GitHub’a koymayın. Önce mevcut şema, migration geçmişi ve yedek durumunu kontrol edin. Temel Kur’an şeması (022 ve mevcut önkoşullar) bulunmalıdır.
2. Kontrollü yayın penceresinde **031 → 032 → 033** sırasını uygulayın. 031’in trigger/policy tanımları tekrarlanabilir hale getirildi; 032 skor/ödül yazmalarını tek sunucu işlemine kapatır; 033 cevap anahtarlarını yükler. **032’den sonra 031’i tek başına tekrar çalıştırmayın**: eski yazma izinlerini yeniden açar. 032/033 başarılı olmadan kullanıcı alıştırma kayıtlarını açmayın.
3. Hedef hesabın profilde `admin`, hoca profilinde `Baş Muallim` olduğunu ve “Hoca yönetimi” sekmesinin sadece uygun rollerce görülebildiğini gerçek oturumla doğrulayın. Bootstrap hesabı yoksa migration sessizce atlar; yeni hesap açılması otomatik olarak yetki vermiş olmaz.
4. İki ayrı gerçek kullanıcıyla sonuç kaydı/tekrar gönderim, RLS izolasyonu, puan/seri, gerçek randevu, ders notu, yorum paylaşımını açma/kapatma ve takvim işlemlerini test edin. Misafir veya pilot sonucu canlı test diye işaretlemeyin.
5. Önizleme doğrulamasından sonra PR’ı `main` ile birleştirin. Vercel’de doğru commit’in Production/Ready olduğunu kontrol edin; alan adı üzerinde yeni `data-quran-ready="learning-v3"` ekranını ve gerçek kayıtları yeniden test edin. Eski açık tarayıcı sekmeleri yeni kayıt sözleşmesi için yenilenmelidir.

032, eski istemcilerin doğrudan sonuç/puan yazmasını artık kabul etmez. Bu nedenle şema değişikliği ile yeni istemci yayını birlikte planlanmalıdır; eski istemciye tek başına geri dönmek tam geri alma değildir. Sorunda yeni kayıtları durdurup ileri düzeltme tercih edin; kullanıcı tablolarını silmeyin. Özel ders notlarının ve geçmiş sonuçların korunmasını ayrıca doğrulayın.

Bekleyenler: canlı migration’lar, gerçek hesap yetkisi, canlı RLS/randevu/yorum testleri, üretim yayını, eğitim içeriğinin uzman son incelemesi.
