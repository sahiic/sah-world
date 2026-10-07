export interface SurahInfo {
  id: number;
  name: string;
  arabic: string;
  ayahCount: number;
  type: "mekki" | "medeni";
  juz: number;
}

export const SURAHS: SurahInfo[] = [
  { id: 1, name: "Fâtiha", arabic: "الفاتحة", ayahCount: 7, type: "mekki", juz: 1 },
  { id: 2, name: "Bakara", arabic: "البقرة", ayahCount: 286, type: "medeni", juz: 1 },
  { id: 3, name: "Âl-i İmrân", arabic: "آل عمران", ayahCount: 200, type: "medeni", juz: 3 },
  { id: 4, name: "Nisâ", arabic: "النساء", ayahCount: 176, type: "medeni", juz: 4 },
  { id: 5, name: "Mâide", arabic: "المائدة", ayahCount: 120, type: "medeni", juz: 6 },
  { id: 6, name: "En'âm", arabic: "الأنعام", ayahCount: 165, type: "mekki", juz: 7 },
  { id: 7, name: "A'râf", arabic: "الأعراف", ayahCount: 206, type: "mekki", juz: 8 },
  { id: 8, name: "Enfâl", arabic: "الأنفال", ayahCount: 75, type: "medeni", juz: 9 },
  { id: 9, name: "Tevbe", arabic: "التوبة", ayahCount: 129, type: "medeni", juz: 10 },
  { id: 10, name: "Yûnus", arabic: "يونس", ayahCount: 109, type: "mekki", juz: 11 },
  { id: 11, name: "Hûd", arabic: "هود", ayahCount: 123, type: "mekki", juz: 11 },
  { id: 12, name: "Yûsuf", arabic: "يوسف", ayahCount: 111, type: "mekki", juz: 12 },
  { id: 13, name: "Ra'd", arabic: "الرعد", ayahCount: 43, type: "medeni", juz: 13 },
  { id: 14, name: "İbrâhîm", arabic: "إبراهيم", ayahCount: 52, type: "mekki", juz: 13 },
  { id: 15, name: "Hicr", arabic: "الحجر", ayahCount: 99, type: "mekki", juz: 14 },
  { id: 16, name: "Nahl", arabic: "النحل", ayahCount: 128, type: "mekki", juz: 14 },
  { id: 17, name: "İsrâ", arabic: "الإسراء", ayahCount: 111, type: "mekki", juz: 15 },
  { id: 18, name: "Kehf", arabic: "الكهف", ayahCount: 110, type: "mekki", juz: 15 },
  { id: 19, name: "Meryem", arabic: "مريم", ayahCount: 98, type: "mekki", juz: 16 },
  { id: 20, name: "Tâ-Hâ", arabic: "طه", ayahCount: 135, type: "mekki", juz: 16 },
  { id: 21, name: "Enbiyâ", arabic: "الأنبياء", ayahCount: 112, type: "mekki", juz: 17 },
  { id: 22, name: "Hac", arabic: "الحج", ayahCount: 78, type: "medeni", juz: 17 },
  { id: 23, name: "Mü'minûn", arabic: "المؤمنون", ayahCount: 118, type: "mekki", juz: 18 },
  { id: 24, name: "Nûr", arabic: "النور", ayahCount: 64, type: "medeni", juz: 18 },
  { id: 25, name: "Furkân", arabic: "الفرقان", ayahCount: 77, type: "mekki", juz: 18 },
  { id: 26, name: "Şuarâ", arabic: "الشعراء", ayahCount: 227, type: "mekki", juz: 19 },
  { id: 27, name: "Neml", arabic: "النمل", ayahCount: 93, type: "mekki", juz: 19 },
  { id: 28, name: "Kasas", arabic: "القصص", ayahCount: 88, type: "mekki", juz: 20 },
  { id: 29, name: "Ankebût", arabic: "العنكبوت", ayahCount: 69, type: "mekki", juz: 20 },
  { id: 30, name: "Rûm", arabic: "الروم", ayahCount: 60, type: "mekki", juz: 21 },
  { id: 31, name: "Lokmân", arabic: "لقمان", ayahCount: 34, type: "mekki", juz: 21 },
  { id: 32, name: "Secde", arabic: "السجدة", ayahCount: 30, type: "mekki", juz: 21 },
  { id: 33, name: "Ahzâb", arabic: "الأحزاب", ayahCount: 73, type: "medeni", juz: 21 },
  { id: 34, name: "Sebe'", arabic: "سبأ", ayahCount: 54, type: "mekki", juz: 22 },
  { id: 35, name: "Fâtır", arabic: "فاطر", ayahCount: 45, type: "mekki", juz: 22 },
  { id: 36, name: "Yâsîn", arabic: "يس", ayahCount: 83, type: "mekki", juz: 22 },
  { id: 37, name: "Sâffât", arabic: "الصافات", ayahCount: 182, type: "mekki", juz: 23 },
  { id: 38, name: "Sâd", arabic: "ص", ayahCount: 88, type: "mekki", juz: 23 },
  { id: 39, name: "Zümer", arabic: "الزمر", ayahCount: 75, type: "mekki", juz: 23 },
  { id: 40, name: "Mü'min", arabic: "غافر", ayahCount: 85, type: "mekki", juz: 24 },
  { id: 41, name: "Fussilet", arabic: "فصلت", ayahCount: 54, type: "mekki", juz: 24 },
  { id: 42, name: "Şûrâ", arabic: "الشورى", ayahCount: 53, type: "mekki", juz: 25 },
  { id: 43, name: "Zuhruf", arabic: "الزخرف", ayahCount: 89, type: "mekki", juz: 25 },
  { id: 44, name: "Duhân", arabic: "الدخان", ayahCount: 59, type: "mekki", juz: 25 },
  { id: 45, name: "Câsiye", arabic: "الجاثية", ayahCount: 37, type: "mekki", juz: 25 },
  { id: 46, name: "Ahkâf", arabic: "الأحقاف", ayahCount: 35, type: "mekki", juz: 26 },
  { id: 47, name: "Muhammed", arabic: "محمد", ayahCount: 38, type: "medeni", juz: 26 },
  { id: 48, name: "Fetih", arabic: "الفتح", ayahCount: 29, type: "medeni", juz: 26 },
  { id: 49, name: "Hucurât", arabic: "الحجرات", ayahCount: 18, type: "medeni", juz: 26 },
  { id: 50, name: "Kâf", arabic: "ق", ayahCount: 45, type: "mekki", juz: 26 },
  { id: 51, name: "Zâriyât", arabic: "الذاريات", ayahCount: 60, type: "mekki", juz: 26 },
  { id: 52, name: "Tûr", arabic: "الطور", ayahCount: 49, type: "mekki", juz: 27 },
  { id: 53, name: "Necm", arabic: "النجم", ayahCount: 62, type: "mekki", juz: 27 },
  { id: 54, name: "Kamer", arabic: "القمر", ayahCount: 55, type: "mekki", juz: 27 },
  { id: 55, name: "Rahmân", arabic: "الرحمن", ayahCount: 78, type: "medeni", juz: 27 },
  { id: 56, name: "Vâkıa", arabic: "الواقعة", ayahCount: 96, type: "mekki", juz: 27 },
  { id: 57, name: "Hadîd", arabic: "الحديد", ayahCount: 29, type: "medeni", juz: 27 },
  { id: 58, name: "Mücâdele", arabic: "المجادلة", ayahCount: 22, type: "medeni", juz: 28 },
  { id: 59, name: "Haşr", arabic: "الحشر", ayahCount: 24, type: "medeni", juz: 28 },
  { id: 60, name: "Mümtehine", arabic: "الممتحنة", ayahCount: 13, type: "medeni", juz: 28 },
  { id: 61, name: "Saf", arabic: "الصف", ayahCount: 14, type: "medeni", juz: 28 },
  { id: 62, name: "Cum'a", arabic: "الجمعة", ayahCount: 11, type: "medeni", juz: 28 },
  { id: 63, name: "Münâfikûn", arabic: "المنافقون", ayahCount: 11, type: "medeni", juz: 28 },
  { id: 64, name: "Teğâbün", arabic: "التغابن", ayahCount: 18, type: "medeni", juz: 28 },
  { id: 65, name: "Talâk", arabic: "الطلاق", ayahCount: 12, type: "medeni", juz: 28 },
  { id: 66, name: "Tahrîm", arabic: "التحريم", ayahCount: 12, type: "medeni", juz: 28 },
  { id: 67, name: "Mülk", arabic: "الملك", ayahCount: 30, type: "mekki", juz: 29 },
  { id: 68, name: "Kalem", arabic: "القلم", ayahCount: 52, type: "mekki", juz: 29 },
  { id: 69, name: "Hâkka", arabic: "الحاقة", ayahCount: 52, type: "mekki", juz: 29 },
  { id: 70, name: "Meâric", arabic: "المعارج", ayahCount: 44, type: "mekki", juz: 29 },
  { id: 71, name: "Nûh", arabic: "نوح", ayahCount: 28, type: "mekki", juz: 29 },
  { id: 72, name: "Cin", arabic: "الجن", ayahCount: 28, type: "mekki", juz: 29 },
  { id: 73, name: "Müzzemmil", arabic: "المزمل", ayahCount: 20, type: "mekki", juz: 29 },
  { id: 74, name: "Müddessir", arabic: "المدثر", ayahCount: 56, type: "mekki", juz: 29 },
  { id: 75, name: "Kıyâme", arabic: "القيامة", ayahCount: 40, type: "mekki", juz: 29 },
  { id: 76, name: "İnsân", arabic: "الإنسان", ayahCount: 31, type: "medeni", juz: 29 },
  { id: 77, name: "Mürselât", arabic: "المرسلات", ayahCount: 50, type: "mekki", juz: 29 },
  { id: 78, name: "Nebe'", arabic: "النبأ", ayahCount: 40, type: "mekki", juz: 30 },
  { id: 79, name: "Nâziât", arabic: "النازعات", ayahCount: 46, type: "mekki", juz: 30 },
  { id: 80, name: "Abese", arabic: "عبس", ayahCount: 42, type: "mekki", juz: 30 },
  { id: 81, name: "Tekvîr", arabic: "التكوير", ayahCount: 29, type: "mekki", juz: 30 },
  { id: 82, name: "İnfitâr", arabic: "الانفطار", ayahCount: 19, type: "mekki", juz: 30 },
  { id: 83, name: "Mutaffifîn", arabic: "المطففين", ayahCount: 36, type: "mekki", juz: 30 },
  { id: 84, name: "İnşikâk", arabic: "الانشقاق", ayahCount: 25, type: "mekki", juz: 30 },
  { id: 85, name: "Bürûc", arabic: "البروج", ayahCount: 22, type: "mekki", juz: 30 },
  { id: 86, name: "Târık", arabic: "الطارق", ayahCount: 17, type: "mekki", juz: 30 },
  { id: 87, name: "A'lâ", arabic: "الأعلى", ayahCount: 19, type: "mekki", juz: 30 },
  { id: 88, name: "Gâşiye", arabic: "الغاشية", ayahCount: 26, type: "mekki", juz: 30 },
  { id: 89, name: "Fecr", arabic: "الفجر", ayahCount: 30, type: "mekki", juz: 30 },
  { id: 90, name: "Beled", arabic: "البلد", ayahCount: 20, type: "mekki", juz: 30 },
  { id: 91, name: "Şems", arabic: "الشمس", ayahCount: 15, type: "mekki", juz: 30 },
  { id: 92, name: "Leyl", arabic: "الليل", ayahCount: 21, type: "mekki", juz: 30 },
  { id: 93, name: "Duhâ", arabic: "الضحى", ayahCount: 11, type: "mekki", juz: 30 },
  { id: 94, name: "İnşirâh", arabic: "الشرح", ayahCount: 8, type: "mekki", juz: 30 },
  { id: 95, name: "Tîn", arabic: "التين", ayahCount: 8, type: "mekki", juz: 30 },
  { id: 96, name: "Alak", arabic: "العلق", ayahCount: 19, type: "mekki", juz: 30 },
  { id: 97, name: "Kadir", arabic: "القدر", ayahCount: 5, type: "mekki", juz: 30 },
  { id: 98, name: "Beyyine", arabic: "البينة", ayahCount: 8, type: "medeni", juz: 30 },
  { id: 99, name: "Zilzâl", arabic: "الزلزلة", ayahCount: 8, type: "medeni", juz: 30 },
  { id: 100, name: "Âdiyât", arabic: "العاديات", ayahCount: 11, type: "mekki", juz: 30 },
  { id: 101, name: "Kâria", arabic: "القارعة", ayahCount: 11, type: "mekki", juz: 30 },
  { id: 102, name: "Tekâsür", arabic: "التكاثر", ayahCount: 8, type: "mekki", juz: 30 },
  { id: 103, name: "Asr", arabic: "العصر", ayahCount: 3, type: "mekki", juz: 30 },
  { id: 104, name: "Hümeze", arabic: "الهمزة", ayahCount: 9, type: "mekki", juz: 30 },
  { id: 105, name: "Fîl", arabic: "الفيل", ayahCount: 5, type: "mekki", juz: 30 },
  { id: 106, name: "Kureyş", arabic: "قريش", ayahCount: 4, type: "mekki", juz: 30 },
  { id: 107, name: "Mâûn", arabic: "الماعون", ayahCount: 7, type: "mekki", juz: 30 },
  { id: 108, name: "Kevser", arabic: "الكوثر", ayahCount: 3, type: "mekki", juz: 30 },
  { id: 109, name: "Kâfirûn", arabic: "الكافرون", ayahCount: 6, type: "mekki", juz: 30 },
  { id: 110, name: "Nasr", arabic: "النصر", ayahCount: 3, type: "medeni", juz: 30 },
  { id: 111, name: "Tebbet", arabic: "المسد", ayahCount: 5, type: "mekki", juz: 30 },
  { id: 112, name: "İhlâs", arabic: "الإخلاص", ayahCount: 4, type: "mekki", juz: 30 },
  { id: 113, name: "Felâk", arabic: "الفلق", ayahCount: 5, type: "mekki", juz: 30 },
  { id: 114, name: "Nâs", arabic: "الناس", ayahCount: 6, type: "mekki", juz: 30 },
];

