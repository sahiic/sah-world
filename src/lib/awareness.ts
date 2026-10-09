export type Geography = 'filistin' | 'dogu_turkistan'
export type QuizOption = 'A' | 'B' | 'C' | 'D'

export type AwarenessContent = {
  id: string
  geography: Geography
  section: 'history' | 'displacement' | 'today' | 'human' | 'detention' | 'culture' | 'solidarity'
  sectionTitle: string
  contentBody: string
  sourceName: string
  sourceUrl: string
  displayOrder: number
  actionCue: string
}

export type AwarenessQuizQuestion = {
  id: string
  geography: Geography
  questionText: string
  options: Record<QuizOption, string>
  correctOption: QuizOption
  explanationText: string
  orderIndex: number
  sourceUrl: string
}

export type AwarenessOpening = {
  statement: string
  sourceName: string
  sourceUrl: string
}

export const GEOGRAPHY_META: Record<Geography, { name: string; short: string; icon: string; accent: string }> = {
  filistin: { name: 'Filistin', short: 'Nekbe’den bugüne hafıza, işgal ve sebat', icon: 'olive', accent: '#9f1239' },
  dogu_turkistan: { name: 'Doğu Türkistan', short: 'Tarih, kitlesel gözaltılar ve kültürel hafıza', icon: 'moon-stars', accent: '#b91c1c' },
}

// Reviewed 2026-10-09. Short attributed summaries, not a live casualty feed.
export const SOURCES = {
  "nakba": "https://www.dijitalhafiza.com/video-belgeseller/buyuk-felaket",
  "refugees": "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler",
  "press": "https://www.dijitalhafiza.com/biyografiler/hind-khoudary",
  "prisoners": "https://www.dijitalhafiza.com/kavramlar-sozlugu/idari-tutukluluk",
  "history": "https://doguturkistan.dijitalhafiza.com/zaman-tuneli/1759-mancularin-ilk-dogu-turkistan-istilasi",
  "camps": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/toplama-kamplari",
  "testimony": "https://doguturkistan.dijitalhafiza.com/kose-yazilari/bir-dogu-turkistanlinin-yasadiklari",
  "culture": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/yeniden-egitim",
  "language": "https://doguturkistan.dijitalhafiza.com/biyografiler/abdulweli-ayup"
} as const;

