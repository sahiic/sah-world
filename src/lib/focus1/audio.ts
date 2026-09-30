import type { SoundId } from "./scenes";

function noiseBuffer(ctx: AudioContext, seconds = 2) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function loopNoise(ctx: AudioContext, destination: AudioNode) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, 3);
  source.loop = true;
  source.connect(destination);
  source.start();
  return source;
}

export class CoveAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private extras: AudioNode[] = [];
  private interval: number | null = null;
  private volume = 0.45;

  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    return { ctx: this.ctx, master: this.master! };
  }

  setVolume(next: number) {
    this.volume = Math.min(1, Math.max(0, next));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        this.volume,
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  async start(sound: SoundId, volume = this.volume) {
    this.stop();
    this.setVolume(volume);
    if (sound === "none" || volume <= 0) return;
    const { ctx, master } = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.connect(gain);
    gain.connect(master);
    this.extras.push(filter, gain);

    if (sound === "rain") {
      filter.type = "lowpass";
      filter.frequency.value = 980;
      gain.gain.value = 0.28;
      this.sources.push(loopNoise(ctx, filter));
    } else if (sound === "waves") {
      filter.type = "lowpass";
      filter.frequency.value = 520;
      gain.gain.value = 0.02;
      this.sources.push(loopNoise(ctx, filter));
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.12;
      lfoGain.gain.value = 0.18;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      this.sources.push(lfo);
      this.extras.push(lfoGain);
    } else if (sound === "forest") {
      filter.type = "bandpass";
      filter.frequency.value = 740;
      filter.Q.value = 0.7;
      gain.gain.value = 0.12;
      this.sources.push(loopNoise(ctx, filter));
      this.interval = window.setInterval(() => this.chirp(), 4200);
    } else if (sound === "fire") {
      filter.type = "lowpass";
      filter.frequency.value = 900;
      gain.gain.value = 0.16;
      this.sources.push(loopNoise(ctx, filter));
      this.interval = window.setInterval(() => this.crackle(), 280);
    }
  }

  private chirp() {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    const start = 1400 + Math.random() * 900;
    osc.frequency.setValueAtTime(start, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      start * 0.72,
      this.ctx.currentTime + 0.18,
    );
    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  private crackle() {
    if (!this.ctx || !this.master || Math.random() > 0.55) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 80 + Math.random() * 180;
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  async chime() {
    const { ctx, master } = this.ensure();
    if (ctx.state === "suspended") await ctx.resume();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + index * 0.16;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      osc.connect(gain);
      gain.connect(master);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  }

  stop() {
    if (this.interval) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
    this.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      source.disconnect();
    });
    this.extras.forEach((node) => node.disconnect());
    this.sources = [];
    this.extras = [];
  }
}