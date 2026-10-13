# A1 / parça 1 — HTTP güvenlik başlıkları

Kapsam: uygulama görünümü, kullanıcı kayıtları ve DB şeması değişmez.

## Etkin korumalar

- `nosniff`: içerik türü tahminini engeller.
- `SAMEORIGIN` + CSP `frame-ancestors 'self'`: başka sitenin uygulamayı iframe içine almasını engeller; aynı origin korunur.
- CSP `object-src 'none'`, `base-uri 'self'`: plugin nesnesi ve haricî base URL kısıtı.
- `strict-origin-when-cross-origin`: haricî bağlantılara yol/sorgu taşınmaz.
- Permissions-Policy: kamera, mikrofon, konum ve tam ekran aynı origin'de kullanılabilir. Bu başlık kullanıcı izni vermez; tarayıcı onayı yine gerekir. Ödeme/USB kapalı.
- X-Powered-By kaldırılır. Vercel'in mevcut HSTS başlığı değiştirilmez.

## Kademeli CSP

Tam kaynak politikası **yalnız Report-Only**. Görsel/ses için HTTPS kapsamı bu ilk envanter aşamasında geniştir; sonraki parçada doğrulanmış origin listesine daraltılmalı. Inline Next hydration scriptleri, geliştirme HMR ve Vercel önizleme araçları rapor ihlali üretebilir; bu, engellendikleri anlamına gelmez. `unsafe-eval` veya script `unsafe-inline` ile bu bulgular gizlenmez.

Bu aşamada merkezî rapor toplanmaz. `report-uri`, `report-to` ve `report-sample` yok: raporlar özel URL/query içerebilir. Geliştirici konsolundaki raporlar incelenirken URL'ler redakte edilmeli; auth kodu veya özel not loglanmamalı. Hassas rapor kabul endpoint'i eklemek ayrı güvenlik/tutma süresi değerlendirmesi gerektirir.

Bu sürüm tam XSS koruması veya tamamlanmış strict CSP değildir. Bir sonraki parça: dinamik/static rotalar için hash/nonce kararı, stiller ve üçüncü taraf kaynak envanteri, staging'de gerçek giriş/ses/medya smoke testi, ardından dar kapsamlı enforcement. Rastgele sabit nonce kullanma; nonce tercih edilirse Next'in dinamik render gereksinimini ve cache etkisini doğrula.

## Doğrulama / geri dönüş

`tests/security-headers.cjs`: yapılandırma sözleşmesi; `tests/e2e/security-headers.spec.ts`: ana sayfa, focus, callback redirect, auth error, gizlilik, robots ve ikon HTTP yanıtları. Mevcut focus/journal/Quran testleri CI'da regresyon kapısıdır.

Üretim: doğru main commit deployment'ı hazır olunca aynı rotalarda yalnız başlıkları kontrol et; çerez veya response body'yi loglama. Başlıklar auth cookie yenileme yapan proxy'nin tekrar ürettiği yanıtların üzerinde de korunmalı; callback testi bunu kısmen kapsar, gerçek cookie refresh staging kontrolü ayrıca gerekir.

Geri dönüş: PR revert'i ile önceki next.config yeniden deploy edilir; veri migration'ı yoktur. COOP/COEP eklenmedi: OAuth popup ve dış medya davranışını bu küçük parçaya dahil etmiyoruz.
