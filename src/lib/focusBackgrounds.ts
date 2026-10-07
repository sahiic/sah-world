export interface FocusBackground {
  id: string;
  label: string;
  description: string;
  emoji: string;
  image: string;
  src: string;
  fallbackGradient: string;
  credit?: {
    author: string;
    source: string;
    license: string;
    licenseUrl: string;
  };
}

// Every selectable scene ships with the app. Missing videos must never be
// presented as working scenes; old persisted choices resolve to the forest.
export const FOCUS_BACKGROUNDS: FocusBackground[] = [
  {
    id: "kaaba-night",
    label: "Kâbe",
    description: "Mekke · Mescid-i Haram",
    emoji: "🕋",
    image: "/images/focus-kaaba.webp",
    src: "",
    fallbackGradient: "linear-gradient(135deg,#382f27,#131e21)",
    credit: {
      author: "Richard Mortel",
      source:
        "https://commons.wikimedia.org/wiki/File:The_Kabah_in_the_Grand_Mosque_of_Makkah_from_the_second_floor,_Saudi_Arabia_(7)_(52501682079).jpg",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    },
  },
  {
    id: "masjid-nabawi",
    label: "Mescid-i Nebevî",
    description: "Medine · Huzurun avlusu",
    emoji: "☾",
    image: "/images/focus-nabawi.webp",
    src: "",
    fallbackGradient: "linear-gradient(135deg,#383b32,#14272a)",
    credit: {
      author: "Vebra",
      source:
        "https://commons.wikimedia.org/wiki/File:Al-Masjid_al-Nabawi,_Medina_-_panoramio.jpg",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
  },
  {
    id: "masjid-aqsa",
    label: "Mescid-i Aksâ",
    description: "Kudüs · Kıble Mescidi",
    emoji: "☾",
    image: "/images/focus-aqsa.webp",
    src: "",
    fallbackGradient: "linear-gradient(135deg,#3c3c2c,#152626)",
    credit: {
      author: "Eassa",
      source:
        "https://commons.wikimedia.org/wiki/File:Al-Aqsa_Mosque,_Jerusalem_-_Exterior_-_panoramio.jpg",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    },
  },
  {
    id: "umayyad-mosque",
    label: "Şam Emevî Camii",
    description: "Şam · Tarihin içinden bir avlu",
    emoji: "☾",
    image: "/images/focus-umayyad.webp",
    src: "",
    fallbackGradient: "linear-gradient(135deg,#433e32,#142525)",
    credit: {
      author: "Vyacheslav Argenberg",
      source:
        "https://commons.wikimedia.org/wiki/File:The_Umayyad_Mosque,_Courtyard,_Damascus,_Syria.jpg",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    },
  },
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
  return (
    FOCUS_BACKGROUNDS.find((scene) => scene.id === id) ??
    FOCUS_BACKGROUNDS.find((scene) => scene.id === "nature-forest")!
  );
}
