# SAH World — ürün ve görsel karşılaştırma

13 Ekim 2026. SAH kaynak tabanı `4a41be5`; canlı ana sayfa, odak ve Meslek Okulu gözlemleri. Rakipler aynı cihazda uçtan uca denenmedi; aşağıdaki özellikler resmi ürün sayfaları/dokümantasyonundan, SAH önerileri ise tasarım değerlendirmesinden gelir. “Dünya standardı” burada seçilmiş iyi örnektir, nesnel dünya sıralaması değildir.

## Karşılaştırma matrisi

| Alan / örnek | Rakip ne yapıyor? | SAH şu an | Fark | Somut aksiyon / öncelik |
|---|---|---|---|---|
| Ders yolu — [Duolingo](https://blog.duolingo.com/new-duolingo-home-screen-design/) | Sıralı öğrenme yoluna tekrar yerleştiriyor | 8 adımlı meslek yolu, kilitler, XH, sertifika var | Ders bitirmek ile hatırlamak ayrı ölçülmüyor | Ders sonunda 1 hatırlama sorusu, 1/3/7 gün geri çağırma kuyruğu; önce RPC sıra koruması. P1 güvenilirlik, P2 öğrenme |
| Seri — [Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) | Seriyle günlük alışkanlık döngüsünü görünür kılıyor | Günlük seri, haftalık özet, gelişim ağacı var | Sorun animasyon yokluğu değil, birden fazla yerde benzer metrikler | Tek “bugünün küçük adımı” + haftalık 7 hücre; suçluluk dili kullanmadan ara verme/geri dönüş. P2 |
| Çalışma alanı — [Notion](https://www.notion.com/product) | Bilgiyi toplama ve bulmayı ortak workspace'te birleştiriyor | Günlük, matris, meslek ve Kur'an ayrı modüller; global arama var | Modüller arasında niyet/çalışma konusu ilişkisi zayıf | İsteğe bağlı ortak konu etiketi; mevcut global arama sonucundan kayda doğrudan git. P2 |
| Kartla öğrenme — [Quizlet öğretmen rehberi](https://quizlet.com/static/pdf/The-Teachers-Guide-to-Quizlet.pdf) | Flashcard merkezli öğrenme araçları | Kur'an alıştırmaları ve farkındalık testleri var | Genel ders notundan tekrar kartı oluşturma doğrulanmadı | Önce tek meslek dersi pilotu: soru→cevabı göster→öz değerlendirme; AI üretimini zorunlu kılma. P2 |
| Aralıklı tekrar — [Anki](https://docs.ankiweb.net/deck-options) | FSRS dahil planlama seçenekleri | Meslek tamamlanma kaydı var; zamanlanmış tekrar motoru bulunmadı | Tamamlanan bilgiye dönüş yolu eksik | user_review_cards + due_at + zaman dilimi güvenli scheduler; FSRS'yi kendi “zeki” takviminden önce değerlendir. P2 |
| Sakin rehberlik — [Headspace](https://www.headspace.com/) | Rehberli kurs, uyku/mindfulness içerikleri | Odakta ses karışımı ve görsel manzara var | Ortam sesi ile rehberli içerik aynı değil | Lisanslı 2 dakikalık oturum başlangıcı isteğe bağlı olsun; otomatik ses başlatma yok. P3 |
| Ses deneyimi — [Calm](https://www.calm.com/) | Günlük içerik, rehberli oturumlar ve soundscape | Odakta çoklu ses, arka plan, süre, geçmiş var | Daha fazla kontrol eklemek sakinliği azaltabilir | 3 kayıtlı karışım + erişilebilir mixer; diğer ayarlar tek modalda. Mevcut odak arayüzünü yeniden yazma. P2 |
| Oyunlaştırma — [Habitica](https://habitica.com/) | Alışkanlık/günlük görev, avatar ve ödüller | XH, rozet, ağaç, günlük görevler mevcut | Daha çok puan öğrenme kalitesini garanti etmiyor | Aynı eylem tek XP kaynağı; grup hedefi opt-in; manevî üstünlük sıralaması yapma. P1 veri, P3 grup deneyi |
| Görev yakalama — [Todoist](https://www.todoist.com/features) | Doğal dil Quick Add, tekrarlı tarihler | Hızlı niyet ve matris var | Türkçe tarih/tekrar yakalama doğrulanmadı | “Yarın 18:00” parser'ı önce onay çipiyle sun; belirsiz tarihleri sessiz kaydetme. P2 |
| Yazma — [Day One](https://dayoneapp.com/features/) | Rich text, görsel, etiket/arama, şablon, şifreleme | Günlük taslak/outbox ve kayıt akışı var | Multimedya ve uçtan uca şifreleme aynı seviyede doğrulanmadı | Önce yazma/kaydetme durumunu sadeleştir; sonra özel storage + boyut/MIME denetimli fotoğraf. RLS'yi E2EE diye sunma. P1 kayıt, P3 medya |
| Günlük ibadet — [Muslim Pro](https://www.muslimpro.com/) | Vakit, kıble, Kur'an ve kişiselleştirilen araçlar | Mescidim/PrayerTimes, dua/esma alanları var | Doğru lokasyon/yöntem ve hata açıklaması görsel yenilikten daha önemli | Hesaplama yöntemi ve konumun yanına kaynak/güncellik; izin verilmezse şehir seç. P1 |
| Okuma — [Quran.com](https://quran.com/) | Sure/ayet arama, okuma, dinleme ve hedefler | Kur'an okuyucu, notlar, alıştırma/öğretmen alanı var | Bir ekran hem okuma hem sosyal keşfi taşımamalı | “Kaldığım ayet”i tek ana eylem yap; öğretmen/akranı ikincil bölgeye taşı. P2 |
| Sesli pratik — [Tarteel](https://tarteel.ai/blog/so-youve-made-a-mistake-now-what/) | Ezber hatası algılama özelliği | İnsan destekli Kur'an eşleşmesi ve alıştırmalar var | Üretim kalitesinde otomatik okuma değerlendirmesi doğrulanmadı | Önce gönüllü pilot, ses saklama onayı, hata belirsizliği ve insan kontrolü; “tecvidi kesin değerlendirir” iddiası yok. P3 |

## Görsel aksiyon tablosu

| Alan | SAH şu an | Hedef örüntü | Fark | Aksiyon |
|---|---|---|---|---|
| Onboarding | `WelcomeGuide.tsx` mevcut | Kısa, tekrar açılabilir ilk değer deneyimi | Yok değil; tamamlanma ölçümü eksik | Var olan akışın terk noktalarını ölç. P2 |
| Ana sayfa | Büyük gelişim sahnesi ve aşağıda çoklu özet | Tek baskın eylem, ikincil ilerleme | Mobilde hızlı eyleme ulaşmak uzun | Hızlı eylemleri sahnenin önüne almayı kullanıcı testiyle karşılaştır. P2 |
| Focus | Ortalanmış sayaç, gerçek arka plan, 3 ayar kartı | Sakin, az kontrol, güçlü okunabilirlik | Görsel üzerinde küçük yardımcı metin | 14px yardımcı metin ve arka plan overlay kontrast testi. P2 |
| Dokunma | Bazı 25–42px yüksek hedefler | Ürünün 44×44 hedefi | Küçük hedefler | `quality.css` ortak hit-area; mobil ve desktop test. P2 |
| Dark mode | Modüller koyu, hesap kartı açık | Tutarlı surface katmanları | Renk dili ayrışıyor | Aynı token seti, light/dark görsel regresyon. P2 |
| Ders yolu | Ayrı modüller, reflection, sertifika | Tek aktif adım + kalıcı öğrenme | Sunucu sıra koruması ve tekrar eksik | Önce RPC, sonra tekrar kuyruğu. P1→P2 |
| Veri yükleme | Skeleton ve SectionErrorBoundary var | Boş/hata/yükleme ayrımı | Katalog fallback'i hata saklayabilir | İçerik sürümü kontrolü + retry. P1 |
| İkonlar | Tabler CDN webfont | Kritik eylem ikon kaybında da anlaşılır | Font bağımlılığı | Yerel/sınırlı ikon seti; birincil eylemde kısa metin. P2 |

Kaynaklar 13 Ekim 2026 tarihinde okundu. Rakip abonelik fiyatları, kullanıcı sayıları ve pazarlama başarı iddiaları kıyas puanı olarak kullanılmadı. Quizlet ürün sayfası 403 döndürdüğü için resmi öğretmen rehberi esas alındı. Görsel değerlendirme rakiplerin piksel kopyası değil, SAH'ın mevcut bileşenleri için uyarlama önerisidir.
