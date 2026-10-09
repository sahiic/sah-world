export type BoycottCategory = 'gida' | 'icecek' | 'teknoloji' | 'moda' | 'kozmetik' | 'market' | 'fastfood' | 'diger'
export type BoycottStatus = 'boykot' | 'supheli' | 'uygun'

export type BoycottItem = {
  id: string
  category: BoycottCategory
  status: BoycottStatus
  brandName: string
  parentCompany: string
  reason: string
  sourceUrl: string
  sourceName: string
  alternatives: { name: string; note: string; sourceUrl?: string }[]
  isActive: boolean
}

export const BOYCOTT_CATEGORIES: { id: BoycottCategory; label: string; icon: string }[] = [
  { id: 'gida', label: 'Gıda', icon: 'soup' },
  { id: 'icecek', label: 'İçecek', icon: 'cup' },
  { id: 'fastfood', label: 'Fast Food', icon: 'burger' },
  { id: 'teknoloji', label: 'Teknoloji', icon: 'device-mobile' },
  { id: 'moda', label: 'Moda & Ayakkabı', icon: 'shirt' },
  { id: 'kozmetik', label: 'Kozmetik & Bakım', icon: 'sparkles' },
  { id: 'market', label: 'Market & E-Ticaret', icon: 'building-store' },
  { id: 'diger', label: 'Diğer', icon: 'dots' },
]

export const BOYCOTT_STATUS_META: Record<BoycottStatus, { label: string; color: string; bg: string; darkBg: string }> = {
  boykot: { label: 'Boykot', color: '#dc2626', bg: '#fef2f2', darkBg: 'rgba(220,38,38,.15)' },
  supheli: { label: 'Şüpheli', color: '#d97706', bg: '#fffbeb', darkBg: 'rgba(217,119,6,.15)' },
  uygun: { label: 'Uygun', color: '#059669', bg: '#ecfdf5', darkBg: 'rgba(5,150,105,.15)' },
}

