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

export const ORDERING_SURAHS: OrderingSurah[] = [
  {
    surahId: 1,
    name: "Fâtiha",
    difficulty: 1,
    verses: [
      { id: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
      { id: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" },
      { id: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ" },
      { id: 4, text: "مَالِكِ يَوْمِ الدِّينِ" },
      { id: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
      { id: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ" },
      {
        id: 7,
        text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
      },
    ],
  },
  {
    surahId: 112,
    name: "İhlâs",
    difficulty: 1,
    verses: [
      { id: 1, text: "قُلْ هُوَ اللَّهُ أَحَدٌ" },
      { id: 2, text: "اللَّهُ الصَّمَدُ" },
      { id: 3, text: "لَمْ يَلِدْ وَلَمْ يُولَدْ" },
      { id: 4, text: "وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ" },
    ],
  },
  {
    surahId: 113,
    name: "Felâk",
    difficulty: 1,
    verses: [
      { id: 1, text: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ" },
      { id: 2, text: "مِن شَرِّ مَا خَلَقَ" },
      { id: 3, text: "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ" },
      { id: 4, text: "وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ" },
      { id: 5, text: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ" },
    ],
  },
  {
    surahId: 114,
    name: "Nâs",
    difficulty: 1,
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
    surahId: 108,
    name: "Kevser",
    difficulty: 1,
    verses: [
      { id: 1, text: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ" },
      { id: 2, text: "فَصَلِّ لِرَبِّكَ وَانْحَرْ" },
      { id: 3, text: "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ" },
    ],
  },
  {
    surahId: 103,
    name: "Asr",
    difficulty: 2,
    verses: [
      { id: 1, text: "وَالْعَصْرِ" },
      { id: 2, text: "إِنَّ الْإِنسَانَ لَفِي خُسْرٍ" },
      {
        id: 3,
        text: "إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",
      },
    ],
  },
  {
    surahId: 109,
    name: "Kâfirûn",
    difficulty: 2,
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

// A complete verse remains available alongside each gap. The displayed fragments
// are exact substrings of the existing, referenced verse, never invented Quran text.
export const COMPLETION_QUESTIONS: CompletionQuestion[] =
  ORDERING_SURAHS.flatMap((surah) =>
    surah.verses.flatMap((verse) => {
      const words = verse.text.split(" ");
      const cuts = [
        ...new Set([1, Math.floor(words.length / 2), words.length - 1]),
      ].filter((cut) => cut > 0 && cut < words.length);
      return cuts.map((cut, index) => {
        const answer = words.slice(cut).join(" ");
        const distractors = [
          ...new Set(
            ORDERING_SURAHS.flatMap((s) =>
              s.verses.map((v) =>
                v.text
                  .split(" ")
                  .slice(-Math.max(1, words.length - cut))
                  .join(" "),
              ),
            ),
          ),
        ].filter((value) => value !== answer);
        return {
          surahId: surah.surahId,
          ayah: verse.id,
          start: words.slice(0, cut).join(" "),
          answer,
          options: [answer, ...distractors.slice(0, 3)],
          difficulty: (index + 1) as 1 | 2 | 3,
        };
      });
    }),
  );

// Letter-combination drills are deliberately labelled as teaching examples, NOT
// attributed to an ayah. This avoids the old, incorrect verse references.
const drills: Array<[string, TajweedQuestion["rule"], string]> = [
  [
    "نْ رَ",
    "idgham",
    "Sakin nûn, râ ile birleşir; idğâm-ı bilâ gunne uygulanır.",
  ],
  ["نْ لَ", "idgham", "Sakin nûn, lâm ile birleşir; geniz sesi eklenmez."],
  [
    "نْ يَ",
    "idgham",
    "Sakin nûndan sonra yâ gelirse idğâm-ı meal gunne uygulanır.",
  ],
  ["نْ وَ", "idgham", "Sakin nûn, vâv ile geniz sesi korunarak birleşir."],
  ["نْ مَ", "idgham", "Sakin nûn, mîm ile birleşir; gunne korunur."],
  ["نْ نَ", "idgham", "Sakin nûn, sonraki nûna katılır ve gunneyle okunur."],
  ["نْ ءَ", "izhar", "Hemze boğaz harfidir; sakin nûn açık okunur."],
  ["نْ هَ", "izhar", "Hâ (ه) boğaz harfidir; sakin nûn açık okunur."],
  ["نْ عَ", "izhar", "Ayn boğaz harfidir; sakin nûn açık okunur."],
  ["نْ حَ", "izhar", "Hâ (ح) boğaz harfidir; sakin nûn açık okunur."],
  ["نْ غَ", "izhar", "Gayn boğaz harfidir; sakin nûn açık okunur."],
  ["نْ خَ", "izhar", "Hı boğaz harfidir; sakin nûn açık okunur."],
  ["نْ تَ", "ikhfa", "Tâ ihfâ harfidir; nûn gizlenir, geniz sesi korunur."],
  ["نْ ثَ", "ikhfa", "Sâ ihfâ harfidir; nûn hafifçe gizlenir."],
  ["نْ جَ", "ikhfa", "Cîm ihfâ harfidir; sakin nûn gizlenerek okunur."],
  ["نْ دَ", "ikhfa", "Dâl ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ ذَ", "ikhfa", "Zâl ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ زَ", "ikhfa", "Zây ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ سَ", "ikhfa", "Sîn ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ شَ", "ikhfa", "Şîn ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ صَ", "ikhfa", "Sâd ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ ضَ", "ikhfa", "Dâd ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ طَ", "ikhfa", "Tı ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ ظَ", "ikhfa", "Zı ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ فَ", "ikhfa", "Fâ ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ قَ", "ikhfa", "Kâf (ق) ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ كَ", "ikhfa", "Kef (ك) ihfâ harfidir; nûn sesi gizlenir."],
  ["نْ بَ", "iqlab", "Bâ öncesinde sakin nûn, gizli mîm sesine dönüştürülür."],
  [
    "قْ",
    "qalqala",
    "Sakin kâf (ق), ق ط ب ج د kalkale harflerindendir. Lâm bu grupta değildir.",
  ],
  ["طْ", "qalqala", "Sakin tı, kalkale harfidir; kısa bir yankıyla okunur."],
  ["بْ", "qalqala", "Sakin bâ, kalkale harfidir; kısa bir yankıyla okunur."],
  ["جْ", "qalqala", "Sakin cîm, kalkale harfidir; kısa bir yankıyla okunur."],
  ["دْ", "qalqala", "Sakin dâl, kalkale harfidir; kısa bir yankıyla okunur."],
  ["نَّ", "ghunna", "Şeddeli nûn, iki hareke süresince geniz sesiyle okunur."],
  ["مَّ", "ghunna", "Şeddeli mîm, iki hareke süresince geniz sesiyle okunur."],
  [
    "بَا",
    "madd",
    "Fethalı harften sonraki sakin elif, medd-i tabiîdir: iki hareke (bir elif).",
  ],
  [
    "بِي",
    "madd",
    "Kesreli harften sonraki sakin yâ, medd-i tabiîdir: iki hareke.",
  ],
  [
    "بُو",
    "madd",
    "Dammeli harften sonraki sakin vâv, medd-i tabiîdir: iki hareke.",
  ],
];
export const TAJWEED_QUESTIONS: TajweedQuestion[] = drills.map(
  ([text, rule, explanation], index) => ({
    text,
    rule,
    explanation,
    surahId: 0,
    ayah: 0,
    difficulty: index < 12 ? 1 : index < 28 ? 2 : 3,
  }),
);

export const ARABIC_LETTERS = [
  ["ا", "Elif"],
  ["ب", "Bâ"],
  ["ت", "Tâ"],
  ["ث", "Sâ"],
  ["ج", "Cîm"],
  ["ح", "Hâ (ح)"],
  ["خ", "Hı"],
  ["د", "Dâl"],
  ["ذ", "Zâl"],
  ["ر", "Râ"],
  ["ز", "Zây"],
  ["س", "Sîn"],
  ["ش", "Şîn"],
  ["ص", "Sâd"],
  ["ض", "Dâd"],
  ["ط", "Tı"],
  ["ظ", "Zı"],
  ["ع", "Ayn"],
  ["غ", "Gayn"],
  ["ف", "Fâ"],
  ["ق", "Kâf (ق)"],
  ["ك", "Kef (ك)"],
  ["ل", "Lâm"],
  ["م", "Mîm"],
  ["ن", "Nûn"],
  ["ه", "Hâ (ه)"],
  ["و", "Vâv"],
  ["ي", "Yâ"],
] as const;

// Original short meaning summaries, not a reproduction of a named translation.
// The learner can consult a full, attributed translation through the source link.
export const MEANING_QUESTIONS = [
  { surahId: 1, ayah: 2, meaning: "Övgü, âlemlerin Rabbi Allah’a aittir." },
  { surahId: 1, ayah: 3, meaning: "Allah’ın engin merhameti vurgulanır." },
  { surahId: 1, ayah: 4, meaning: "Hesap gününün egemenliği Allah’a aittir." },
  {
    surahId: 1,
    ayah: 5,
    meaning: "Yalnız Allah’a kulluk edilir ve O’ndan yardım istenir.",
  },
  { surahId: 1, ayah: 6, meaning: "Dosdoğru yola iletilme duası yapılır." },
  { surahId: 112, ayah: 1, meaning: "Allah’ın bir ve tek olduğu bildirilir." },
  {
    surahId: 112,
    ayah: 2,
    meaning: "Her şey Allah’a muhtaçtır; O ise hiçbir şeye muhtaç değildir.",
  },
  {
    surahId: 112,
    ayah: 3,
    meaning: "Allah’ın doğurmadığı ve doğurulmadığı bildirilir.",
  },
  {
    surahId: 112,
    ayah: 4,
    meaning: "Hiçbir varlığın Allah’a denk olmadığı bildirilir.",
  },
  {
    surahId: 108,
    ayah: 2,
    meaning: "Rab için namaz kılma ve kurban kesme emredilir.",
  },
  {
    surahId: 109,
    ayah: 6,
    meaning: "İnanç konusundaki ayrılık açıkça ifade edilir.",
  },
  { surahId: 113, ayah: 1, meaning: "Sabahın Rabbine sığınma öğretilir." },
].map((q) => ({
  ...q,
  text: ORDERING_SURAHS.find((s) => s.surahId === q.surahId)!.verses.find(
    (v) => v.id === q.ayah,
  )!.text,
  difficulty: 1 as const,
}));

export const MILESTONE_BADGES = [
  {
    id: "first_step",
    name: "İlk Adım",
    description: "İlk alıştırmanı tamamla",
    icon: "seedling",
    threshold: 1,
    type: "exercise" as const,
  },
  {
    id: "week_warrior",
    name: "Hafta Savaşçısı",
    description: "7 gün arka arkaya çalış",
    icon: "flame",
    threshold: 7,
    type: "streak" as const,
  },
  {
    id: "month_master",
    name: "Ay Ustası",
    description: "30 gün arka arkaya çalış",
    icon: "crown",
    threshold: 30,
    type: "streak" as const,
  },
  {
    id: "surah_explorer",
    name: "Sure Kaşifi",
    description: "10 sureyi tamamla",
    icon: "compass",
    threshold: 10,
    type: "surah_read" as const,
  },
  {
    id: "hafiz_yolu",
    name: "Hâfız Yolcusu",
    description: "İlk sureni ezberle",
    icon: "star",
    threshold: 1,
    type: "surah_memorized" as const,
  },
  {
    id: "tajweed_master",
    name: "Tecvid Ustası",
    description: "Tecvid alıştırmasında tam puan al",
    icon: "award",
    threshold: 1,
    type: "tajweed_perfect" as const,
  },
  {
    id: "hasanat_100",
    name: "Yüz Hasene",
    description: "100 hasanat topla",
    icon: "heart",
    threshold: 100,
    type: "hasanat" as const,
  },
  {
    id: "hasanat_1000",
    name: "Bin Hasene",
    description: "1.000 hasanat topla",
    icon: "diamond",
    threshold: 1000,
    type: "hasanat" as const,
  },
  {
    id: "khatm_first",
    name: "İlk Hatim",
    description: "114 surenin tamamını oku",
    icon: "book-2",
    threshold: 114,
    type: "surah_read" as const,
  },
] as const;

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickQuestions<T extends { difficulty: number }>(
  pool: T[],
  count: number,
  maxDifficulty: 1 | 2 | 3 = 3,
): T[] {
  const eligible = pool.filter((q) => q.difficulty <= maxDifficulty);
  return shuffleArray(eligible).slice(0, count);
}
