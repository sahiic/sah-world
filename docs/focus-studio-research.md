# SAH World — Odak Stüdyosu

## Araştırma ve uygulanan yaklaşım

Bu inceleme, uygulamaların resmî sayfalarında öne çıkardığı özelliklere dayanır; kullanıcı oylaması veya "en sevilen" özellik sıralaması değildir.

| Kaynak | Öne çıkan yaklaşım | SAH World karşılığı |
| --- | --- | --- |
| [Forest](https://www.forestapp.cc/) | Görsel motivasyon, ortam sesleri, odak/mola ritmi | Yerel dosyalarla çalışan doğa manzaraları, mevcut sesler ve Pomodoro turları |
| [Session](https://www.stayinsession.com/learn/getting-started-with-session-pomodoro-app) | Oturum niyeti, esnek süre, sakin başlangıç, geçmiş | Görev etiketi, isteğe bağlı niyet, 25/50/90 dk hızlı seçimler, mevcut geçmiş ekranı |
| [Focus To-Do](https://www.focustodo.cn/) | Görev ile zamanın bağlantısı, odak kayıtları | Göreve bağlı sayaç, tek merkezî oturum alanı, geçmiş/istatistiklerin ayrı ekranı |

İki mevcut giriş yolu (`/focus` ve `/?view=focus`) aynı manzara bileşenlerini kullanır. Sayaçların ayrı mevcut çalışma ve kayıt akışları değiştirilmemiştir. Yerel tercihlerin hatırlanması, ses seçimi, duraklat/devam et, geçmiş, zaman çizelgesi ve tam ekran korunmuştur. Başlayan veya duraklatılmış bir oturumda hızlı süre değiştirme kapalıdır.

Mevcut katalogdaki video adreslerinin dosyaları projede bulunmadığı için çalışmayan video seçenekleri kaldırıldı. Eski kayıtlı manzara kimlikleri Orman'a düşer. Arayüzdeki manzaralar fotoğraf türü arka planlardır, video veya gerçek zamanlı hareketli sahne diye sunulmaz. Uygulama engelleme, çok oyunculu oturum veya yeni sunucu senkronizasyonu bu değişikliğin kapsamında değildir.

## Görseller

Üretim modu: Codex yerleşik görsel üretimi. Yeni PNG çıktılar uygulama içine optimize edilmiş WebP olarak alındı; dış bağlantı gerektirmez.

- `public/images/focus-forest-ambient.webp`: mevcut görsel yeniden kullanıldı.
- `public/images/focus-coast.webp`: yeni üretim, 1600 × 900.
- `public/images/focus-alpine-night.webp`: yeni üretim, 1600 × 900.
- Sade: CSS renk geçişi; herhangi bir görsel isteği yapılmaz.

### Kıyı için son üretim istemi

Use case: photorealistic-natural. Asset type: full-screen background photograph for a premium calm focus timer web app. Generate a widescreen 16:9 editorial landscape photograph of a quiet Aegean coastline at blue hour, layered rocky headlands receding into sea mist, gentle turquoise waves, soft amber dusk on horizon. Crisp natural textures, atmospheric depth, cinematic but realistic, restrained teal and warm sand colors. Keep the central area low-contrast calm sea and sky for a large white clock overlay, visual interest toward the edges. No UI, no clock, no text, no people, no boats, no logos or watermark. Landscape image only.

### Yıldızlı Göl için son üretim istemi

Use case: photorealistic-natural. Asset type: full-screen background photograph for a premium calm focus timer web app. Generate a widescreen 16:9 atmospheric landscape of a still alpine lake in deep twilight, dark pine trees at the frame edges, layered mountain silhouettes across the water, realistic modest star field with faint Milky Way above, deep indigo sky and cool silver reflections. Realistic beautiful natural photography, no exaggerated fantasy. Keep center of frame visually calm and low-contrast for white timer UI to be overlaid separately. No UI, no clock, no text, no people, no buildings, no logos or watermark. Landscape only.

## Doğrulama

- Masaüstü ve mobil: her iki giriş yolu, gerçek görsel yükleme, manzara değişimi, yenileme sonrası tercih, Sade seçimi, 25/50 dk seçimleri, geçmiş ve ses pencereleri.
- Uygulama içi sayaç: başlatma, duraklatma, geçmişten geri dönme, yenileme sonrası süreyi koruma, küçültme ve devam eden oturum etiketi.
- TypeScript, değişen dosyalarda lint, birim testleri ve üretim derlemesi.