export const BOYCOTT_REVIEWED_AT = '2026-10-09';
export const BOYCOTT_SOURCE = {name: 'Boykot Dedektifi · marka kayıtları', url: 'https://boykotdedektifi.com/'} as const;
// Attributed classifications, not independent certification. Unverified legacy entries
// are omitted, not deleted from saved user preferences. IDs remain stable.
export const BOYCOTT_ITEMS: BoycottItem[] = [
  {
    "id": "nestle",
    "category": "gida",
    "status": "boykot",
    "brandName": "Nestlé",
    "parentCompany": "Nestlé S.A.",
    "reason": "Kaynak, Osem bağlantısını boykot gerekçeleri arasında sayıyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/nestle-23",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Eti",
        "note": "Kaynakta Türkiye menşeli; kategoriye göre karşılaştır.",
        "sourceUrl": "https://boykotdedektifi.com/b/eti-32"
      }
    ],
    "isActive": true
  },
  {
    "id": "danone",
    "category": "gida",
    "status": "boykot",
    "brandName": "Danone",
    "parentCompany": "Groupe Danone",
    "reason": "Kaynak, Strauss ile ticari ilişkileri gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/danone-338",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Sütaş",
        "note": "Kaynakta yerli süt ürünleri seçeneği.",
        "sourceUrl": "https://boykotdedektifi.com/b/sutas-39"
      }
    ],
    "isActive": true
  },
  {
    "id": "mondelez",
    "category": "gida",
    "status": "boykot",
    "brandName": "Oreo",
    "parentCompany": "Mondelēz International",
    "reason": "Kaynak, ana şirketin teknoloji yatırımlarını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/oreo-371",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Eti",
        "note": "Kaynakta Türkiye menşeli; kategoriye göre karşılaştır.",
        "sourceUrl": "https://boykotdedektifi.com/b/eti-32"
      }
    ],
    "isActive": true
  },
  {
    "id": "unilever-food",
    "category": "gida",
    "status": "boykot",
    "brandName": "Knorr",
    "parentCompany": "Unilever",
    "reason": "Kaynak, Unilever’in ticari ortaklıkları nedeniyle boykot çağrısı yapıyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/knorr-348",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "kelloggs",
    "category": "gida",
    "status": "boykot",
    "brandName": "Kellogg’s",
    "parentCompany": "Kaynak kaydı: Ferrero (WK Kellogg)",
    "reason": "Kaynak kaydı WK Kellogg satın alımına dayanıyor; bölgesel marka sahipliği farklı olabilir.",
    "sourceUrl": "https://boykotdedektifi.com/b/kellogg-s-1495",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Eti",
        "note": "Kaynakta Türkiye menşeli; kategoriye göre karşılaştır.",
        "sourceUrl": "https://boykotdedektifi.com/b/eti-32"
      }
    ],
    "isActive": true
  },
  {
    "id": "sabra",
    "category": "gida",
    "status": "boykot",
    "brandName": "Sabra",
    "parentCompany": "Kaynak kaydı: PepsiCo / Strauss",
    "reason": "Kaynak ticari ilişkileri gerekçe gösteriyor; güncel hisse yapısını ayrıca doğrula.",
    "sourceUrl": "https://boykotdedektifi.com/b/sabra-403",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "ulker",
    "category": "gida",
    "status": "boykot",
    "brandName": "Ülker",
    "parentCompany": "Yıldız Holding / Pladis",
    "reason": "Kaynak, holdingin ticari bağlantılarına ilişkin değerlendirmesiyle boykot sınıfında listeliyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/ulker-301",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Eti",
        "note": "Kaynakta Türkiye menşeli; kategoriye göre karşılaştır.",
        "sourceUrl": "https://boykotdedektifi.com/b/eti-32"
      }
    ],
    "isActive": true
  },
  {
    "id": "eti",
    "category": "gida",
    "status": "uygun",
    "brandName": "Eti",
    "parentCompany": "Eti",
    "reason": "Kaynak Türkiye menşeli gıda üreticisini uygun olarak listeliyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/eti-32",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Şölen",
        "note": "Kaynakta Türkiye menşeli gıda seçeneği.",
        "sourceUrl": "https://boykotdedektifi.com/b/solen-773"
      }
    ],
    "isActive": true
  },
  {
    "id": "solen",
    "category": "gida",
    "status": "uygun",
    "brandName": "Şölen",
    "parentCompany": "Şölen / Çoban ailesi",
    "reason": "Kaynak Türkiye menşeli çikolata üreticisini uygun olarak listeliyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/solen-773",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Eti",
        "note": "Kaynakta Türkiye menşeli; kategoriye göre karşılaştır.",
        "sourceUrl": "https://boykotdedektifi.com/b/eti-32"
      }
    ],
    "isActive": true
  },
  {
    "id": "yayla",
    "category": "gida",
    "status": "uygun",
    "brandName": "Yayla",
    "parentCompany": "Yayla Agro Gıda",
    "reason": "Kaynak, iş birliği sona erdiğine dair açıklama sonrası durumunu güncellediğini belirtiyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/yayla-2376",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "coca-cola",
    "category": "icecek",
    "status": "boykot",
    "brandName": "Coca-Cola",
    "parentCompany": "The Coca-Cola Company",
    "reason": "Kaynak, bölgedeki ticari faaliyetleri gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/coca-cola-17",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "pepsi",
    "category": "icecek",
    "status": "boykot",
    "brandName": "Pepsi",
    "parentCompany": "PepsiCo",
    "reason": "Kaynak, SodaStream bağlantısını gerekçeleri arasında sayıyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/pepsi-307",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "starbucks",
    "category": "icecek",
    "status": "boykot",
    "brandName": "Starbucks",
    "parentCompany": "Starbucks Corporation",
    "reason": "Kaynak boykot çağrısı yayımlıyor. İddialar kaynağın değerlendirmesidir; bu etiket BDS hedefi olduğu anlamına gelmez.",
    "sourceUrl": "https://boykotdedektifi.com/b/starbucks-25",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "cola-turka",
    "category": "icecek",
    "status": "uygun",
    "brandName": "Cola Turka",
    "parentCompany": "DyDo Drinco",
    "reason": "Kaynak Japon şirket sahipliğini belirtiyor; yerli sermayeli diye sunulmuyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/cola-turka-239",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "black-bruin",
    "category": "icecek",
    "status": "uygun",
    "brandName": "Black Bruin",
    "parentCompany": "Oğuz Gıda",
    "reason": "Kaynak Oğuz Gıda markasını uygun olarak listeliyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/black-bruin-673",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "mcdonalds",
    "category": "fastfood",
    "status": "boykot",
    "brandName": "McDonald’s",
    "parentCompany": "McDonald’s Corporation",
    "reason": "Kaynak İsrail’deki yemek dağıtımını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/mcdonald-s-420",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "burger-king",
    "category": "fastfood",
    "status": "boykot",
    "brandName": "Burger King",
    "parentCompany": "Restaurant Brands International",
    "reason": "Kaynak İsrail’deki gıda desteği kampanyalarını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/burger-king-29",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "dominos",
    "category": "fastfood",
    "status": "boykot",
    "brandName": "Domino’s Pizza",
    "parentCompany": "Domino’s Pizza, Inc.",
    "reason": "Kaynak İsrail operasyonlarının yemek yardımlarını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/domino-s-pizza-308",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "getir",
    "category": "market",
    "status": "boykot",
    "brandName": "Getir",
    "parentCompany": "Kaynak kaydı: Getir Perakende Lojistik",
    "reason": "Kaynak, platformun ortaklıklarına dayanarak boykot sınıflandırması yapıyor; hizmet bazında sahiplik değişebilir.",
    "sourceUrl": "https://boykotdedektifi.com/b/getir-2302",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "hp",
    "category": "teknoloji",
    "status": "boykot",
    "brandName": "HP",
    "parentCompany": "HP Inc.",
    "reason": "Kaynak, teknoloji altyapısı desteği iddialarını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/hp-731",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel onarım veya ikinci el",
        "note": "Tüketimi azaltma seçeneği; yerli işlemci ya da birebir ürün muadili iddiası değildir."
      }
    ],
    "isActive": true
  },
  {
    "id": "siemens",
    "category": "teknoloji",
    "status": "boykot",
    "brandName": "Siemens",
    "parentCompany": "Siemens / beyaz eşyada BSH",
    "reason": "Kaynak beyaz eşya faaliyetlerini ele alıyor; farklı şirket ve ürün gruplarını ayırt ederek incele.",
    "sourceUrl": "https://boykotdedektifi.com/b/siemens-725",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Vestel",
        "note": "Türkiye menşeli cihaz seçeneği; her ürünün birebir karşılığı değildir.",
        "sourceUrl": "https://boykotdedektifi.com/b/vestel-719"
      }
    ],
    "isActive": true
  },
  {
    "id": "apple",
    "category": "teknoloji",
    "status": "boykot",
    "brandName": "Apple",
    "parentCompany": "Apple Inc.",
    "reason": "Kaynak ticari faaliyetler ve hizmet politikaları hakkında boykot değerlendirmesi yayımlıyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/apple-718",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Vestel",
        "note": "Türkiye menşeli cihaz seçeneği; her ürünün birebir karşılığı değildir.",
        "sourceUrl": "https://boykotdedektifi.com/b/vestel-719"
      }
    ],
    "isActive": true
  },
  {
    "id": "samsung",
    "category": "teknoloji",
    "status": "uygun",
    "brandName": "Samsung",
    "parentCompany": "Samsung Electronics",
    "reason": "Kaynak genel olarak uygun diyor ancak bazı modeller için istisna belirtiyor. Model bazında kontrol et.",
    "sourceUrl": "https://boykotdedektifi.com/b/samsung-1020",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Vestel",
        "note": "Türkiye menşeli cihaz seçeneği; her ürünün birebir karşılığı değildir.",
        "sourceUrl": "https://boykotdedektifi.com/b/vestel-719"
      }
    ],
    "isActive": true
  },
  {
    "id": "amd",
    "category": "teknoloji",
    "status": "uygun",
    "brandName": "AMD",
    "parentCompany": "Advanced Micro Devices",
    "reason": "Kaynak uygun olarak listeliyor; bu, tüm tedarik zincirinin bağımsız onayı değildir.",
    "sourceUrl": "https://boykotdedektifi.com/b/amd-976",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel onarım veya ikinci el",
        "note": "Tüketimi azaltma seçeneği; yerli işlemci ya da birebir ürün muadili iddiası değildir."
      }
    ],
    "isActive": true
  },
  {
    "id": "zara",
    "category": "moda",
    "status": "boykot",
    "brandName": "Zara",
    "parentCompany": "Inditex",
    "reason": "Kaynak reklam kampanyasına ilişkin boykot değerlendirmesini aktarıyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/zara-82",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Kinetix",
        "note": "Türkiye menşeli ayakkabı / spor giyim seçeneği.",
        "sourceUrl": "https://boykotdedektifi.com/b/kinetix-2477"
      }
    ],
    "isActive": true
  },
  {
    "id": "hm",
    "category": "moda",
    "status": "boykot",
    "brandName": "H&M",
    "parentCompany": "Hennes & Mauritz AB",
    "reason": "Kaynak bölgedeki mağaza faaliyetlerini gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/h-m-72",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "nike",
    "category": "moda",
    "status": "boykot",
    "brandName": "Nike",
    "parentCompany": "Nike, Inc.",
    "reason": "Kaynak yatırım ve tedarik ilişkilerini gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/nike-75",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Kinetix",
        "note": "Türkiye menşeli ayakkabı / spor giyim seçeneği.",
        "sourceUrl": "https://boykotdedektifi.com/b/kinetix-2477"
      }
    ],
    "isActive": true
  },
  {
    "id": "puma",
    "category": "moda",
    "status": "boykot",
    "brandName": "Puma",
    "parentCompany": "Puma SE",
    "reason": "Kaynak spor sponsorluğu ve dağıtım ilişkilerini gerekçe gösteriyor; eski sponsorluk iddiası otomatik tekrarlanmıyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/puma-74",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Kinetix",
        "note": "Türkiye menşeli ayakkabı / spor giyim seçeneği.",
        "sourceUrl": "https://boykotdedektifi.com/b/kinetix-2477"
      }
    ],
    "isActive": true
  },
  {
    "id": "pg",
    "category": "kozmetik",
    "status": "boykot",
    "brandName": "Gillette",
    "parentCompany": "Procter & Gamble",
    "reason": "Kaynak ana şirketin Ar-Ge ve tedarik ilişkilerini gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/gillette-821",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "ahava",
    "category": "kozmetik",
    "status": "boykot",
    "brandName": "Ahava",
    "parentCompany": "Kaynak kaydı: Fosun International",
    "reason": "Kaynak markanın İsrail merkezli faaliyetlerini gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/ahava-2898",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Duru",
        "note": "Yerli kişisel bakım seçeneği; ürün türünü karşılaştır.",
        "sourceUrl": "https://boykotdedektifi.com/b/duru-566"
      }
    ],
    "isActive": true
  },
  {
    "id": "flormar",
    "category": "kozmetik",
    "status": "uygun",
    "brandName": "Flormar",
    "parentCompany": "Kaynak kaydı: Esas Holding",
    "reason": "Kaynak sahiplik değişikliği sonrası uygun sınıfında listeliyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/flormar-801",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "a101",
    "category": "market",
    "status": "supheli",
    "brandName": "A101",
    "parentCompany": "Turgut Aydın Holding",
    "reason": "Kaynak ürün ve kampanya tercihleri nedeniyle şüpheli diyor; doğrudan destek delili bulmadığını da belirtiyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/a101-712",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "booking",
    "category": "diger",
    "status": "boykot",
    "brandName": "Booking.com",
    "parentCompany": "Booking Holdings",
    "reason": "Kaynak yerleşimlerdeki konaklama ilanlarını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/booking-com-924",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "airbnb",
    "category": "diger",
    "status": "boykot",
    "brandName": "Airbnb",
    "parentCompany": "Airbnb, Inc.",
    "reason": "Kaynak yerleşimlerdeki ilanların yeniden sunulmasını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/airbnb-923",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  },
  {
    "id": "caterpillar",
    "category": "diger",
    "status": "boykot",
    "brandName": "Caterpillar",
    "parentCompany": "Caterpillar Inc.",
    "reason": "Kaynak iş makinelerinin yıkımlarda kullanımını gerekçe gösteriyor.",
    "sourceUrl": "https://boykotdedektifi.com/b/caterpillar-150",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel onarım veya ikinci el",
        "note": "Tüketimi azaltma seçeneği; yerli işlemci ya da birebir ürün muadili iddiası değildir."
      }
    ],
    "isActive": true
  },
  {
    "id": "steam",
    "category": "diger",
    "status": "uygun",
    "brandName": "Steam",
    "parentCompany": "Valve Corporation",
    "reason": "Kaynak uygun olarak listeliyor; oyunların yayıncısı ve içeriği ayrıca değerlendirilmelidir.",
    "sourceUrl": "https://boykotdedektifi.com/b/steam-2686",
    "sourceName": "Boykot Dedektifi",
    "alternatives": [
      {
        "name": "Yerel bağımsız üretici veya esnaf",
        "note": "Bir marka onayı değildir. Sahiplik ve ürün kaynağını satıcıdan doğrula."
      }
    ],
    "isActive": true
  }
];
export function getWeeklyFocus(): BoycottItem | undefined {
  const active = BOYCOTT_ITEMS.filter(item => item.status === 'boykot' && item.isActive);
  return active[Math.floor(Date.now() / 604800000) % active.length];
}