export const AWARENESS_CONTENT_FALLBACK: AwarenessContent[] = [
  {
    "id": "p-nakba",
    "geography": "filistin",
    "section": "history",
    "sectionTitle": "1948: Nekbe",
    "contentBody": "Dijital Hafıza’nın belgesel özeti, Nekbe’yi “Büyük Felaket” olarak açıklar. İsrail’in 1948’de kuruluş sürecini Filistinlilerin kitlesel yerinden edilmesiyle birlikte ele alır.",
    "sourceName": "Dijital Hafıza · Büyük Felaket",
    "sourceUrl": "https://www.dijitalhafiza.com/video-belgeseller/buyuk-felaket",
    "displayOrder": 1,
    "actionCue": "Tarihi ve kaynağı birlikte oku."
  },
  {
    "id": "p-occupation",
    "geography": "filistin",
    "section": "displacement",
    "sectionTitle": "Yerinden edilmenin iki eşiği",
    "contentBody": "Kaynak, Filistinli mülteciliğini 1948 Nekbesi ve 1967 Haziran Savaşı ile ilişkilendirir. Evlerini terk eden sivillerin geri dönüşlerinin engellendiğini aktarır.",
    "sourceName": "Dijital Hafıza · Filistinli Mülteciler",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler",
    "displayOrder": 2,
    "actionCue": "Mülteciliği yalnızca sayılara indirgeme."
  },
  {
    "id": "p-gaza",
    "geography": "filistin",
    "section": "today",
    "sectionTitle": "Gazze’yi belgelemenin sorumluluğu",
    "contentBody": "Hind Khoudary’nin biyografisi, 7 Ekim 2023 sonrasındaki saha haberciliğini anlatır. Gazetecinin sivillerin yaşadıklarını dünyaya aktaran çalışmalarına odaklanır; bu sayfa anlık haber akışı değildir.",
    "sourceName": "Dijital Hafıza · Hind Khoudary",
    "sourceUrl": "https://www.dijitalhafiza.com/biyografiler/hind-khoudary",
    "displayOrder": 3,
    "actionCue": "Güncel haberin tarihini ve ilk kaynağını kontrol et."
  },
  {
    "id": "p-refugees",
    "geography": "filistin",
    "section": "human",
    "sectionTitle": "Bir evden daha fazlası",
    "contentBody": "Dijital Hafıza, sürgündeki Filistinlilerin kimlikleriyle bağlarını koruduğunu vurgular. Geri dönme isteği, anlatıda kuşakları birbirine bağlayan bir unsur olarak yer alır.",
    "sourceName": "Dijital Hafıza · Filistinli Mülteciler",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler",
    "displayOrder": 4,
    "actionCue": "Bir insanı önce hayatıyla ve aidiyetiyle tanı."
  },
  {
    "id": "p-prisoners",
    "geography": "filistin",
    "section": "detention",
    "sectionTitle": "İdari tutukluluk ne demek?",
    "contentBody": "Kaynak, bu uygulamayı suçlama yöneltilmeden gözaltında tutma olarak tarif eder. Gizli dosyalar nedeniyle kişinin ve avukatının dosyaya erişemeyebildiğini aktarır.",
    "sourceName": "Dijital Hafıza · İdari Tutukluluk",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/idari-tutukluluk",
    "displayOrder": 5,
    "actionCue": "İddia, tanıklık ve hukuki değerlendirmeyi birbirinden ayır."
  },
  {
    "id": "p-sumud",
    "geography": "filistin",
    "section": "solidarity",
    "sectionTitle": "Yazıyla dayanışma",
    "contentBody": "Dijital Hafıza’ya göre Khoudary, 2015’te genç Filistinli yazarları destekleyen We Are Not Numbers programına katıldı. Biyografi, yazı ve haberciliğin insanların hikâyelerini görünür kılmadaki rolünü gösterir.",
    "sourceName": "Dijital Hafıza · Hind Khoudary",
    "sourceUrl": "https://www.dijitalhafiza.com/biyografiler/hind-khoudary",
    "displayOrder": 6,
    "actionCue": "Bir insan hikâyesini kaynağıyla ve izin sınırlarına saygıyla paylaş."
  },
  {
    "id": "e-history",
    "geography": "dogu_turkistan",
    "section": "history",
    "sectionTitle": "1759: tarihsel bir eşik",
    "contentBody": "Dijital Hafıza, Mançuların 1755’te Cungarya’yı ele geçirdikten sonra güneye ilerlediğini anlatır. İlk Doğu Türkistan istilasını 1759 yılına tarihler.",
    "sourceName": "Dijital Hafıza · Mançuların İlk İstilası",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/zaman-tuneli/1759-mancularin-ilk-dogu-turkistan-istilasi",
    "displayOrder": 1,
    "actionCue": "Bugünün arkasındaki uzun tarihi tanı."
  },
  {
    "id": "e-detentions",
    "geography": "dogu_turkistan",
    "section": "displacement",
    "sectionTitle": "Yurdundan uzak bir aile",
    "contentBody": "7 Mayıs 2020 tarihli söyleşi, ailesiyle ülkesinden ayrılan bir Uygurun yaşadıklarını aktarır. Editör, güvenlik kaygısıyla kimlik ve konum ayrıntılarını sınırladığını belirtir.",
    "sourceName": "Dijital Hafıza · Bir Doğu Türkistanlının Yaşadıkları",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kose-yazilari/bir-dogu-turkistanlinin-yasadiklari",
    "displayOrder": 2,
    "actionCue": "Tanığın mahremiyetine saygı göster."
  },
  {
    "id": "e-camps",
    "geography": "dogu_turkistan",
    "section": "today",
    "sectionTitle": "Kapalı yapılar, sınırlı bilgi",
    "contentBody": "Kamp sayfası, hukuki süreç olmaksızın özgürlükten alıkoymayı ele alır. Kaynak kapalılık nedeniyle kesin bilgiye erişimin güç olduğunu söyler; tahmini sayıları güncel ve kesin veri gibi sunmuyoruz.",
    "sourceName": "Dijital Hafıza · Toplama Kampları",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/toplama-kamplari",
    "displayOrder": 3,
    "actionCue": "Sayının tarihi, yöntemi ve belirsizliği görünür olsun."
  },
  {
    "id": "e-reeducation",
    "geography": "dogu_turkistan",
    "section": "human",
    "sectionTitle": "Bir tanıklığı dikkatle okumak",
    "contentBody": "Söyleşideki kişi, ülkesinde iş sahibi olduğunu ve ayrılırken çok şey kaybettiğini anlatır. Bu kişisel anlatı, bütün bir topluluk adına genellenmeden okunmalıdır.",
    "sourceName": "Dijital Hafıza · Bir Doğu Türkistanlının Yaşadıkları",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kose-yazilari/bir-dogu-turkistanlinin-yasadiklari",
    "displayOrder": 4,
    "actionCue": "Doğrudan söz ile editörün yorumunu ayırt et."
  },
  {
    "id": "e-suppression",
    "geography": "dogu_turkistan",
    "section": "culture",
    "sectionTitle": "İnanç ve kimlik üzerindeki baskı",
    "contentBody": "Dijital Hafıza’nın “Yeniden Eğitim” maddesi, Uygurların inançlarıyla bağdaşmayan uygulamalara zorlanmasını aktarır. Kavram, yalnız eğitim politikası değil inanç özgürlüğü bağlamında ele alınır.",
    "sourceName": "Dijital Hafıza · Yeniden Eğitim",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/yeniden-egitim",
    "displayOrder": 5,
    "actionCue": "Bir topluluğu dili, inancı ve kültürüyle birlikte tanı."
  },
  {
    "id": "e-documentation",
    "geography": "dogu_turkistan",
    "section": "solidarity",
    "sectionTitle": "Dili geleceğe taşımak",
    "contentBody": "Abduweli Ayup biyografisi, Uygurca eğitimi için açtığı okulları anlatır. Dil ve kültürün kuşaklar arasında aktarımını savunan çalışmalarını öne çıkarır.",
    "sourceName": "Dijital Hafıza · Abdulweli Ayup",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/biyografiler/abdulweli-ayup",
    "displayOrder": 6,
    "actionCue": "Bir dilin edebiyatını ve eğitim çalışmalarını keşfet."
  }
];

