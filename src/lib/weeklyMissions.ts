export type MissionAction = 'read' | 'share' | 'boycott' | 'learn' | 'connect' | 'pray'

export type WeeklyMission = {
  id: string
  title: string
  description: string
  actionType: MissionAction
  xhReward: number
  icon: string
}

export const MISSION_POOL: WeeklyMission[] = [
  { id: 'm01', title: 'Kaynağıyla bilgi aktar', description: 'Bu hafta 1 kişiye kaynak bağlantısıyla birlikte Filistin veya Doğu Türkistan hakkında bilgi aktar.', actionType: 'share', xhReward: 15, icon: 'share-3' },
  { id: 'm02', title: 'Boykot alternatifi keşfet', description: '1 boykot markasının yerli alternatifini bul ve bu hafta onu tercih et.', actionType: 'boycott', xhReward: 10, icon: 'shopping-cart-off' },
  { id: 'm03', title: 'Tarihten 1 kavram öğren', description: 'Filistin veya Doğu Türkistan tarihinden bilmediğin 1 kavramı kaynağından oku.', actionType: 'learn', xhReward: 10, icon: 'book' },
  { id: 'm04', title: 'Aile sofrasında konuş', description: 'Aile veya arkadaş ortamında 5 dakika Filistin veya Doğu Türkistan konusunu konuş.', actionType: 'connect', xhReward: 15, icon: 'users' },
  { id: 'm05', title: 'Mazlumlar için dua et', description: 'Mazlum coğrafyalardaki kardeşlerimiz için bugün bir dua oku.', actionType: 'pray', xhReward: 10, icon: 'moon-stars' },
  { id: 'm06', title: '1 kaynak incele', description: 'Dijital Hafıza veya TRT Haber\'den Doğu Türkistan hakkında 1 kaynak oku.', actionType: 'read', xhReward: 10, icon: 'file-description' },
  { id: 'm07', title: 'Sosyal medyada paylaş', description: 'SAH World\'deki kaynaklı içeriği sosyal medya hesabında paylaş.', actionType: 'share', xhReward: 15, icon: 'brand-instagram' },
  { id: 'm08', title: 'Bilgi testini çöz', description: 'Filistin veya Doğu Türkistan bilgi testini tamamla.', actionType: 'learn', xhReward: 10, icon: 'bulb' },
  { id: 'm09', title: 'Yerli ürün tercih et', description: 'Bu hafta market alışverişinde en az 3 yerli ürün tercih et.', actionType: 'boycott', xhReward: 10, icon: 'leaf' },
  { id: 'm10', title: 'Bir tanıklık oku', description: 'Filistin veya Doğu Türkistan\'dan doğrulanmış bir tanıklığı kaynağından oku.', actionType: 'read', xhReward: 10, icon: 'heart-handshake' },
  { id: 'm11', title: 'Nekbe\'yi anlat', description: '1 kişiye Nekbe\'nin ne olduğunu kaynak göstererek açıkla.', actionType: 'share', xhReward: 15, icon: 'route' },
  { id: 'm12', title: 'Çocuğuna/kardeşine öğret', description: 'Yaşına uygun şekilde bir çocuğa veya gence Filistin hakkında bilgi ver.', actionType: 'connect', xhReward: 15, icon: 'school' },
  { id: 'm13', title: 'Uygur kültürünü tanı', description: 'Uygur Türklerinin dili, müziği veya sanatı hakkında 1 kaynak oku.', actionType: 'learn', xhReward: 10, icon: 'palette' },
  { id: 'm14', title: 'Boykot listesini güncelle', description: 'SAH World boykot rehberinden en az 3 markayı "boykot ediyorum" olarak işaretle.', actionType: 'boycott', xhReward: 10, icon: 'ban' },
  { id: 'm15', title: 'Zaman çizgisini incele', description: 'Filistin veya Doğu Türkistan zaman çizgisindeki tüm dönemleri oku.', actionType: 'read', xhReward: 10, icon: 'timeline' },
  { id: 'm16', title: 'WhatsApp\'ta paylaş', description: 'Kaynaklı bir bilgiyi WhatsApp grubunda veya bir yakınına gönder.', actionType: 'share', xhReward: 15, icon: 'brand-whatsapp' },
  { id: 'm17', title: 'Cuma duası et', description: 'Cuma namazında mazlum coğrafyalar için özel dua et.', actionType: 'pray', xhReward: 10, icon: 'building-mosque' },
  { id: 'm18', title: 'Sumud\'u öğren', description: '"Sumud" (sebat) kavramının ne anlama geldiğini ve örneklerini oku.', actionType: 'learn', xhReward: 10, icon: 'shield-check' },
  { id: 'm19', title: 'Yardım kuruluşu incele', description: 'Kızılay veya UNICEF\'in Filistin çalışmalarını incele.', actionType: 'read', xhReward: 10, icon: 'heart-handshake' },
  { id: 'm20', title: 'Bilinçli tüketici ol', description: 'Market alışverişinde barkod kontrolü yap, boykot edilen marka alıp almadığını kontrol et.', actionType: 'boycott', xhReward: 10, icon: 'scan' },
  { id: 'm21', title: 'Haber takibi yap', description: 'Güvenilir kaynaktan Filistin veya Doğu Türkistan hakkında güncel haber oku.', actionType: 'read', xhReward: 10, icon: 'news' },
]

export function getWeeklyMissions(count = 3): WeeklyMission[] {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
  const start = (weekNumber * count) % MISSION_POOL.length
  const result: WeeklyMission[] = []
  for (let i = 0; i < count; i++) {
    result.push(MISSION_POOL[(start + i) % MISSION_POOL.length])
  }
  return result
}

export function getCurrentWeekNumber(): number {
  return Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
}
