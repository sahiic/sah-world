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
  alternatives: { name: string; note: string }[]
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

export const BOYCOTT_SOURCE = {
  name: 'BDS Hareketi Resmi Boykot Listesi',
  url: 'https://bdsmovement.net/get-involved/what-to-boycott',
} as const

export const BOYCOTT_ITEMS: BoycottItem[] = [
  // === GIDA ===
  {
    id: 'nestle', category: 'gida', status: 'boykot', brandName: 'Nestlé', parentCompany: 'Nestlé S.A.',
    reason: 'İsrail\'deki Osem gıda şirketinin çoğunluk hissesine sahip. BDS hedef listesinde yer alıyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Ülker', note: 'Yerli gıda markası' },
      { name: 'Eti', note: 'Yerli atıştırmalık ve bisküvi' },
    ], isActive: true,
  },
  {
    id: 'danone', category: 'gida', status: 'boykot', brandName: 'Danone', parentCompany: 'Danone S.A.',
    reason: 'İsrail\'de Strauss Group ile ortaklığı bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Sütaş', note: 'Yerli süt ürünleri' },
      { name: 'Pınar', note: 'Yerli süt ve gıda' },
    ], isActive: true,
  },
  {
    id: 'mondelez', category: 'gida', status: 'boykot', brandName: 'Mondelēz (Oreo, Cadbury, Toblerone)', parentCompany: 'Mondelēz International',
    reason: 'İsrail\'de üretim ve dağıtım ağına sahip.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Eti', note: 'Yerli bisküvi ve çikolata' },
      { name: 'Şölen', note: 'Yerli çikolata üreticisi' },
    ], isActive: true,
  },
  {
    id: 'unilever-food', category: 'gida', status: 'boykot', brandName: 'Knorr / Algida', parentCompany: 'Unilever',
    reason: 'İsrail\'deki operasyonları nedeniyle BDS hedef listesinde.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Bizim Mutfak', note: 'Yerli çorba ve sos' },
      { name: 'Golf Dondurma', note: 'Yerli dondurma' },
    ], isActive: true,
  },
  {
    id: 'kelloggs', category: 'gida', status: 'boykot', brandName: "Kellogg's (Pringles)", parentCompany: "Kellanova",
    reason: 'İsrail\'de satış ve dağıtım ağı bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Eti Cips', note: 'Yerli cips markası' },
    ], isActive: true,
  },
  {
    id: 'sabra', category: 'gida', status: 'boykot', brandName: 'Sabra Hummus', parentCompany: 'Strauss Group / PepsiCo',
    reason: 'Strauss Group İsrail ordusunun Golani Tugayı\'nı destekliyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Ev yapımı humus', note: 'Nohut + tahin + limon' },
    ], isActive: true,
  },
  {
    id: 'ulker', category: 'gida', status: 'uygun', brandName: 'Ülker', parentCompany: 'Yıldız Holding',
    reason: 'Türkiye merkezli yerli gıda üreticisi.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },
  {
    id: 'eti', category: 'gida', status: 'uygun', brandName: 'Eti', parentCompany: 'Eti Gıda',
    reason: 'Türkiye merkezli yerli atıştırmalık ve bisküvi üreticisi.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },
  {
    id: 'solen', category: 'gida', status: 'uygun', brandName: 'Şölen', parentCompany: 'Şölen Çikolata',
    reason: 'Türkiye merkezli yerli çikolata üreticisi.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },
  {
    id: 'yayla', category: 'gida', status: 'uygun', brandName: 'Yayla', parentCompany: 'Yayla Agro Gıda',
    reason: 'Türkiye merkezli bakliyat ve hazır gıda markası.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },

  // === İÇECEK ===
  {
    id: 'coca-cola', category: 'icecek', status: 'boykot', brandName: 'Coca-Cola', parentCompany: 'The Coca-Cola Company',
    reason: 'İsrail\'de üretim tesisleri ve uzun süreli yatırımları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Cola Turka', note: 'Yerli kola' },
      { name: 'Uludağ Gazoz', note: 'Yerli gazlı içecek' },
    ], isActive: true,
  },
  {
    id: 'pepsi', category: 'icecek', status: 'boykot', brandName: 'PepsiCo (Pepsi, Lay\'s, Doritos)', parentCompany: 'PepsiCo Inc.',
    reason: 'İsrail operasyonları ve SodaStream satın alımı (2018).',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Cola Turka', note: 'Yerli kola' },
      { name: 'Doğadan', note: 'Yerli içecek' },
    ], isActive: true,
  },
  {
    id: 'starbucks', category: 'icecek', status: 'boykot', brandName: 'Starbucks', parentCompany: 'Starbucks Corp.',
    reason: 'İsrail yanlısı açıklamaları ve lobicilik faaliyetleri nedeniyle boykot çağrısında.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Kahve Dünyası', note: 'Yerli kahve zinciri' },
      { name: 'Kronotrop', note: 'Yerel özel kahveci' },
    ], isActive: true,
  },
  {
    id: 'cola-turka', category: 'icecek', status: 'uygun', brandName: 'Cola Turka', parentCompany: 'Anadolu Efes',
    reason: 'Türkiye merkezli yerli kola markası.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },
  {
    id: 'black-bruin', category: 'icecek', status: 'uygun', brandName: 'Black Bruin', parentCompany: 'İçecek Sanayi',
    reason: 'Yerli enerji içeceği markası.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },

  // === FAST FOOD ===
  {
    id: 'mcdonalds', category: 'fastfood', status: 'boykot', brandName: "McDonald's", parentCompany: "McDonald's Corp.",
    reason: 'İsrail\'deki franchise\'ları İsrail ordusuna ücretsiz yemek sağladı. Dünya genelinde yoğun boykot çağrısı var.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Çiğköfteci Ali Usta', note: 'Yerli fast food' },
      { name: 'Usta Dönerci', note: 'Yerel restoranlar' },
    ], isActive: true,
  },
  {
    id: 'burger-king', category: 'fastfood', status: 'boykot', brandName: 'Burger King', parentCompany: 'Restaurant Brands International',
    reason: 'İsrail\'de franchise mağazaları aktif olarak faaliyet gösteriyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [
      { name: 'Usta Dönerci', note: 'Yerel restoranlar' },
    ], isActive: true,
  },
  {
    id: 'dominos', category: 'fastfood', status: 'boykot', brandName: "Domino's Pizza", parentCompany: "Domino's Pizza Inc.",
    reason: 'ABD merkezli uluslararası pizza zinciri. İsrail\'de franchise mağazaları bulunuyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [
      { name: 'Pizza Lazza', note: 'Yerli pizza zinciri' },
    ], isActive: true,
  },
  {
    id: 'getir', category: 'fastfood', status: 'boykot', brandName: 'Getir', parentCompany: 'Getir Perakende Lojistik',
    reason: 'Türkiye merkezli hızlı teslimat platformu; yabancı yatırım ortaklıkları sorgulanıyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [
      { name: 'Yerel bakkal', note: 'Mahalle bakkalı' },
    ], isActive: true,
  },

  // === TEKNOLOJİ ===
  {
    id: 'hp', category: 'teknoloji', status: 'boykot', brandName: 'HP (Hewlett-Packard)', parentCompany: 'HP Inc.',
    reason: 'İsrail ordusuna ve kontrol noktalarına teknoloji sağlıyor. BDS öncelikli hedef.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Casper', note: 'Yerli bilgisayar markası' },
      { name: 'Monster', note: 'Yerli laptop markası' },
    ], isActive: true,
  },
  {
    id: 'siemens', category: 'teknoloji', status: 'boykot', brandName: 'Siemens', parentCompany: 'Siemens AG',
    reason: 'İsrail\'deki demiryolu projeleri ve altyapı işleri ile bağlantılı.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Arçelik', note: 'Yerli teknoloji ve beyaz eşya' },
      { name: 'Vestel', note: 'Yerli elektronik üreticisi' },
    ], isActive: true,
  },
  {
    id: 'intel', category: 'teknoloji', status: 'boykot', brandName: 'Intel', parentCompany: 'Intel Corp.',
    reason: 'İsrail\'deki en büyük özel sektör işvereni; Kiryat Gat ve Haifa\'da üretim tesisleri.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'AMD', note: 'Alternatif işlemci üreticisi' },
    ], isActive: true,
  },
  {
    id: 'apple', category: 'teknoloji', status: 'boykot', brandName: 'Apple', parentCompany: 'Apple Inc.',
    reason: 'ABD merkezli çok uluslu şirket. İsrail\'de Ar-Ge merkezleri ve operasyonları bulunuyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [
      { name: 'Samsung', note: 'Güney Kore merkezli alternatif' },
      { name: 'Casper', note: 'Yerli bilgisayar markası' },
    ], isActive: true,
  },
  {
    id: 'samsung', category: 'teknoloji', status: 'uygun', brandName: 'Samsung', parentCompany: 'Samsung Electronics',
    reason: 'Güney Kore merkezli teknoloji şirketi. BDS hedef listesinde yer almıyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },
  {
    id: 'amd', category: 'teknoloji', status: 'uygun', brandName: 'AMD', parentCompany: 'Advanced Micro Devices',
    reason: 'ABD merkezli işlemci üreticisi. BDS hedef listesinde yer almıyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },

  // === MODA ===
  {
    id: 'zara', category: 'moda', status: 'boykot', brandName: 'Zara', parentCompany: 'Inditex',
    reason: 'İsrail\'de mağazaları ve tedarik ilişkileri bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'LC Waikiki', note: 'Yerli moda markası' },
      { name: 'DeFacto', note: 'Yerli giyim markası' },
    ], isActive: true,
  },
  {
    id: 'hm', category: 'moda', status: 'boykot', brandName: 'H&M', parentCompany: 'H&M Group',
    reason: 'İsrail\'de mağazaları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Koton', note: 'Yerli moda markası' },
      { name: 'Mavi', note: 'Yerli jean ve giyim' },
    ], isActive: true,
  },
  {
    id: 'nike', category: 'moda', status: 'boykot', brandName: 'Nike', parentCompany: 'Nike Inc.',
    reason: 'İsrail\'deki distribütörleri ve sponsorluk ilişkileri.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Kinetix', note: 'Yerli spor ayakkabı' },
      { name: 'Hummel', note: 'Danimarkalı alternatif (Filistin\'i destekliyor)' },
    ], isActive: true,
  },
  {
    id: 'puma', category: 'moda', status: 'boykot', brandName: 'Puma', parentCompany: 'Puma SE',
    reason: 'İsrail Futbol Federasyonu\'nun sponsoru (yasadışı yerleşim takımları dahil). BDS öncelikli hedef.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Kinetix', note: 'Yerli spor markası' },
      { name: 'Hummel', note: 'Filistin\'i tanıyan Danimarkalı marka' },
    ], isActive: true,
  },

  // === KOZMETİK ===
  {
    id: 'loreal', category: 'kozmetik', status: 'boykot', brandName: "L'Oréal", parentCompany: "L'Oréal S.A.",
    reason: 'İsrail\'de fabrikaları ve operasyonları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Flormar', note: 'Yerli kozmetik markası' },
      { name: 'Golden Rose', note: 'Yerli makyaj markası' },
    ], isActive: true,
  },
  {
    id: 'pg', category: 'kozmetik', status: 'boykot', brandName: 'P&G (Gillette, Oral-B, Pantene)', parentCompany: 'Procter & Gamble',
    reason: 'İsrail\'de uzun süreli operasyonları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Evyap (Duru, Fax)', note: 'Yerli kişisel bakım' },
      { name: 'Hunca (Hobby)', note: 'Yerli kozmetik' },
    ], isActive: true,
  },
  {
    id: 'estee-lauder', category: 'kozmetik', status: 'boykot', brandName: 'Estée Lauder (MAC, Clinique)', parentCompany: 'Estée Lauder Companies',
    reason: 'Kurucunun ailesi İsrail\'e önemli bağışçılar arasında.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Flormar', note: 'Yerli alternatif' },
      { name: 'Gratis markaları', note: 'Yerli kozmetik seçenekleri' },
    ], isActive: true,
  },
  {
    id: 'johnson', category: 'kozmetik', status: 'boykot', brandName: "Johnson & Johnson", parentCompany: 'Kenvue / J&J',
    reason: 'İsrail\'de operasyonları ve yatırımları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Dalin', note: 'Yerli bebek bakım markası' },
      { name: 'Sleepy', note: 'Yerli bebek ürünleri' },
    ], isActive: true,
  },
  {
    id: 'ahava', category: 'kozmetik', status: 'boykot', brandName: 'Ahava', parentCompany: 'Ahava Dead Sea Laboratories',
    reason: 'İşgal altındaki Batı Şeria\'daki yasadışı yerleşimde üretim yapıyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Thalia', note: 'Yerli doğal kozmetik' },
    ], isActive: true,
  },
  {
    id: 'flormar', category: 'kozmetik', status: 'uygun', brandName: 'Flormar', parentCompany: 'Flormar Kozmetik',
    reason: 'Türkiye merkezli yerli kozmetik markası.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },

  // === MARKET ===
  {
    id: 'carrefour', category: 'market', status: 'boykot', brandName: 'Carrefour', parentCompany: 'Carrefour S.A.',
    reason: 'İsrail\'deki franchise ortaklıkları ve yasadışı yerleşimlerde mağaza açma ihtimali.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'BİM', note: 'Yerli market zinciri' },
      { name: 'A101', note: 'Yerli market zinciri' },
      { name: 'ŞOK', note: 'Yerli market zinciri' },
    ], isActive: true,
  },
  {
    id: 'a101', category: 'market', status: 'supheli', brandName: 'A101', parentCompany: 'Turgut Aydın Holding',
    reason: '2008\'de kurulan A101 Yeni Mağazacılık A.Ş. ortaklık yapısı itibarıyla sorgulanıyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [
      { name: 'BİM', note: 'Yerli market zinciri' },
    ], isActive: true,
  },

  // === DİĞER ===
  {
    id: 'booking', category: 'diger', status: 'boykot', brandName: 'Booking.com', parentCompany: 'Booking Holdings',
    reason: 'Yasadışı İsrail yerleşimlerindeki konaklama yerlerini listeliyor. BDS hedef listesinde.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Jolly', note: 'Yerli seyahat platformu' },
      { name: 'Tatilbudur', note: 'Yerli tatil platformu' },
    ], isActive: true,
  },
  {
    id: 'airbnb', category: 'diger', status: 'boykot', brandName: 'Airbnb', parentCompany: 'Airbnb Inc.',
    reason: 'Daha önce yerleşimlerdeki listelemeyi kaldırıp geri ekledi.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Tatilbudur', note: 'Yerli konaklama' },
    ], isActive: true,
  },
  {
    id: 'caterpillar', category: 'diger', status: 'boykot', brandName: 'Caterpillar (CAT)', parentCompany: 'Caterpillar Inc.',
    reason: 'İş makineleri Filistin evlerinin yıkımında kullanılıyor. BDS öncelikli hedef.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'HİDROMEK', note: 'Yerli iş makinesi üreticisi' },
    ], isActive: true,
  },
  {
    id: 'steam', category: 'diger', status: 'uygun', brandName: 'Steam', parentCompany: 'Valve Corporation',
    reason: 'Valve\'e ait dijital oyun satış platformu. BDS hedef listesinde yer almıyor.',
    sourceUrl: 'https://boykotdedektifi.com/',
    sourceName: 'Boykot Dedektifi', alternatives: [], isActive: true,
  },
]

export function getWeeklyFocus(): BoycottItem {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const active = BOYCOTT_ITEMS.filter((item) => item.status === 'boykot' && item.isActive)
  return active[weekNumber % active.length]
}
