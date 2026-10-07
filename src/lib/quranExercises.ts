export type CompletionQuestion = {
  surahId: number;
  ayah: number;
  start: string;
  answer: string;
  options: string[];
  difficulty: 1 | 2 | 3;
};

export type TajweedQuestion = {
  text: string;
  rule: string;
  surahId: number;
  ayah: number;
  explanation: string;
  difficulty: 1 | 2 | 3;
};

export type OrderingSurah = {
  surahId: number;
  name: string;
  verses: Array<{ id: number; text: string }>;
  difficulty: 1 | 2 | 3;
};

export const COMPLETION_QUESTIONS: CompletionQuestion[] = [
  // Fâtiha (1)
  { surahId: 1, ayah: 1, start: "بِسْمِ اللَّهِ", answer: "الرَّحْمَٰنِ الرَّحِيمِ", options: ["الرَّحْمَٰنِ الرَّحِيمِ", "الْعَالَمِينَ", "الْمُسْتَقِيمَ", "نَسْتَعِينُ"], difficulty: 1 },
  { surahId: 1, ayah: 2, start: "الْحَمْدُ لِلَّهِ", answer: "رَبِّ الْعَالَمِينَ", options: ["رَبِّ الْعَالَمِينَ", "مَالِكِ يَوْمِ الدِّينِ", "الرَّحْمَٰنِ الرَّحِيمِ", "صِرَاطَ الْمُسْتَقِيمَ"], difficulty: 1 },
  { surahId: 1, ayah: 4, start: "مَالِكِ يَوْمِ", answer: "الدِّينِ", options: ["الدِّينِ", "الْعَالَمِينَ", "الرَّحِيمِ", "الْمُسْتَقِيمَ"], difficulty: 1 },
  { surahId: 1, ayah: 5, start: "إِيَّاكَ نَعْبُدُ", answer: "وَإِيَّاكَ نَسْتَعِينُ", options: ["وَإِيَّاكَ نَسْتَعِينُ", "اهْدِنَا الصِّرَاطَ", "رَبِّ الْعَالَمِينَ", "مَالِكِ يَوْمِ الدِّينِ"], difficulty: 1 },
  { surahId: 1, ayah: 6, start: "اهْدِنَا الصِّرَاطَ", answer: "الْمُسْتَقِيمَ", options: ["الْمُسْتَقِيمَ", "الرَّحِيمِ", "الْعَالَمِينَ", "نَسْتَعِينُ"], difficulty: 1 },
  // İhlâs (112)
  { surahId: 112, ayah: 1, start: "قُلْ هُوَ اللَّهُ", answer: "أَحَدٌ", options: ["أَحَدٌ", "الصَّمَدُ", "كُفُوًا أَحَدٌ", "يُولَدْ"], difficulty: 1 },
  { surahId: 112, ayah: 2, start: "اللَّهُ", answer: "الصَّمَدُ", options: ["الصَّمَدُ", "أَحَدٌ", "يُولَدْ", "الرَّحِيمِ"], difficulty: 1 },
  { surahId: 112, ayah: 3, start: "لَمْ يَلِدْ", answer: "وَلَمْ يُولَدْ", options: ["وَلَمْ يُولَدْ", "كُفُوًا أَحَدٌ", "الصَّمَدُ", "أَحَدٌ"], difficulty: 1 },
  { surahId: 112, ayah: 4, start: "وَلَمْ يَكُن لَّهُ", answer: "كُفُوًا أَحَدٌ", options: ["كُفُوًا أَحَدٌ", "وَلَمْ يُولَدْ", "أَحَدٌ", "الصَّمَدُ"], difficulty: 1 },
  // Felâk (113)
  { surahId: 113, ayah: 1, start: "قُلْ أَعُوذُ بِرَبِّ", answer: "الْفَلَقِ", options: ["الْفَلَقِ", "النَّاسِ", "الْعَالَمِينَ", "الرَّحِيمِ"], difficulty: 1 },
  { surahId: 113, ayah: 2, start: "مِن شَرِّ", answer: "مَا خَلَقَ", options: ["مَا خَلَقَ", "غَاسِقٍ", "النَّفَّاثَاتِ", "حَاسِدٍ"], difficulty: 2 },
  { surahId: 113, ayah: 3, start: "وَمِن شَرِّ غَاسِقٍ", answer: "إِذَا وَقَبَ", options: ["إِذَا وَقَبَ", "إِذَا حَسَدَ", "مَا خَلَقَ", "فِي الْعُقَدِ"], difficulty: 2 },
  // Nâs (114)
  { surahId: 114, ayah: 1, start: "قُلْ أَعُوذُ بِرَبِّ", answer: "النَّاسِ", options: ["النَّاسِ", "الْفَلَقِ", "الْمَلِكِ", "الْإِلَٰهِ"], difficulty: 1 },
  { surahId: 114, ayah: 2, start: "مَلِكِ", answer: "النَّاسِ", options: ["النَّاسِ", "الْفَلَقِ", "الرَّحِيمِ", "الْعَالَمِينَ"], difficulty: 1 },
  { surahId: 114, ayah: 4, start: "مِن شَرِّ الْوَسْوَاسِ", answer: "الْخَنَّاسِ", options: ["الْخَنَّاسِ", "النَّاسِ", "الْفَلَقِ", "الْجِنَّةِ"], difficulty: 2 },
  // Kevser (108)
  { surahId: 108, ayah: 1, start: "إِنَّا أَعْطَيْنَاكَ", answer: "الْكَوْثَرَ", options: ["الْكَوْثَرَ", "الْفَلَقِ", "النَّاسِ", "الصَّمَدُ"], difficulty: 1 },
  { surahId: 108, ayah: 2, start: "فَصَلِّ لِرَبِّكَ", answer: "وَانْحَرْ", options: ["وَانْحَرْ", "وَاسْجُدْ", "وَاصْبِرْ", "وَاشْكُرْ"], difficulty: 2 },
  // Asr (103)
  { surahId: 103, ayah: 1, start: "وَ", answer: "الْعَصْرِ", options: ["الْعَصْرِ", "الْفَجْرِ", "اللَّيْلِ", "الضُّحَىٰ"], difficulty: 1 },
  { surahId: 103, ayah: 2, start: "إِنَّ الْإِنسَانَ", answer: "لَفِي خُسْرٍ", options: ["لَفِي خُسْرٍ", "لَفِي نَعِيمٍ", "لَفِي ضَلَالٍ", "لَفِي كَبَدٍ"], difficulty: 2 },
  // Kâfirûn (109)
  { surahId: 109, ayah: 1, start: "قُلْ يَا أَيُّهَا", answer: "الْكَافِرُونَ", options: ["الْكَافِرُونَ", "النَّاسُ", "الْمُسْلِمُونَ", "الْمُؤْمِنُونَ"], difficulty: 1 },
  { surahId: 109, ayah: 6, start: "لَكُمْ دِينُكُمْ", answer: "وَلِيَ دِينِ", options: ["وَلِيَ دِينِ", "وَلِيَ رَبِّي", "وَلِيَ حُكْمِي", "وَلِيَ إِيمَانِ"], difficulty: 2 },
  // Nasr (110)
  { surahId: 110, ayah: 1, start: "إِذَا جَاءَ نَصْرُ اللَّهِ", answer: "وَالْفَتْحُ", options: ["وَالْفَتْحُ", "وَالنَّصْرُ", "وَالْهُدَى", "وَالرَّحْمَةُ"], difficulty: 2 },
  // Tebbet (111)
  { surahId: 111, ayah: 1, start: "تَبَّتْ يَدَا", answer: "أَبِي لَهَبٍ وَتَبَّ", options: ["أَبِي لَهَبٍ وَتَبَّ", "الظَّالِمِينَ وَتَبَّ", "الْكَافِرِينَ وَتَبَّ", "الْمُنَافِقِينَ وَتَبَّ"], difficulty: 2 },
  // Fil (105)
  { surahId: 105, ayah: 1, start: "أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ", answer: "بِأَصْحَابِ الْفِيلِ", options: ["بِأَصْحَابِ الْفِيلِ", "بِأَصْحَابِ النَّارِ", "بِعَادٍ", "بِثَمُودَ"], difficulty: 2 },
  // Bakara (2) — harder
  { surahId: 2, ayah: 255, start: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ", answer: "الْحَيُّ الْقَيُّومُ", options: ["الْحَيُّ الْقَيُّومُ", "الْعَزِيزُ الْحَكِيمُ", "الرَّحْمَٰنُ الرَّحِيمُ", "الْغَفُورُ الرَّحِيمُ"], difficulty: 3 },
  { surahId: 2, ayah: 286, start: "رَبَّنَا لَا تُؤَاخِذْنَا إِن", answer: "نَّسِينَا أَوْ أَخْطَأْنَا", options: ["نَّسِينَا أَوْ أَخْطَأْنَا", "ظَلَمْنَا أَنفُسَنَا", "كُنَّا مِنَ الظَّالِمِينَ", "أَسْرَفْنَا فِي أَمْرِنَا"], difficulty: 3 },
  // Yâsîn (36)
  { surahId: 36, ayah: 1, start: "يس", answer: "وَالْقُرْآنِ الْحَكِيمِ", options: ["وَالْقُرْآنِ الْحَكِيمِ", "وَالْكِتَابِ الْمُبِينِ", "تِلْكَ آيَاتُ اللَّهِ", "الم"], difficulty: 3 },
  // Mülk (67)
  { surahId: 67, ayah: 1, start: "تَبَارَكَ الَّذِي بِيَدِهِ", answer: "الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", options: ["الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", "الْأَمْرُ وَإِلَيْهِ تُرْجَعُونَ", "الْحُكْمُ وَهُوَ أَسْرَعُ الْحَاسِبِينَ", "الْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ"], difficulty: 3 },
];

export const TAJWEED_QUESTIONS: TajweedQuestion[] = [
  { text: "مِن رَّبِّهِمْ", rule: "idgham", surahId: 2, ayah: 5, explanation: "Nun sakin, Ra harfine idğam olmuş. İdğam-ı bilâ gunne uygulanır.", difficulty: 1 },
  { text: "مِنْ خَيْرٍ", rule: "izhar", surahId: 2, ayah: 105, explanation: "Nun sakin, Hâ harfinden önce gelmiş. Hâ, boğaz harflerinden olduğu için izhar uygulanır.", difficulty: 1 },
  { text: "أَنبِئْهُم", rule: "iqlab", surahId: 2, ayah: 33, explanation: "Nun sakin, Bâ harfinden önce gelmiş. Nun sesi mim'e dönüşür (iklâb).", difficulty: 2 },
  { text: "مِن شَرِّ", rule: "ikhfa", surahId: 113, ayah: 2, explanation: "Nun sakin, Şın harfinden önce gelmiş. Hafif gizleme (ihfâ) uygulanır.", difficulty: 1 },
  { text: "وَلَا الضَّالِّينَ", rule: "madd", surahId: 1, ayah: 7, explanation: "Elif ve lâm uzatması ile med-i lâzım oluşur. 6 elif miktarı uzatılır.", difficulty: 2 },
  { text: "قُلْ هُوَ", rule: "qalqala", surahId: 112, ayah: 1, explanation: "Lâm harfi sukûn ile duruyor. Kalkale harfi olduğu için titreşimli okunur.", difficulty: 2 },
  { text: "مِنَ الْجِنَّةِ", rule: "ghunna", surahId: 114, ayah: 6, explanation: "Nun şeddeli — ğunne (geniz sesi) 2 elif miktarı tutulur.", difficulty: 1 },
  { text: "يَنصُرُكُمْ", rule: "ikhfa", surahId: 3, ayah: 160, explanation: "Nun sakin, Sâd harfinden önce. İhfâ (gizleme) uygulanır.", difficulty: 2 },
  { text: "مِن وَلِيٍّ", rule: "idgham", surahId: 2, ayah: 107, explanation: "Nun sakin, Vâv harfine idğam olmuş. İdğam-ı mea'l-ğunne uygulanır.", difficulty: 2 },
  { text: "سَمِيعٌ عَلِيمٌ", rule: "izhar", surahId: 2, ayah: 137, explanation: "Tenvin, Ayn harfinden önce gelmiş. Ayn boğaz harfi olduğundan izhar uygulanır.", difficulty: 2 },
  { text: "الْقَمَرَ", rule: "izhar", surahId: 54, ayah: 1, explanation: "Lâm-ı tarif, Kaf harfi (kamerî harf) ile izhar (açık okunma).", difficulty: 1 },
  { text: "الشَّمْسُ", rule: "idgham", surahId: 91, ayah: 1, explanation: "Lâm-ı tarif, Şın harfi (şemsî harf) ile idğam olur — lâm okunmaz.", difficulty: 1 },
  { text: "قَدْ سَمِعَ", rule: "qalqala", surahId: 58, ayah: 1, explanation: "Dâl harfi sukûn ile duruyor. Kalkale harfi olduğu için titreşimli okunur.", difficulty: 2 },
  { text: "يَآ أَيُّهَا", rule: "madd", surahId: 1, ayah: 1, explanation: "Elif uzatması — med-i tabii uygulanır, 2 elif miktarı.", difficulty: 1 },
  { text: "عَنْ مَّا", rule: "idgham", surahId: 2, ayah: 68, explanation: "Nun sakin, Mim harfine idğam olmuş. İdğam-ı mea'l-ğunne (şefevî) uygulanır.", difficulty: 3 },
  { text: "يُنفِقُونَ", rule: "ikhfa", surahId: 2, ayah: 3, explanation: "Nun sakin, Fâ harfinden önce. İhfâ (hafif gizleme) uygulanır.", difficulty: 2 },
  { text: "وَأَقِيمُوا", rule: "madd", surahId: 2, ayah: 43, explanation: "Vâv ile med-i lin / med uygulanır.", difficulty: 3 },
  { text: "أَحَدٌ ۝ اللَّهُ", rule: "izhar", surahId: 112, ayah: 1, explanation: "Tenvin ile sure sonu — durulduğunda med, geçildiğinde izhar.", difficulty: 3 },
];

export const ORDERING_SURAHS: OrderingSurah[] = [
  {
    surahId: 1, name: "Fâtiha", difficulty: 1,
    verses: [
      { id: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
      { id: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" },
      { id: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ" },
      { id: 4, text: "مَالِكِ يَوْمِ الدِّينِ" },
      { id: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
      { id: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ" },
      { id: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ" },
    ],
  },
  {
    surahId: 112, name: "İhlâs", difficulty: 1,
    verses: [
      { id: 1, text: "قُلْ هُوَ اللَّهُ أَحَدٌ" },
      { id: 2, text: "اللَّهُ الصَّمَدُ" },
      { id: 3, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ" },
      { id: 4, text: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ" },
    ],
  },
  {
    surahId: 113, name: "Felâk", difficulty: 1,
    verses: [
      { id: 1, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ" },
      { id: 2, text: "مِن شَرِّ مَا خَلَقَ" },
      { id: 3, text: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ" },
      { id: 4, text: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ" },
      { id: 5, text: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ" },
    ],
  },
  {
    surahId: 114, name: "Nâs", difficulty: 1,
    verses: [
      { id: 1, text: "قُلْ أَعُوذُ بِرَبِّ النَّاسِ" },
      { id: 2, text: "مَلِكِ النَّاسِ" },
      { id: 3, text: "إِلَٰهِ النَّاسِ" },
      { id: 4, text: "مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ" },
      { id: 5, text: "الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ" },
      { id: 6, text: "مِنَ الْجِنَّةِ وَالنَّاسِ" },
    ],
  },
  {
    surahId: 108, name: "Kevser", difficulty: 1,
    verses: [
      { id: 1, text: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ" },
      { id: 2, text: "فَصَلِّ لِرَبِّكَ وَانْحَرْ" },
      { id: 3, text: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ" },
    ],
  },
  {
    surahId: 103, name: "Asr", difficulty: 2,
    verses: [
      { id: 1, text: "وَالْعَصْرِ" },
      { id: 2, text: "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ" },
      { id: 3, text: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ" },
    ],
  },
  {
    surahId: 109, name: "Kâfirûn", difficulty: 2,
    verses: [
      { id: 1, text: "قُلْ يَا أَيُّهَا الْكَافِرُونَ" },
      { id: 2, text: "لَا أَعْبُدُ مَا تَعْبُدُونَ" },
      { id: 3, text: "وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ" },
      { id: 4, text: "وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ" },
      { id: 5, text: "وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ" },
      { id: 6, text: "لَكُمْ دِينُكُمْ وَلِيَ دِينِ" },
    ],
  },
];

export const HASANAT_REWARDS = {
  exercise_complete: 10,
  exercise_perfect: 25,
  daily_activity: 5,
  streak_milestone_7: 50,
  streak_milestone_30: 200,
  streak_milestone_100: 500,
  surah_completed: 30,
  surah_memorized: 100,
  appointment_completed: 15,
  review_session: 8,
} as const;

export const MILESTONE_BADGES = [
  { id: "first_step", name: "İlk Adım", description: "İlk alıştırmanı tamamla", icon: "seedling", threshold: 1, type: "exercise" as const },
  { id: "week_warrior", name: "Hafta Savaşçısı", description: "7 gün arka arkaya çalış", icon: "flame", threshold: 7, type: "streak" as const },
  { id: "month_master", name: "Ay Ustası", description: "30 gün arka arkaya çalış", icon: "crown", threshold: 30, type: "streak" as const },
  { id: "surah_explorer", name: "Sure Kaşifi", description: "10 sureyi tamamla", icon: "compass", threshold: 10, type: "surah_read" as const },
  { id: "hafiz_yolu", name: "Hâfız Yolcusu", description: "İlk sureni ezberle", icon: "star", threshold: 1, type: "surah_memorized" as const },
  { id: "tajweed_master", name: "Tecvid Ustası", description: "Tecvid alıştırmasında tam puan al", icon: "award", threshold: 1, type: "tajweed_perfect" as const },
  { id: "hasanat_100", name: "Yüz Hasene", description: "100 hasanat topla", icon: "heart", threshold: 100, type: "hasanat" as const },
  { id: "hasanat_1000", name: "Bin Hasene", description: "1.000 hasanat topla", icon: "diamond", threshold: 1000, type: "hasanat" as const },
  { id: "khatm_first", name: "İlk Hatim", description: "114 surenin tamamını oku", icon: "book-2", threshold: 114, type: "surah_read" as const },
] as const;

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickQuestions<T extends { difficulty: number }>(pool: T[], count: number, maxDifficulty: 1 | 2 | 3 = 3): T[] {
  const eligible = pool.filter((q) => q.difficulty <= maxDifficulty);
  return shuffleArray(eligible).slice(0, count);
}
