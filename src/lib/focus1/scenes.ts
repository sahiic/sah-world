export const SCENES = [
  {
    id: "lagoon",
    name: "Lagoon",
    src: "/scenes/lagoon.jpg",
    fallback: "#16464c",
  },
  {
    id: "forest",
    name: "Canopy",
    src: "/scenes/forest.jpg",
    fallback: "#102016",
  },
  {
    id: "alpine",
    name: "Alpine",
    src: "/scenes/alpine.jpg",
    fallback: "#1b2c34",
  },
  {
    id: "dusk",
    name: "Dusk",
    src: "/scenes/cove-dusk.jpg",
    fallback: "#3a2818",
  },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export function getScene(id: string) {
  return SCENES.find((scene) => scene.id === id) ?? SCENES[0];
}

export const SOUND_OPTIONS = [
  { id: "none", label: "Quiet", note: "No ambience" },
  { id: "rain", label: "Rain", note: "Soft falling rain" },
  { id: "waves", label: "Waves", note: "A sheltered cove" },
  { id: "forest", label: "Forest", note: "Leaves and distant birds" },
  { id: "fire", label: "Fire", note: "Low crackle" },
] as const;

export type SoundId = (typeof SOUND_OPTIONS)[number]["id"];

export const FOCUS_PRESETS = [15, 25, 45, 50, 60] as const;
export const BREAK_PRESETS = [5, 10, 15] as const;