export const AWARENESS_QUIZ_FALLBACK: AwarenessQuizQuestion[] = [
  {
    "id": "p-01",
    "geography": "filistin",
    "orderIndex": 1,
    "questionText": "Nekbe hangi anlama gelir?",
    "options": {
      "A": "Büyük Felaket",
      "B": "Dönüş Yolu",
      "C": "Barış Görüşmesi",
      "D": "Yeni Şehir"
    },
    "correctOption": "A",
    "explanationText": "Kaynak, Nekbe’yi Büyük Felaket olarak açıklar.",
    "sourceUrl": "https://www.dijitalhafiza.com/video-belgeseller/buyuk-felaket"
  },
  {
    "id": "p-02",
    "geography": "filistin",
    "orderIndex": 2,
    "questionText": "Belgesel özetinin anlattığı kuruluş ve yerinden edilme süreci hangi yıldadır?",
    "options": {
      "A": "1918",
      "B": "1948",
      "C": "1987",
      "D": "2007"
    },
    "correctOption": "B",
    "explanationText": "Belgesel özeti 1948 sürecini ele alır.",
    "sourceUrl": "https://www.dijitalhafiza.com/video-belgeseller/buyuk-felaket"
  },
  {
    "id": "p-03",
    "geography": "filistin",
    "orderIndex": 3,
    "questionText": "Mültecilik sayfasındaki iki tarihsel eşik hangileridir?",
    "options": {
      "A": "1908 ve 1923",
      "B": "1939 ve 1945",
      "C": "1948 ve 1967",
      "D": "1980 ve 1990"
    },
    "correctOption": "C",
    "explanationText": "Kaynak 1948 Nekbesi ile 1967 Haziran Savaşı’nı birlikte anar.",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler"
  },
  {
    "id": "p-04",
    "geography": "filistin",
    "orderIndex": 4,
    "questionText": "Kaynak, mültecilerin hangi isteği koruduğunu belirtir?",
    "options": {
      "A": "Yeni bir para birimi",
      "B": "Sınırların unutulması",
      "C": "Arşivlerin kapatılması",
      "D": "Topraklarına dönmek"
    },
    "correctOption": "D",
    "explanationText": "Geri dönme iradesi özellikle vurgulanır.",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler"
  },
  {
    "id": "p-05",
    "geography": "filistin",
    "orderIndex": 5,
    "questionText": "Hind Khoudary hangi meslekle tanıtılır?",
    "options": {
      "A": "Gazeteci",
      "B": "Mimar",
      "C": "Arkeolog",
      "D": "Müzisyen"
    },
    "correctOption": "A",
    "explanationText": "Biyografi onun gazetecilik çalışmalarını anlatır.",
    "sourceUrl": "https://www.dijitalhafiza.com/biyografiler/hind-khoudary"
  },
  {
    "id": "p-06",
    "geography": "filistin",
    "orderIndex": 6,
    "questionText": "Khoudary, We Are Not Numbers programına hangi yıl katıldı?",
    "options": {
      "A": "2005",
      "B": "2015",
      "C": "1995",
      "D": "1985"
    },
    "correctOption": "B",
    "explanationText": "Biyografide katılım yılı 2015 olarak verilir.",
    "sourceUrl": "https://www.dijitalhafiza.com/biyografiler/hind-khoudary"
  },
  {
    "id": "p-07",
    "geography": "filistin",
    "orderIndex": 7,
    "questionText": "We Are Not Numbers hangi çalışmaya destek verir?",
    "options": {
      "A": "Deniz taşımacılığına",
      "B": "Tarım sigortasına",
      "C": "Genç yazarların gelişimine",
      "D": "İnşaat planlamasına"
    },
    "correctOption": "C",
    "explanationText": "Program genç Filistinli yazarları destekler.",
    "sourceUrl": "https://www.dijitalhafiza.com/biyografiler/hind-khoudary"
  },
  {
    "id": "p-08",
    "geography": "filistin",
    "orderIndex": 8,
    "questionText": "İdari tutukluluk maddesinin temel konusu nedir?",
    "options": {
      "A": "Pasaport yenileme",
      "B": "Belediye seçimi",
      "C": "Okul kaydı",
      "D": "Suçlama olmadan gözaltında tutma"
    },
    "correctOption": "D",
    "explanationText": "Kaynak, suçlama olmadan tutulma uygulamasını tarif eder.",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/idari-tutukluluk"
  },
  {
    "id": "p-09",
    "geography": "filistin",
    "orderIndex": 9,
    "questionText": "Kaynağa göre gizli dosyalar hangi güçlüğe yol açabilir?",
    "options": {
      "A": "Kişinin ve avukatının dosyaya erişememesi",
      "B": "Mahkeme binasının taşınması",
      "C": "Arşiv dilinin değişmesi",
      "D": "Duruşmaların halka açılması"
    },
    "correctOption": "A",
    "explanationText": "Dosyaya erişim kısıtı maddede belirtilir.",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/idari-tutukluluk"
  },
  {
    "id": "p-10",
    "geography": "filistin",
    "orderIndex": 10,
    "questionText": "Mültecilik sayfası, yerinden edilmenin yanında neyi vurgular?",
    "options": {
      "A": "Sadece ticari yolları",
      "B": "Kimliğe aidiyetin sürmesini",
      "C": "Turizm gelirini",
      "D": "Sanayi planını"
    },
    "correctOption": "B",
    "explanationText": "Kaynak, Filistinli kimliğine bağlılığın sürdüğünü aktarır.",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler"
  },
  {
    "id": "e-01",
    "geography": "dogu_turkistan",
    "orderIndex": 1,
    "questionText": "Zaman tüneli ilk Mançu istilasını hangi yıla tarihler?",
    "options": {
      "A": "1911",
      "B": "1949",
      "C": "1759",
      "D": "2009"
    },
    "correctOption": "C",
    "explanationText": "Kaynakta olay 1759 olarak tarihlenir.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/zaman-tuneli/1759-mancularin-ilk-dogu-turkistan-istilasi"
  },
  {
    "id": "e-02",
    "geography": "dogu_turkistan",
    "orderIndex": 2,
    "questionText": "Mançular 1755’te hangi bölgeyi ele geçirdi?",
    "options": {
      "A": "Anadolu",
      "B": "Balkanlar",
      "C": "Hicaz",
      "D": "Cungarya"
    },
    "correctOption": "D",
    "explanationText": "Zaman tünelinde Cungarya belirtilir.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/zaman-tuneli/1759-mancularin-ilk-dogu-turkistan-istilasi"
  },
  {
    "id": "e-03",
    "geography": "dogu_turkistan",
    "orderIndex": 3,
    "questionText": "Kaynak, kamp bilgilerindeki belirsizliği neyle ilişkilendirir?",
    "options": {
      "A": "Gizlilik ve kapalılıkla",
      "B": "İklimle",
      "C": "Takvim farkıyla",
      "D": "Harita ölçeğiyle"
    },
    "correctOption": "A",
    "explanationText": "Kaynak net bilgiye erişimin güç olduğunu belirtir.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/toplama-kamplari"
  },
  {
    "id": "e-04",
    "geography": "dogu_turkistan",
    "orderIndex": 4,
    "questionText": "Kamp sayfasında hangi resmî adlandırma aktarılır?",
    "options": {
      "A": "Açık Öğretim Kampüsü",
      "B": "Mesleki Eğitim ve Öğretim Merkezi",
      "C": "Kültür Köyü",
      "D": "Spor Akademisi"
    },
    "correctOption": "B",
    "explanationText": "Maddede bu adlandırma aktarılır.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/toplama-kamplari"
  },
  {
    "id": "e-05",
    "geography": "dogu_turkistan",
    "orderIndex": 5,
    "questionText": "Kamp tanımında hangi temel hak sorunu öne çıkar?",
    "options": {
      "A": "Ulaşım planı",
      "B": "Ticaret kotası",
      "C": "Hukuki süreç olmadan özgürlükten alıkoyma",
      "D": "Spor lisansı"
    },
    "correctOption": "C",
    "explanationText": "Özgürlüğün hukuki süreç olmadan kaldırılması ele alınır.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/toplama-kamplari"
  },
  {
    "id": "e-06",
    "geography": "dogu_turkistan",
    "orderIndex": 6,
    "questionText": "Yeniden Eğitim maddesi baskıyı hangi alanla ilişkilendirir?",
    "options": {
      "A": "Yalnızca trafik",
      "B": "Yalnızca turizm",
      "C": "Yalnızca spor",
      "D": "Dinî inanç ve uygulamalar"
    },
    "correctOption": "D",
    "explanationText": "Madde, inançla bağdaşmayan uygulamalara zorlamayı anlatır.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kavramlar-sozlugu/yeniden-egitim"
  },
  {
    "id": "e-07",
    "geography": "dogu_turkistan",
    "orderIndex": 7,
    "questionText": "Abduweli Ayup biyografisinde hangi uzmanlık belirtilir?",
    "options": {
      "A": "Dilbilim",
      "B": "Denizcilik",
      "C": "Kimya",
      "D": "Mimarlık"
    },
    "correctOption": "A",
    "explanationText": "Kaynak Ayup’u dilbilimci olarak tanıtır.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/biyografiler/abdulweli-ayup"
  },
  {
    "id": "e-08",
    "geography": "dogu_turkistan",
    "orderIndex": 8,
    "questionText": "Ayup’un eğitim çalışmaları hangi dile odaklanır?",
    "options": {
      "A": "İspanyolca",
      "B": "Uygurca",
      "C": "İtalyanca",
      "D": "Portekizce"
    },
    "correctOption": "B",
    "explanationText": "Biyografi Uygurca eğitimi için açılan okulları anlatır.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/biyografiler/abdulweli-ayup"
  },
  {
    "id": "e-09",
    "geography": "dogu_turkistan",
    "orderIndex": 9,
    "questionText": "7 Mayıs 2020 tarihli söyleşide ayrıntılar neden sınırlandırılır?",
    "options": {
      "A": "Metin kısalsın diye",
      "B": "Reklam amacıyla",
      "C": "Tanığın güvenliği için",
      "D": "Çeviri yapılmadığı için"
    },
    "correctOption": "C",
    "explanationText": "Editör güvenlik kaygısını açıkça belirtir.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kose-yazilari/bir-dogu-turkistanlinin-yasadiklari"
  },
  {
    "id": "e-10",
    "geography": "dogu_turkistan",
    "orderIndex": 10,
    "questionText": "Söyleşideki kişi ülkesinden kimlerle ayrılmıştır?",
    "options": {
      "A": "Spor takımıyla",
      "B": "Bir orkestrayla",
      "C": "Turist kafilesiyle",
      "D": "Eşi ve iki çocuğuyla"
    },
    "correctOption": "D",
    "explanationText": "Yazının girişinde ailece ayrılış anlatılır.",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kose-yazilari/bir-dogu-turkistanlinin-yasadiklari"
  }
];