export type SurahStatus = "none" | "started" | "reading" | "completed" | "memorized";

export interface SurahProgress {
  surahId: number;
  readStatus: SurahStatus;
  memorizeStatus: "none" | "studying" | "reviewing" | "memorized";
  lastStudyDate: string | null;
  difficultAyahs: number[];
  completedAyahs: number;
  totalErrors: number;
}

export const SPACED_INTERVALS = [1, 3, 7, 21, 60] as const;

export interface SpacedRepetitionItem {
  id: string;
  surahId: number;
  startAyah: number;
  endAyah: number;
  nextReviewDate: string;
  intervalIndex: number;
  easeFactor: number;
  reviewCount: number;
  lastReviewDate: string;
}

export interface QuranExerciseResult {
  id: string;
  type: "completion" | "ordering" | "tajweed" | "spaced";
  surahId: number;
  score: number;
  totalQuestions: number;
  completedAt: string;
  timeSpentSeconds: number;
}

export interface QuranStreak {
  current: number;
  longest: number;
  lastDate: string;
  totalDays: number;
}

export interface WeeklySummary {
  totalAyahs: number;
  totalMinutes: number;
  surahsWorkedOn: number;
  xhEarned: number;
  comparedToLastWeek: number;
  mostReviewedSurah: string | null;
}

