export interface MosqueProfile {
  name: string;
  campus: string;
  city: string;
  eyebrow: string;
  description: string;
}

export const DEFAULT_MOSQUE: MosqueProfile = {
  name: "Şehit Astsubay Ömer Halisdemir Camii",
  campus: "Bursa Teknik Üniversitesi",
  city: "Bursa",
  eyebrow: "BURSA TEKNİK ÜNİVERSİTESİ · MESCİDİM",
  description:
    "Vakitlerin, tefekkürün ve üniversite topluluğunun ortak hafızası.",
};

export function getMosqueProfile(): MosqueProfile {
  return DEFAULT_MOSQUE;
}