export const AWARENESS_OPENINGS: Record<Geography, AwarenessOpening> = {
  filistin: { statement: 'Bir coğrafyayı değil, insanların hayatını anlamak.', sourceName: 'Dijital Hafıza · Filistin', sourceUrl: SOURCES.refugees },
  dogu_turkistan: { statement: 'Hafızayı korumak, bir dilin sesini duymakla başlar.', sourceName: 'Dijital Hafıza · Doğu Türkistan', sourceUrl: SOURCES.language }
};
export const AWARENESS_MILESTONES: Record<Geography, string[]> = {
  filistin: ['1948', 'Yerinden edilme', 'Gazetecilik', 'İnsan', 'Haklar', 'Dayanışma'],
  dogu_turkistan: ['1759', 'Göç', 'Belgeleme', 'Tanıklık', 'İnanç', 'Dil']
};
export const AWARENESS_ACTIONS = {
  filistin: [{icon: 'book',title: 'Kaynağı oku',body: 'Hafızayı ilk kaynağından incele.',href: SOURCES.refugees}],
  dogu_turkistan: [{icon: 'book',title: 'Kaynağı oku',body: 'Dil ve kültür çalışmalarını tanı.',href: SOURCES.language}]
} as const;

export const HUMANITARIAN_ORGANIZATIONS = [
  {
    name: 'Türk Kızılay',
    note: 'Filistin için açılan resmî bağış sayfası; saha yardımlarını Filistin ve Mısır Kızılayı ile koordineli yürüttüğünü belirtiyor.',
    href: 'https://bagis.kizilay.org.tr/tr/bagis/bagisyap/32/filistin-genel-bagisi',
  },
  {
    name: 'UNICEF Türkiye',
    note: 'Çocukların eğitim, sağlık ve korunma ihtiyaçları için çalışan resmî bağış kanalı; kullanım şeffaflığı bağlantısını açıkça sunuyor.',
    href: 'https://www.unicefturk.org/',
  },
] as const

export const AWARENESS_SHARE_COPY: Record<Geography, { title: string; text: string; sourceUrl: string }> = {
  filistin: {
    title: 'Filistin: Hafızayı kaynağıyla koru',
    text: 'Dijital Hafıza, 1948’deki yerinden edilme sürecini Nekbe — Büyük Felaket — başlığıyla anlatıyor. Kaynaklı ve insan onurunu koruyan kısa anlatıyı SAH World’de oku.',
    sourceUrl: SOURCES.nakba,
  },
  dogu_turkistan: {
    title: 'Doğu Türkistan: Bilgiyi kaynağıyla taşı',
    text: 'Dijital Hafıza’nın zaman tüneli 1759’u Mançuların Doğu Türkistan’daki ilk istilası olarak kayda geçiriyor. Kaynaklı ve sakin anlatıyı SAH World’de oku.',
    sourceUrl: SOURCES.history,
  },
}

export const quizReward = (score: number) => 40 + score * 5
