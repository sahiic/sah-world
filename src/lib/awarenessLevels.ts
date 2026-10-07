export type AwarenessLevel = {
  level: number
  name: string
  icon: string
  requirement: string
  xpThreshold: number
}

export const AWARENESS_LEVELS: AwarenessLevel[] = [
  { level: 1, name: 'Gözlemci', icon: 'eye', requirement: 'İlk anlatıyı oku', xpThreshold: 0 },
  { level: 2, name: 'Öğrenci', icon: 'book', requirement: 'İlk testi geç', xpThreshold: 50 },
  { level: 3, name: 'Kaynak Takipçisi', icon: 'link', requirement: '5+ kaynak incele', xpThreshold: 150 },
  { level: 4, name: 'Ses Yükselt', icon: 'speakerphone', requirement: 'İlk paylaşımı yap', xpThreshold: 300 },
  { level: 5, name: 'Bilinçli Tüketici', icon: 'shopping-cart-off', requirement: 'Boykot karnesi başlat', xpThreshold: 500 },
  { level: 6, name: 'Dayanışma Elçisi', icon: 'heart-handshake', requirement: 'Haftalık görevleri tamamla', xpThreshold: 800 },
  { level: 7, name: 'Hafıza Koruyucusu', icon: 'shield-check', requirement: 'Tüm coğrafyaları tamamla', xpThreshold: 1200 },
]

export function getAwarenessLevel(xp: number): { current: AwarenessLevel; next: AwarenessLevel | null; progress: number } {
  let currentIndex = 0
  for (let i = AWARENESS_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= AWARENESS_LEVELS[i].xpThreshold) {
      currentIndex = i
      break
    }
  }
  const current = AWARENESS_LEVELS[currentIndex]
  const next = AWARENESS_LEVELS[currentIndex + 1] ?? null
  const progress = next
    ? (xp - current.xpThreshold) / (next.xpThreshold - current.xpThreshold)
    : 1
  return { current, next, progress: Math.min(progress, 1) }
}