export const TAJWEED_RULES = [
  { id: "idgham", name: "İdğâm", description: "İki harfin birleşerek okunması", color: "#4CAF50" },
  { id: "ikhfa", name: "İhfâ", description: "Hafif gizleme ile okuma", color: "#2196F3" },
  { id: "iqlab", name: "İklâb", description: "Nun'un mim'e dönüşmesi", color: "#FF9800" },
  { id: "izhar", name: "İzhâr", description: "Açık ve net okuma", color: "#9C27B0" },
  { id: "madd", name: "Med", description: "Uzatarak okuma", color: "#F44336" },
  { id: "qalqala", name: "Kalkale", description: "Sert harflerin titreşimli okunması", color: "#00BCD4" },
  { id: "ghunna", name: "Ğunne", description: "Genizden gelen ses", color: "#795548" },
] as const;

export function getDemoSurahProgress(): SurahProgress[] {
  return SURAHS.map((s) => {
    if (s.id === 1) return { surahId: 1, readStatus: "completed" as const, memorizeStatus: "memorized" as const, lastStudyDate: "2026-10-06", difficultAyahs: [], completedAyahs: 7, totalErrors: 0 };
    if (s.id === 112) return { surahId: 112, readStatus: "completed" as const, memorizeStatus: "memorized" as const, lastStudyDate: "2026-10-05", difficultAyahs: [], completedAyahs: 4, totalErrors: 0 };
    if (s.id === 113) return { surahId: 113, readStatus: "completed" as const, memorizeStatus: "reviewing" as const, lastStudyDate: "2026-10-04", difficultAyahs: [3], completedAyahs: 5, totalErrors: 1 };
    if (s.id === 114) return { surahId: 114, readStatus: "completed" as const, memorizeStatus: "studying" as const, lastStudyDate: "2026-10-03", difficultAyahs: [4, 5], completedAyahs: 6, totalErrors: 2 };
    if (s.id === 36) return { surahId: 36, readStatus: "reading" as const, memorizeStatus: "none" as const, lastStudyDate: "2026-10-02", difficultAyahs: [12, 45], completedAyahs: 50, totalErrors: 5 };
    if (s.id === 67) return { surahId: 67, readStatus: "started" as const, memorizeStatus: "none" as const, lastStudyDate: "2026-09-28", difficultAyahs: [], completedAyahs: 10, totalErrors: 3 };
    if (s.id === 55) return { surahId: 55, readStatus: "reading" as const, memorizeStatus: "none" as const, lastStudyDate: "2026-10-01", difficultAyahs: [13], completedAyahs: 30, totalErrors: 2 };
    if (s.id === 18) return { surahId: 18, readStatus: "started" as const, memorizeStatus: "none" as const, lastStudyDate: "2026-09-20", difficultAyahs: [], completedAyahs: 15, totalErrors: 4 };
    if (s.id === 56) return { surahId: 56, readStatus: "completed" as const, memorizeStatus: "none" as const, lastStudyDate: "2026-09-15", difficultAyahs: [], completedAyahs: 96, totalErrors: 0 };
    if (s.id === 78) return { surahId: 78, readStatus: "completed" as const, memorizeStatus: "studying" as const, lastStudyDate: "2026-10-06", difficultAyahs: [17, 31], completedAyahs: 40, totalErrors: 3 };
    return { surahId: s.id, readStatus: "none" as const, memorizeStatus: "none" as const, lastStudyDate: null, difficultAyahs: [], completedAyahs: 0, totalErrors: 0 };
  });
}

