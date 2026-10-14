# SAH World — kanıta dayalı yol haritası

13 Ekim 2026. Dayanak: [denetim](SITE_AUDIT_REPORT.md) ve [karşılaştırma](VISUAL_COMPARISON.md). Süreler 1 geliştirici + yarı zamanlı tasarım/QA için tahmini çalışma pencereleridir; taahhüt değildir. Fazlar sıralı uygulanırsa toplam yaklaşık 10–15 hafta; ölçüm ve bağımlılıklar sonrası yeniden tahmin edilir. Yeni dosyalar “yeni” olarak işaretlidir. Her aksiyon ayrı `feature/...` dalı ve PR; main'e doğrudan push yok.

## Faz A — temel güvenilirlik (1–2 hafta)

| ID / aksiyon | Etkilenen dosyalar | Zorluk | Etki | Öncelik | Kabul kriteri |
|---|---|---|---|---|---|
| A1 Güvenlik başlıkları | `next.config.ts`, `src/proxy.ts`, yeni header testi | Orta | Yüksek | P1 | Report-Only CSP ile başla; auth/ses/görsel bozulmadan CSP, nosniff, referrer/frame politikası doğrulansın |
| A2 Meslek sunucu kuralları | yeni `supabase/migrations/<next>_profession_progress_guard.sql`, `011` referans olarak, `scripts/test-profession-database.cjs` | Orta | Yüksek | P1 | Sıra atlama/doğrudan ilerleme yazımı reddi; kendi reflection düzenlemesi gerekiyorsa ayrı RPC; çift çağrıda tek XP; mevcut kayıtlar korunur |
| A3 İçerik/yayın parity | `src/components/profession/professionData.ts`, yeni salt-okunur release kontrol scripti | Orta | Yüksek | P1 | 10 yol/80 ders ve katalog sürümü kontrolü; seed eksikliğinde sahte başarı yok |
| A4 Performans baseline | `src/app/layout.tsx`, `package.json`, yeni izole performans testi ve CI bütçesi | Orta | Yüksek | P1 | Aynı SHA için 5 soğuk ölçüm; FCP/LCP/CLS ve gzip rota boyutu, koşullar ve dağılım kaydedilir; INP RUM ayrı |
| A5 CSS bölme | `src/app/globals.css`, `quality.css`, yeni `focus.css`/shell modül dosyaları | Zor | Yüksek | P1 | Selector/cascade envanteri; tüm modal/light/dark durumlarında görsel regresyon; gzip farkı ölçülür |
| A6 Dokunma ve klavye | `src/app/quality.css`, `src/components/core/SahApp.tsx`, `FocusTimerView.tsx` | Kolay | Orta | P2 | Ürün hedefi 44×44; Tab/Enter/Escape, görünür focus ve modal dönüş odağı; 320–1920 matrisi |
| A7 Koyu tema yüzeyleri | `quality.css`, `profession-school.css`, `journal.css` | Orta | Orta | P2 | Hesap kartı/surface token tutarlılığı; metin ≥4,5:1, büyük metin ≥3:1; gradient üzerinde gerçek renk ölçümü |

**Çıkış kapısı:** A1–A3 staging'de negatif testleri geçmeden daha fazla XP/sertifika özelliği yayınlanmaz. P0 bulunursa sıranın önüne alınır. Migration onayı, yedek/geri dönüş planı ve salt-okunur doğrulama olmadan üretim uygulanmaz; geçmiş migration dosyaları yeniden yazılmaz.

## Faz B — kullanıcı deneyimi (2–3 hafta)

