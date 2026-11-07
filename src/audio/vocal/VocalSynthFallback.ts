/**
 * VocalSynthFallback.ts - 実録WAV未ロード時やオフライン用の合成音素フォールバック
 */

import { Vowel, Consonant } from './phonemeMap';

export class VocalSynthFallback {
  private ctx: AudioContext;
  private vowelBuffers: Map<Vowel, AudioBuffer> = new Map();
  private consonantBuffers: Map<Consonant, AudioBuffer> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.initVowels();
    this.initConsonants();
  }

  public getVowelBuffer(vowel: Vowel): AudioBuffer | undefined {
    return this.vowelBuffers.get(vowel);
  }

  public getConsonantBuffer(consonant: Consonant): AudioBuffer | undefined {
    return this.consonantBuffers.get(consonant) || this.consonantBuffers.get('none');
  }

  private initVowels() {
    const sampleRate = this.ctx.sampleRate;
    const durationSec = 1.0;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const baseFreq = 311.13; // D#4 (重音テトの基本ピッチに合わせる)

    const formantData: Record<Vowel, number[]> = {
      a: [860, 1550, 2850, 3600],
      i: [320, 2600, 3250, 4100],
      u: [380, 1300, 2600, 3700],
      e: [540, 2150, 2950, 3900],
      o: [480, 1050, 2700, 3600]
    };

    const vowels: Vowel[] = ['a', 'i', 'u', 'e', 'o'];
    vowels.forEach((v) => {
      const buffer = this.ctx.createBuffer(1, totalSamples, sampleRate);
      const data = buffer.getChannelData(0);
      const [f1, f2, f3, f4] = formantData[v];
      const numHarmonics = Math.floor((sampleRate / 2) / baseFreq);

      const phases = new Float32Array(numHarmonics);
      for (let h = 1; h < numHarmonics; h++) {
        phases[h] = Math.sin(h * 0.45) * 1.8 + (h % 3 === 0 ? 0.8 : -0.4);
      }

      for (let i = 0; i < totalSamples; i++) {
        let sample = 0;
        const t = i / sampleRate;

        for (let h = 1; h < Math.min(numHarmonics, 40); h++) {
          const freq = h * baseFreq;
          const glottal = 1.0 / Math.pow(h, 1.15);
          const g1 = Math.exp(-Math.pow((freq - f1) / (f1 * 0.22), 2)) * 3.5;
          const g2 = Math.exp(-Math.pow((freq - f2) / (f2 * 0.20), 2)) * 2.5;
          const g3 = Math.exp(-Math.pow((freq - f3) / (f3 * 0.18), 2)) * 1.8;
          const g4 = Math.exp(-Math.pow((freq - f4) / (f4 * 0.16), 2)) * 1.2;
          const amp = glottal * (1.0 + g1 + g2 + g3 + g4);
          sample += amp * Math.sin(2 * Math.PI * freq * t + phases[h]);
        }
        const breath = (Math.random() * 2 - 1) * 0.03;
        data[i] = (sample * 0.14) + breath;
      }

      this.vowelBuffers.set(v, buffer);
    });
  }

  private initConsonants() {
    const sampleRate = this.ctx.sampleRate;

    const createBurst = (durationSec: number, centerFreq: number, q: number, isPlosive: boolean): AudioBuffer => {
      const length = Math.floor(sampleRate * durationSec);
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);

      const w0 = (2 * Math.PI * centerFreq) / sampleRate;
      const alpha = Math.sin(w0) / (2 * q);
      const b0 = alpha;
      const b2 = -alpha;
      const a0 = 1 + alpha;
      const a1 = -2 * Math.cos(w0);
      const a2 = 1 - alpha;

      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = isPlosive ? Math.exp(-t * 14) : Math.sin(t * Math.PI);
        const white = (Math.random() * 2 - 1) * env;
        const y = (b0 / a0) * white + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
        x2 = x1;
        x1 = white;
        y2 = y1;
        y1 = y;
        data[i] = Math.max(-1, Math.min(1, y * 2.5));
      }
      return buffer;
    };

    this.consonantBuffers.set('none', createBurst(0.008, 1200, 1.5, true));
    this.consonantBuffers.set('s', createBurst(0.035, 6500, 2.0, false));
    this.consonantBuffers.set('sh', createBurst(0.040, 5200, 2.5, false));
    this.consonantBuffers.set('k', createBurst(0.016, 4200, 3.0, true));
    this.consonantBuffers.set('t', createBurst(0.014, 4500, 3.5, true));
    this.consonantBuffers.set('ch', createBurst(0.025, 4800, 2.5, true));
    this.consonantBuffers.set('z', createBurst(0.030, 3800, 2.0, false));
    this.consonantBuffers.set('p', createBurst(0.014, 3000, 2.0, true));
    this.consonantBuffers.set('b', createBurst(0.016, 1500, 2.0, true));
    this.consonantBuffers.set('d', createBurst(0.014, 2500, 2.5, true));
    this.consonantBuffers.set('g', createBurst(0.016, 2200, 2.5, true));
    this.consonantBuffers.set('m', createBurst(0.025, 300, 1.5, false));
    this.consonantBuffers.set('n', createBurst(0.025, 450, 1.5, false));
    this.consonantBuffers.set('h', createBurst(0.022, 2800, 1.2, false));
    this.consonantBuffers.set('r', createBurst(0.016, 1800, 2.0, true));
    this.consonantBuffers.set('y', createBurst(0.020, 2200, 2.0, false));
    this.consonantBuffers.set('w', createBurst(0.020, 800, 1.5, false));
  }
}