export function getDemoStreak(): QuranStreak {
  return { current: 7, longest: 14, lastDate: "2026-10-07", totalDays: 42 };
}

export function getDemoWeeklySummary(): WeeklySummary {
  return {
    totalAyahs: 87,
    totalMinutes: 145,
    surahsWorkedOn: 5,
    xhEarned: 320,
    comparedToLastWeek: 23,
    mostReviewedSurah: "Yâsîn",
  };
}

export function getDemoSpacedItems(): SpacedRepetitionItem[] {
  return [
    { id: "sr-1", surahId: 112, startAyah: 1, endAyah: 4, nextReviewDate: "2026-10-07", intervalIndex: 3, easeFactor: 2.5, reviewCount: 4, lastReviewDate: "2026-09-16" },
    { id: "sr-2", surahId: 113, startAyah: 1, endAyah: 5, nextReviewDate: "2026-10-08", intervalIndex: 2, easeFactor: 2.3, reviewCount: 3, lastReviewDate: "2026-10-01" },
    { id: "sr-3", surahId: 1, startAyah: 1, endAyah: 7, nextReviewDate: "2026-10-10", intervalIndex: 4, easeFactor: 2.8, reviewCount: 6, lastReviewDate: "2026-08-11" },
    { id: "sr-4", surahId: 114, startAyah: 1, endAyah: 6, nextReviewDate: "2026-10-09", intervalIndex: 1, easeFactor: 2.0, reviewCount: 2, lastReviewDate: "2026-10-06" },
    { id: "sr-5", surahId: 78, startAyah: 1, endAyah: 20, nextReviewDate: "2026-10-07", intervalIndex: 0, easeFactor: 2.1, reviewCount: 1, lastReviewDate: "2026-10-06" },
  ];
}