| ID / aksiyon | Etkilenen dosyalar | Zorluk | Etki | Öncelik | Kabul kriteri |
|---|---|---|---|---|---|
| B1 Mevcut onboarding'i ölç | `src/components/core/WelcomeGuide.tsx`, `src/lib/onboarding.ts` | Orta | Yüksek | P2 | İlk niyet→ilk kayıt yolu 3 net eylem; tekrar açma; yalnız anonim/sınırlı funnel ölçümü, günlük içeriği analitiğe gitmez |
| B2 Ana ekran eylem hiyerarşisi | `src/components/core/DashboardView.tsx`, `src/components/core/GrowthScene.tsx` | Orta | Yüksek | P2 | 375px'te tek bir ana eylem ilk viewport'ta; ağaç ikincil ama erişilebilir; 5 kullanıcı görev testinde süre karşılaştırması |
| B3 Hata/boş/skeleton sözleşmesi | `SectionErrorBoundary.tsx`, `professionData.ts`, `useQuranCompanion.ts` | Orta | Yüksek | P1 | 401/403/500/offline/empty farklı mesaj; retry aynı kaydı iki kez üretmez; özel veri eski hesapta kalmaz |
| B4 Font ve ikon teslimi | `src/app/layout.tsx`, `src/components/ui/AppIcon.tsx` | Orta | Orta | P2 | CDN kapalıyken temel eylem anlaşılır; Türkçe/Arabî karakterler; font değişiminde CLS ölçümü |
| B5 Metin yazma güveni | `JournalHubView.tsx`, `src/lib/journalOutbox.ts`, `tests/e2e/journal-drafts.spec.ts` | Orta | Yüksek | P1 | “Cihazda/Bekliyor/Kaydedildi” ayrımı; offline→online ve token expiry staging testi; uzun metin taşmaz |
| B6 Ölçülmüş render optimizasyonu | `SahApp.tsx:116`, `src/store/useJourneyStore.ts`, `ReportsView.tsx` | Orta | Orta | P2 | Selector öncesi/sonrası aynı Profiler senaryosu; unrelated store değişiminde ana kabuk render azalır; sayısal sonuç raporlanır |

**Çıkış kapısı:** boş/hata/yükleme durumları için snapshot; reduced-motion + keyboard testleri; gerçek screen reader smoke (NVDA/VoiceOver), iOS/Android en az birer cihaz. UI ölçümleri sentetik test kullanıcılarıyla yapılır.

## Faz C — öğrenci odaklı ürün (3–4 hafta)

| ID / aksiyon | Etkilenen dosyalar | Zorluk | Etki | Öncelik | Kabul kriteri |
|---|---|---|---|---|---|
| C1 Ders programı | yeni `src/lib/studySchedule.ts`, yeni program UI, yeni kullanıcıya özel migration | Zor | Orta | P2 | Önce manuel/ICS içe aktarma; Europe/Istanbul ve DST senaryoları; yinelenen ders tek kayıt; takvim erişimi opt-in |
| C2 Mevcut odak sistemini bağla | `src/app/focus/components/FocusExperience.tsx`, `SessionConfig.tsx`, `src/components/core/FocusTimerRoot.tsx` | Orta | Yüksek | P2 | Planlı ders→odak tek eylem; ana sayfa mini sayaç; sekme yenileme/arka plan/iki sekme testleri; ikinci timer store yok |
| C3 Konu/not bağlantısı | `JournalHubView.tsx`, `src/components/profession/ProfessionLessonReader.tsx`, yeni ilişki tipi/migration | Orta | Orta | P2 | Özet ve ders notunu etiketle, aramadan geri aç; private not karşı tarafa otomatik paylaşılmaz |
| C4 Birlikte çalışma | `CommunityView.tsx`, `src/components/quran/useQuranCompanion.ts`, yeni davet/oturum modeli | Zor | Orta | P3 | Mevcut akran sistemini kullan; davet reddi/engelleme/ayrılma; başka kullanıcı oturum verisi RLS ile kapalı |
| C5 Haftalık/aylık rapor | `ReportsView.tsx`, `src/components/ui/WeeklySummaryCard.tsx`, `src/lib/activity.ts` | Orta | Yüksek | P2 | Haftalık raporu yeniden yapma; aylık aralık ve ders/odak ilişkisi ekle; ay sonu/zaman dilimi/tekrar event testleri |
| C6 Günlük ders önerisi yayın kabulü | PR98: `src/lib/professionSchool.ts`, `DailyLessonCard.tsx`, `useProfessionRecommendation.ts` | Kolay | Orta | P2 | PR98'i tekrar yazma; en az ilerlenen yol, logout/stale-response, dashboard→okul akışını doğrula |

