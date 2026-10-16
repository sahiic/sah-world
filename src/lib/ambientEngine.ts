export type AmbientRecording = {
  id: string;
  name: string;
  note: string;
  file: string;
  source: string;
  author: string;
  license: string;
  licenseUrl: string;
};

export const AMBIENT_RECORDINGS: readonly AmbientRecording[] = [
  {
    id: "rain",
    name: "Yağmur",
    note: "Pencere önünde dingin yağmur",
    file: "/audio/focus/rain.ogg",
    source: "https://commons.wikimedia.org/wiki/File:Rain.ogg",
    author: "ジダネ",
    license: "Kamu malı",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.tr",
  },
  {
    id: "ocean",
    name: "Okyanus",
    note: "Kıyıya ulaşan doğal dalgalar",
    file: "/audio/focus/ocean.ogg",
    source: "https://commons.wikimedia.org/wiki/File:Oceanwavescrushing.ogg",
    author: "Luftrum",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/deed.tr",
  },
  {
    id: "forest",
    name: "Orman Kuşları",
    note: "Gerçek bir orman sabahı",
    file: "/audio/focus/forest-birds.ogg",
    source: "https://commons.wikimedia.org/wiki/File:Birds_forest.ogg",
    author: "Barracuda1983",
    license: "Kamu malı",
    licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/deed.tr",
  },
  {
    id: "stream",
    name: "Dere",
    note: "Taşların arasından akan su",
    file: "/audio/focus/brook.ogg",
    source: "https://commons.wikimedia.org/wiki/File:Brook_sound.ogg",
    author: "TwoWings",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/deed.tr",
  },
  {
    id: "fireplace",
    name: "Kamp Ateşi",
    note: "Sakin, doğal odun çıtırtısı",
    file: "/audio/focus/campfire.ogg",
    source: "https://commons.wikimedia.org/wiki/File:Campfire_sound_ambience.ogg",
    author: "Glaneur de sons",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/deed.tr",
  },
  {
    id: "wind",
    name: "Ağaçlarda Rüzgâr",
    note: "Dalların arasından geçen esinti",
    file: "/audio/focus/wind.oga",
    source: "https://commons.wikimedia.org/wiki/File:Sound_of_wind_through_Singing_Ringing_Tree_in_a_foggy_December_afternoon.oga",
    author: "Lajmmoore",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.tr",
  },
  {
    id: "night-garden",
    name: "Gece Bahçesi",
    note: "Gölet kıyısında gece canlıları",
    file: "/audio/focus/night-pond.ogg",
    source: "https://commons.wikimedia.org/wiki/File:Nature_sounds_ambience_in_a_Dordogne_pond.ogg",
    author: "Glaneur de sons",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/deed.tr",
  },
] as const;

export const AMBIENT_PROFILES = AMBIENT_RECORDINGS.map((recording) => recording.id);

type Channel = { audio: HTMLAudioElement; level: number };

class AmbientEngine {
  private channels = new Map<string, Channel>();
  private listeners = new Set<() => void>();
  private status = "";
  private unlocked = false;
  private masterVolume = 0.65;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  snapshot = () => this.status;

  private report(message: string) {
    if (this.status === message) return;
    this.status = message;
    this.listeners.forEach((listener) => listener());
  }

  async unlock() {
    this.unlocked = true;
    try {
      await Promise.all([...this.channels.values()].map(({ audio }) => audio.play()));
      this.report("");
      return true;
    } catch {
      this.report("Tarayıcı sesi engelledi. Dinlemeyi aç düğmesine yeniden bas.");
      return false;
    }
  }

  sync(volumes: Record<string, number>, volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    const requested = Object.entries(volumes).filter(
      ([id, level]) => AMBIENT_PROFILES.includes(id) && level > 0,
    );

    for (const [id, channel] of this.channels) {
      if (requested.some(([requestedId]) => requestedId === id)) continue;
      channel.audio.pause();
      channel.audio.removeAttribute("src");
      channel.audio.load();
      this.channels.delete(id);
    }

    for (const [id, level] of requested) {
      let channel = this.channels.get(id);
      if (!channel) {
        const recording = AMBIENT_RECORDINGS.find((item) => item.id === id);
        if (!recording) continue;
        const audio = new Audio(recording.file);
        audio.loop = true;
        audio.preload = "auto";
        channel = { audio, level };
        this.channels.set(id, channel);
      }
      channel.level = Math.max(0, Math.min(1, level));
      channel.audio.volume = this.masterVolume * channel.level;
      if (this.unlocked && channel.audio.paused) {
        void channel.audio.play().then(() => this.report("")).catch(() => {
          this.report("Doğa kaydını başlatmak için Dinlemeyi aç düğmesine bas.");
        });
      }
    }

    if (!requested.length || this.masterVolume === 0) this.report("");
    else if (!this.unlocked) this.report("Doğa kaydını başlatmak için Dinlemeyi aç düğmesine bas.");
  }

  stop() {
    for (const channel of this.channels.values()) {
      channel.audio.pause();
      channel.audio.removeAttribute("src");
      channel.audio.load();
    }
    this.channels.clear();
    this.report("");
  }

  chime(volume = 1) {
    if (volume <= 0 || typeof AudioContext === "undefined") return;
    const context = new AudioContext();
    void context.resume();
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const tone = context.createOscillator();
      const gain = context.createGain();
      const at = context.currentTime + index * 0.18;
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.linearRampToValueAtTime(0.06 * Math.min(1, volume), at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.55);
      tone.connect(gain).connect(context.destination);
      tone.start(at);
      tone.stop(at + 0.6);
    });
    window.setTimeout(() => void context.close(), 1200);
  }
}

export const ambientEngine = new AmbientEngine();
