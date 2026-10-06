export interface FocusBackground {
  id: string;
  label: string;
  emoji: string;
  src: string;
  fallbackGradient: string;
}

export const FOCUS_BACKGROUNDS: FocusBackground[] = [
  {
    id: "kaaba-night",
    label: "Kâbe (Gece)",
    emoji: "🕋",
    src: "/videos/focus/kaaba-night.mp4",
    fallbackGradient:
      "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f1923 100%)",
  },
  {
    id: "kaaba-aerial",
    label: "Kâbe (Havadan)",
    emoji: "🕌",
    src: "/videos/focus/kaaba-aerial.mp4",
    fallbackGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
  },
  {
    id: "masjid-nabawi",
    label: "Mescid-i Nebevî",
    emoji: "🌙",
    src: "/videos/focus/masjid-nabawi.mp4",
    fallbackGradient: "linear-gradient(135deg, #0d1b2a 0%, #1b2838 100%)",
  },
  {
    id: "al-aqsa",
    label: "Mescid-i Aksâ",
    emoji: "🏛️",
    src: "/videos/focus/al-aqsa.mp4",
    fallbackGradient: "linear-gradient(135deg, #2d1b00 0%, #1a1a2e 100%)",
  },
  {
    id: "quds-panorama",
    label: "Kudüs Panorama",
    emoji: "🌅",
    src: "/videos/focus/quds-panorama.mp4",
    fallbackGradient: "linear-gradient(135deg, #4a3728 0%, #1a1a2e 100%)",
  },
  {
    id: "rain",
    label: "Yağmur",
    emoji: "🌧️",
    src: "/videos/focus/rain.mp4",
    fallbackGradient: "linear-gradient(135deg, #1a1a2e 0%, #2d3436 100%)",
  },
  {
    id: "nature-forest",
    label: "Orman",
    emoji: "🌲",
    src: "/videos/focus/forest.mp4",
    fallbackGradient: "linear-gradient(135deg, #0b3d0b 0%, #1a1a2e 100%)",
  },
  {
    id: "ocean-waves",
    label: "Okyanus",
    emoji: "🌊",
    src: "/videos/focus/ocean.mp4",
    fallbackGradient: "linear-gradient(135deg, #0a192f 0%, #1a1a2e 100%)",
  },
  {
    id: "starry-night",
    label: "Yıldızlı Gece",
    emoji: "✨",
    src: "/videos/focus/stars.mp4",
    fallbackGradient: "linear-gradient(135deg, #000000 0%, #0a0a2e 100%)",
  },
  {
    id: "none",
    label: "Video Yok",
    emoji: "🚫",
    src: "",
    fallbackGradient:
      "linear-gradient(135deg, #0F1923 0%, #162032 50%, #0F1923 100%)",
  },
];

export function getFocusBackground(id: string): FocusBackground {
  return (
    FOCUS_BACKGROUNDS.find((background) => background.id === id) ??
    FOCUS_BACKGROUNDS[0]
  );
}