**Çıkış kapısı:** kayıt doğruluğu ve erişim sınırları önce; seri uzatma/XP toplama değil, tamamlanan çalışma hedefi ve geri dönüp öğrenme ölçülür.

## Faz D — farklılaşma (4–6 hafta, küçük pilotlarla)

| ID / aksiyon | Etkilenen dosyalar | Zorluk | Etki | Öncelik | Kabul kriteri |
|---|---|---|---|---|---|
| D1 Aralıklı tekrar | yeni `src/lib/reviewScheduler.ts`, yeni review UI/RPC/migration, `professionSchool.ts` | Zor | Yüksek | P2 | 1 meslek yolu pilotu; due_at saat dilimi güvenli; aynı güne çift review yok; 7/30 gün hatırlama metriği |
| D2 Açıklanabilir kişiselleştirme | mevcut öneri fonksiyonu + yeni server-only recommendation servisi | Zor | Orta | P3 | Önce kural tabanı; AI ancak karşılaştırmalı kazanç varsa; “neden önerildi”; özel günlük için ayrı rıza ve veri minimizasyonu |
| D3 Sesli içerik | `AmbientSoundMixer.tsx`, `src/lib/ambientEngine.ts`, yeni lisanslı içerik kataloğu | Orta | Orta | P3 | Lisans, transkript, indirme boyutu, oynatma hatası; otomatik oynatma yok; dinî metin insan doğrulamalı |
| D4 Offline/PWA | `src/app/manifest.ts`, yeni service worker ve cache version politikası, `journalOutbox.ts` | Zor | Yüksek | P2 | Shell offline açılır; özel API yanıtı ortak cache'e yazılmaz; logout cache temizliği; update/çatışma kurtarma testi |
| D5 Push stratejisi | yeni subscription endpoint/RLS, `AccountSettingsDialog.tsx`, tercih modeli | Zor | Orta | P3 | Kullanıcı tetiklemeli izin, sessiz saatler, kolay iptal, günde üst sınır; gerçek push ile açık sayfa Notification API ayrımı |
| D6 Sesli Kur'an pilotu | Quran alıştırma alanı + yeni server-only ses değerlendirme sınırı | Zor | Belirsiz | P3 | İsteğe bağlı ses rızası/silme süresi, belirsizliği gösteren sonuç, insan denetimi; doğruluk ölçülmeden genel yayına çıkmaz |

## Yayın ve doğrulama disiplini

1. Her PR: küçük kapsam, risk/geri dönüş notu, ilgili unit/UI/SQL negatif testleri.
2. Test/build sonucunu ilgili commit ile kaydet; önceki branch testini yeni branch sonucu diye kullanma.
3. PR önizlemesi, main deployment ve production domain ayrı durumlar; “canlı” ancak doğru SHA/domain kontrolünden sonra söylenir.
4. DB migration + frontend sırası uyumlu olmalı. Şema değişimi önce geriye uyumlu; kullanıcı verisini silen kestirme yok.
5. RUM kişisel günlük, ayet notu, mesaj veya kimlik bilgisi toplamamalı; hata logları redakte edilmeli.
6. Her faz sonunda bu üç rapor güncellenir; çözülen bulguya PR, commit ve test kanıtı eklenir.

**İlk sprint önerisi:** A1, A2, A3, A4. Bunlar tamamlanmadan AI veya yeni animasyonlarla kapsam büyütmeyin. Onboarding, pomodoro, reflection ve haftalık rapor zaten mevcut: hedef yeniden üretmek değil, mevcut akışı ölçüp sağlamlaştırmak.
