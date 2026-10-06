export interface FocusBackground {
  id: string;
  label: string;
  description: string;
  emoji: string;
  image: string;
  src: string;
  fallbackGradient: string;
}

// Every selectable scene ships with the app. Missing videos must never be
// presented as working scenes; old persisted choices resolve to the forest.
export const FOCUS_BACKGROUNDS: FocusBackground[] = [
  {
    id: "nature-forest",
    label: "Orman",
    description: "Yeşilin içinde, sakin bir başlangıç.",
    emoji: "🌿",
    image: "/images/focus-forest-ambient.webp",
    src: "",
    fallbackGradient: "linear-gradient(135deg, #123d35, #071c1b)",
  },
  {
    id: "ocean-waves",
    label: "Kıyı",
    description: "Günün son ışığı, denizin dinginliği.",
    emoji: "🌊",
    image: "/images/focus-coast.webp",
    src: "",
    fallbackGradient: "linear-gradient(135deg, #244c57, #102d37)",
  },
  {
    id: "starry-night",
    label: "Yıldızlı Göl",
    description: "Sessiz bir göl, sonsuz bir gökyüzü.",
    emoji: "✨",
    image: "/images/focus-alpine-night.webp",
    src: "",
    fallbackGradient: "linear-gradient(135deg, #19294c, #0b1828)",
  },
  {
    id: "none",
    label: "Sade",
    description: "Yalnızca sen, niyetin ve zaman.",
    emoji: "◐",
    image: "",
    src: "",
    fallbackGradient: "linear-gradient(135deg, #173c36, #091f22)",
  },
];

export function getFocusBackground(id: string): FocusBackground {
  return FOCUS_BACKGROUNDS.find((scene) => scene.id === id) ?? FOCUS_BACKGROUNDS[0];
}
