// Locally synthesized soundscapes: no external requests or missing MP3s.
type Channel = {
  gain: GainNode;
  nodes: AudioNode[];
  sources: AudioScheduledSourceNode[];
  interval?: number;
};
const profiles: Record<
  string,
  {
    frequency: number;
    gain: number;
    color?: "pink" | "brown";
    wave?: number;
    type?: BiquadFilterType;
  }
> = {
  rain: { frequency: 1600, gain: 0.2 },
  birds: { frequency: 800, gain: 0.015 },
  wind: { frequency: 380, gain: 0.18, wave: 0.09 },
  ocean: { frequency: 600, gain: 0.22, wave: 0.11 },
  fireplace: { frequency: 420, gain: 0.13 },
  forest: { frequency: 1200, gain: 0.045 },
  "white-noise": { frequency: 16000, gain: 0.075 },
  "brown-noise": { frequency: 900, gain: 0.24, color: "brown" },
  "pink-noise": { frequency: 5000, gain: 0.14, color: "pink" },
  stream: { frequency: 2600, gain: 0.17, wave: 0.6 },
  waterfall: { frequency: 3200, gain: 0.16 },
  "night-garden": { frequency: 5000, gain: 0.013, type: "bandpass" },
  fan: { frequency: 280, gain: 0.22 },
  train: { frequency: 600, gain: 0.15, wave: 1.6 },
  "soft-rain": { frequency: 750, gain: 0.15 },
};
export const AMBIENT_PROFILES = Object.keys(profiles);
class AmbientEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private channels = new Map<string, Channel>();
  private listeners = new Set<() => void>();
  private status = "";
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.status;
  private report(message: string) {
    if (this.status === message) return;
    this.status = message;
    this.listeners.forEach((fn) => fn());
  }
  async unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0;
        this.master.connect(this.context.destination);
      }
      await this.context.resume();
      this.report(
        this.context.state === "running"
          ? ""
          : "Ses için yeniden oynat düğmesine bas.",
      );
      return this.context.state === "running";
    } catch {
      this.report("Tarayıcı sesi açamadı. Zamanlayıcın çalışmaya devam eder.");
      return false;
    }
  }
  sync(volumes: Record<string, number>, volume: number) {
    if (!Object.values(volumes).some((v) => v > 0) || volume === 0) this.report("");
    if (!this.context || !this.master || this.context.state !== "running") {
      if (volume > 0 && Object.values(volumes).some((v) => v > 0))
        this.report("Sesleri etkinleştirmek için Dinlemeyi aç düğmesine bas.");
      return;
    }
    const ctx = this.context;
    this.master.gain.setTargetAtTime(
      Math.max(0, Math.min(1, volume)),
      ctx.currentTime,
      0.08,
    );
    for (const [id, channel] of this.channels)
      if (!(volumes[id] > 0)) {
        channel.sources.forEach((source) => {
          try {
            source.stop();
          } catch {}
          source.disconnect();
        });
        channel.nodes.forEach((node) => node.disconnect());
        if (channel.interval) window.clearInterval(channel.interval);
        this.channels.delete(id);
      }
    for (const [id, value] of Object.entries(volumes)) {
      if (!(value > 0) || !profiles[id]) continue;
      let channel = this.channels.get(id);
      if (!channel) {
        channel = this.create(id);
        this.channels.set(id, channel);
      }
      channel.gain.gain.setTargetAtTime(
        Math.min(1, value),
        ctx.currentTime,
        0.1,
      );
    }
  }
  private create(id: string): Channel {
    const ctx = this.context!,
      profile = profiles[id];
    const channel: Channel = { gain: ctx.createGain(), nodes: [], sources: [] };
    channel.gain.gain.value = 0;
    channel.gain.connect(this.master!);
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    let last = 0,
      pink = 0;
    for (let i = 0; i < samples.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      pink = 0.97 * pink + 0.03 * white;
      samples[i] =
        profile.color === "brown"
          ? last * 3.5
          : profile.color === "pink"
            ? pink * 3
            : white;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = profile.type ?? "lowpass";
    filter.frequency.value = profile.frequency;
    const texture = ctx.createGain();
    texture.gain.value = profile.gain;
    source.connect(filter).connect(texture).connect(channel.gain);
    source.start();
    channel.sources.push(source);
    channel.nodes.push(filter, texture, channel.gain);
    if (profile.wave) {
      const lfo = ctx.createOscillator(),
        depth = ctx.createGain();
      lfo.frequency.value = profile.wave;
      depth.gain.value = profile.gain * 0.65;
      lfo.connect(depth).connect(texture.gain);
      lfo.start();
      channel.sources.push(lfo);
      channel.nodes.push(depth);
    }
    if (["birds", "forest", "fireplace", "night-garden"].includes(id)) {
      channel.interval = window.setInterval(
        () => {
          const tone = ctx.createOscillator(),
            gain = ctx.createGain();
          const t = ctx.currentTime;
          tone.frequency.setValueAtTime(
            id === "fireplace"
              ? 110 + Math.random() * 130
              : 1600 + Math.random() * 2200,
            t,
          );
          tone.frequency.exponentialRampToValueAtTime(
            id === "fireplace" ? 70 : 1200,
            t + 0.15,
          );
          tone.type = id === "fireplace" ? "triangle" : "sine";
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(
            id === "fireplace" ? 0.015 : 0.027,
            t + 0.025,
          );
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
          tone.connect(gain).connect(channel.gain);
          tone.start();
          tone.stop(t + 0.24);
          tone.onended = () => {
            tone.disconnect();
            gain.disconnect();
          };
        },
        id === "fireplace" ? 400 : id === "night-garden" ? 700 : 3200,
      );
    }
    return channel;
  }
  stop() {
    this.sync({}, 0);
  }
  chime(volume = 1) {
    if (!this.context || this.context.state !== "running" || volume <= 0)
      return;
    const ctx = this.context;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const tone = ctx.createOscillator(),
        gain = ctx.createGain(),
        t = ctx.currentTime + index * 0.18;
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06 * Math.min(1, volume), t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      tone.connect(gain).connect(ctx.destination);
      tone.start(t);
      tone.stop(t + 0.6);
      tone.onended = () => {
        tone.disconnect();
        gain.disconnect();
      };
    });
  }
}
export const ambientEngine = new AmbientEngine();
