export type BoycottCategory = 'gida' | 'icecek' | 'teknoloji' | 'moda' | 'kozmetik' | 'market' | 'diger'

export type BoycottItem = {
  id: string
  category: BoycottCategory
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
  { id: 'teknoloji', label: 'Teknoloji', icon: 'device-mobile' },
  { id: 'moda', label: 'Moda', icon: 'shirt' },
  { id: 'kozmetik', label: 'Kozmetik', icon: 'sparkles' },
  { id: 'market', label: 'Market', icon: 'building-store' },
  { id: 'diger', label: 'Diğer', icon: 'dots' },
]

export const BOYCOTT_SOURCE = {
  name: 'BDS Hareketi Resmi Boykot Listesi',
  url: 'https://bdsmovement.net/get-involved/what-to-boycott',
} as const

export const BOYCOTT_ITEMS: BoycottItem[] = [
  // === GIDA ===
  {
    id: 'nestle', category: 'gida', brandName: 'Nestlé', parentCompany: 'Nestlé S.A.',
    reason: 'İsrail\'deki Osem gıda şirketinin çoğunluk hissesine sahip. BDS hedef listesinde yer alıyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Ülker', note: 'Yerli gıda markası' },
      { name: 'Eti', note: 'Yerli atıştırmalık ve bisküvi' },
    ], isActive: true,
  },
  {
    id: 'danone', category: 'gida', brandName: 'Danone', parentCompany: 'Danone S.A.',
    reason: 'İsrail\'de Strauss Group ile ortaklığı bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Sütaş', note: 'Yerli süt ürünleri' },
      { name: 'Pınar', note: 'Yerli süt ve gıda' },
    ], isActive: true,
  },
  {
    id: 'mondelez', category: 'gida', brandName: 'Mondelēz (Oreo, Cadbury, Toblerone)', parentCompany: 'Mondelēz International',
    reason: 'İsrail\'de üretim ve dağıtım ağına sahip.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Eti', note: 'Yerli bisküvi ve çikolata' },
      { name: 'Şölen', note: 'Yerli çikolata üreticisi' },
    ], isActive: true,
  },
  {
    id: 'unilever-food', category: 'gida', brandName: 'Knorr / Algida', parentCompany: 'Unilever',
    reason: 'İsrail\'deki operasyonları nedeniyle BDS hedef listesinde.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Bizim Mutfak', note: 'Yerli çorba ve sos' },
      { name: 'Golf Dondurma', note: 'Yerli dondurma' },
    ], isActive: true,
  },
  {
    id: 'kelloggs', category: 'gida', brandName: "Kellogg's (Pringles)", parentCompany: "Kellanova",
    reason: 'İsrail\'de satış ve dağıtım ağı bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Eti Cips', note: 'Yerli cips markası' },
      { name: 'Doritos (yerli üretim)', note: 'Frito-Lay Türkiye' },
    ], isActive: true,
  },

  // === İÇECEK ===
  {
    id: 'coca-cola', category: 'icecek', brandName: 'Coca-Cola', parentCompany: 'The Coca-Cola Company',
    reason: 'İsrail\'de üretim tesisleri ve uzun süreli yatırımları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Cola Turka', note: 'Yerli kola' },
      { name: 'Uludağ Gazoz', note: 'Yerli gazlı içecek' },
    ], isActive: true,
  },
  {
    id: 'pepsi', category: 'icecek', brandName: 'PepsiCo (Pepsi, Lay\'s, Doritos)', parentCompany: 'PepsiCo Inc.',
    reason: 'İsrail operasyonları ve SodaStream satın alımı (2018).',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Cola Turka', note: 'Yerli kola' },
      { name: 'Doğadan', note: 'Yerli içecek' },
    ], isActive: true,
  },
  {
    id: 'starbucks', category: 'icecek', brandName: 'Starbucks', parentCompany: 'Starbucks Corp.',
    reason: 'İsrail yanlısı açıklamaları ve lobicilik faaliyetleri nedeniyle boykot çağrısında.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Kahve Dünyası', note: 'Yerli kahve zinciri' },
      { name: 'Kronotrop', note: 'Yerel özel kahveci' },
    ], isActive: true,
  },
  {
    id: 'mcdonalds', category: 'icecek', brandName: "McDonald's", parentCompany: "McDonald's Corp.",
    reason: 'İsrail\'deki franchise\'ları İsrail ordusuna ücretsiz yemek sağladı.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Usta Dönerci', note: 'Yerel restoranlar' },
      { name: 'Çiğköfteci Ali Usta', note: 'Yerli fast food' },
    ], isActive: true,
  },

  // === TEKNOLOJİ ===
  {
    id: 'hp', category: 'teknoloji', brandName: 'HP (Hewlett-Packard)', parentCompany: 'HP Inc.',
    reason: 'İsrail ordusuna ve kontrol noktalarına teknoloji sağlıyor. BDS öncelikli hedef.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Casper', note: 'Yerli bilgisayar markası' },
      { name: 'Monster', note: 'Yerli laptop markası' },
    ], isActive: true,
  },
  {
    id: 'siemens', category: 'teknoloji', brandName: 'Siemens', parentCompany: 'Siemens AG',
    reason: 'İsrail\'deki demiryolu projeleri ve altyapı işleri ile bağlantılı.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Arçelik', note: 'Yerli teknoloji ve beyaz eşya' },
      { name: 'Vestel', note: 'Yerli elektronik üreticisi' },
    ], isActive: true,
  },
  {
    id: 'intel', category: 'teknoloji', brandName: 'Intel', parentCompany: 'Intel Corp.',
    reason: 'İsrail\'deki en büyük özel sektör işvereni; Kiryat Gat ve Haifa\'da üretim tesisleri.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'AMD', note: 'Alternatif işlemci üreticisi' },
    ], isActive: true,
  },

  // === MODA ===
  {
    id: 'zara', category: 'moda', brandName: 'Zara', parentCompany: 'Inditex',
    reason: 'İsrail\'de mağazaları ve tedarik ilişkileri bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'LC Waikiki', note: 'Yerli moda markası' },
      { name: 'DeFacto', note: 'Yerli giyim markası' },
    ], isActive: true,
  },
  {
    id: 'hm', category: 'moda', brandName: 'H&M', parentCompany: 'H&M Group',
    reason: 'İsrail\'de mağazaları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Koton', note: 'Yerli moda markası' },
      { name: 'Mavi', note: 'Yerli jean ve giyim' },
    ], isActive: true,
  },
  {
    id: 'nike', category: 'moda', brandName: 'Nike', parentCompany: 'Nike Inc.',
    reason: 'İsrail\'deki distribütörleri ve sponsorluk ilişkileri.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Kinetix', note: 'Yerli spor ayakkabı' },
      { name: 'Hummel', note: 'Danimarkalı alternatif (Filistin\'i destekliyor)' },
    ], isActive: true,
  },
  {
    id: 'puma', category: 'moda', brandName: 'Puma', parentCompany: 'Puma SE',
    reason: 'İsrail Futbol Federasyonu\'nun sponsoru (yasadışı yerleşim takımları dahil). BDS öncelikli hedef.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Kinetix', note: 'Yerli spor markası' },
      { name: 'Hummel', note: 'Filistin\'i tanıyan Danimarkalı marka' },
    ], isActive: true,
  },

  // === KOZMETİK ===
  {
    id: 'loreal', category: 'kozmetik', brandName: "L'Oréal", parentCompany: "L'Oréal S.A.",
    reason: 'İsrail\'de fabrikaları ve operasyonları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Flormar', note: 'Yerli kozmetik markası' },
      { name: 'Golden Rose', note: 'Yerli makyaj markası' },
    ], isActive: true,
  },
  {
    id: 'pg', category: 'kozmetik', brandName: 'P&G (Gillette, Oral-B, Pantene)', parentCompany: 'Procter & Gamble',
    reason: 'İsrail\'de uzun süreli operasyonları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Evyap (Duru, Fax)', note: 'Yerli kişisel bakım' },
      { name: 'Hunca (Hobby)', note: 'Yerli kozmetik' },
    ], isActive: true,
  },
  {
    id: 'estee-lauder', category: 'kozmetik', brandName: 'Estée Lauder (MAC, Clinique)', parentCompany: 'Estée Lauder Companies',
    reason: 'Kurucunun ailesi İsrail\'e önemli bağışçılar arasında.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Flormar', note: 'Yerli alternatif' },
      { name: 'Gratis markaları', note: 'Yerli kozmetik seçenekleri' },
    ], isActive: true,
  },
  {
    id: 'johnson', category: 'kozmetik', brandName: "Johnson & Johnson", parentCompany: 'Kenvue / J&J',
    reason: 'İsrail\'de operasyonları ve yatırımları bulunuyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Dalin', note: 'Yerli bebek bakım markası' },
      { name: 'Sleepy', note: 'Yerli bebek ürünleri' },
    ], isActive: true,
  },

  // === MARKET ===
  {
    id: 'carrefour', category: 'market', brandName: 'Carrefour', parentCompany: 'Carrefour S.A.',
    reason: 'İsrail\'deki franchise ortaklıkları ve yasadışı yerleşimlerde mağaza açma ihtimali.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'BİM', note: 'Yerli market zinciri' },
      { name: 'A101', note: 'Yerli market zinciri' },
      { name: 'ŞOK', note: 'Yerli market zinciri' },
    ], isActive: true,
  },

  // === DİĞER ===
  {
    id: 'booking', category: 'diger', brandName: 'Booking.com', parentCompany: 'Booking Holdings',
    reason: 'Yasadışı İsrail yerleşimlerindeki konaklama yerlerini listeliyor. BDS hedef listesinde.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Jolly', note: 'Yerli seyahat platformu' },
      { name: 'Tatilbudur', note: 'Yerli tatil platformu' },
    ], isActive: true,
  },
  {
    id: 'airbnb', category: 'diger', brandName: 'Airbnb', parentCompany: 'Airbnb Inc.',
    reason: 'Daha önce yerleşimlerdeki listelemeyi kaldırıp geri ekledi.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Tatilbudur', note: 'Yerli konaklama' },
    ], isActive: true,
  },
  {
    id: 'caterpillar', category: 'diger', brandName: 'Caterpillar (CAT)', parentCompany: 'Caterpillar Inc.',
    reason: 'İş makineleri Filistin evlerinin yıkımında kullanılıyor. BDS öncelikli hedef.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'HİDROMEK', note: 'Yerli iş makinesi üreticisi' },
    ], isActive: true,
  },
  {
    id: 'sabra', category: 'gida', brandName: 'Sabra Hummus', parentCompany: 'Strauss Group / PepsiCo',
    reason: 'Strauss Group İsrail ordusunun Golani Tugayı\'nı destekliyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Ev yapımı humus', note: 'Nohut + tahin + limon' },
    ], isActive: true,
  },
  {
    id: 'ahava', category: 'kozmetik', brandName: 'Ahava', parentCompany: 'Ahava Dead Sea Laboratories',
    reason: 'İşgal altındaki Batı Şeria\'daki yasadışı yerleşimde üretim yapıyor.',
    sourceUrl: 'https://bdsmovement.net/get-involved/what-to-boycott',
    sourceName: 'BDS Movement', alternatives: [
      { name: 'Thalia', note: 'Yerli doğal kozmetik' },
    ], isActive: true,
  },
]

export function getWeeklyFocus(): BoycottItem {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const active = BOYCOTT_ITEMS.filter((item) => item.isActive)
  return active[weekNumber % active.length]
}
